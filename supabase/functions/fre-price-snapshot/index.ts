import { createClient } from '@supabase/supabase-js';

/**
 * Fetch FRE prices from DexScreener + CoinGecko
 * and push them to Supabase (FrePriceSnapshot table).
 * Run manually or with `--watch`/`FRE_PRICE_WATCH=true` for continuous polling.
 */

const DEXSCREENER_PAIR_URL =
  'https://api.dexscreener.com/latest/dex/pairs/ton/EQA5rtnJriNtvKo4WyqJ4xN9r9P1zFivF0iVEYyYRScntdyk';
const COINGECKO_TON_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd';
const USD_TO_EUR_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=eur';
const FRE_SYMBOL = 'FRE';
const REQUEST_TIMEOUT_MS = 15000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = 'FrePriceSnapshot';

const POLL_INTERVAL_MS = Number(process.env.FRE_PRICE_POLL_INTERVAL_MS ?? '60000');
const SHOULD_WATCH =
  process.argv.includes('--watch') || process.env.FRE_PRICE_WATCH?.toLowerCase() === 'true';

const headers = {
  accept: 'application/json',
  'user-agent': 'fre-market-fetcher/1.0',
};

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const fetchJsonWithTimeout = async (url, label) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`[${label}] HTTP ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      throw new Error(`[${label}] Invalid JSON response: ${jsonError.message}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`[${label}] Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractFrePrice = (pairJson) => {
  const pairEntry = Array.isArray(pairJson?.pairs) ? pairJson.pairs[0] : pairJson?.pair || null;
  if (!pairEntry) {
    throw new Error('Pair entry missing in DexScreener payload.');
  }

  const baseSymbol = String(pairEntry?.baseToken?.symbol || '').trim().toUpperCase();
  const quoteSymbol = String(pairEntry?.quoteToken?.symbol || '').trim().toUpperCase();
  const priceUsd = Number(pairEntry?.priceUsd ?? 0);
  const priceTon = Number(pairEntry?.priceNative ?? 0);

  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('FRE priceUsd missing in DexScreener payload.');
  }
  if (!Number.isFinite(priceTon) || priceTon <= 0) {
    throw new Error('FRE priceNative missing in DexScreener payload.');
  }

  if (baseSymbol !== FRE_SYMBOL && quoteSymbol !== FRE_SYMBOL) {
    throw new Error(`Token ${FRE_SYMBOL} not present in DexScreener pair.`);
  }

  return { priceUsd, priceTon };
};

const extractTonPrice = (payload) => {
  const priceUsd = Number(payload?.['the-open-network']?.usd ?? 0);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('TON price missing in CoinGecko response.');
  }
  return priceUsd;
};

const extractUsdToEurRate = (json) => {
  const rate = Number(json?.usd?.eur);
  if (!Number.isFinite(rate)) {
    throw new Error('USD->EUR rate missing in CoinGecko response.');
  }
  return rate;
};

const formatCurrency = (value, digits = 6) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const persistSnapshot = async (snapshot, rawPayloads) => {
  if (!supabase) {
    console.warn(
      'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist snapshots.'
    );
    return;
  }
  const { error } = await supabase.from(SUPABASE_TABLE).insert({
    source: 'gecko_terminal',
    priceUsd: snapshot.priceUsd,
    priceEur: snapshot.priceEur,
    priceTon: snapshot.priceTon,
    tonPriceUsd: snapshot.tonPriceUsd,
    usdToEurRate: snapshot.usdToEurRate,
    rawPayload: rawPayloads,
  });
  if (error) {
    throw new Error(`supabase_insert_failed: ${error.message}`);
  }
};

const fetchSnapshot = async () => {
  const [pairJson, tonJson, usdEurJson] = await Promise.all([
    fetchJsonWithTimeout(DEXSCREENER_PAIR_URL, 'DexScreener pair'),
    fetchJsonWithTimeout(COINGECKO_TON_PRICE_URL, 'CoinGecko TON price'),
    fetchJsonWithTimeout(USD_TO_EUR_URL, 'USD->EUR rate'),
  ]);

  const { priceUsd, priceTon } = extractFrePrice(pairJson);
  const tonPriceUsd = extractTonPrice(tonJson);
  const usdToEurRate = extractUsdToEurRate(usdEurJson);
  const priceEur = priceUsd * usdToEurRate;
  const priceTonEquivalent = priceUsd / tonPriceUsd;

  return {
    snapshot: {
      priceUsd,
      priceEur,
      priceTon: priceTonEquivalent,
      tonPriceUsd,
      usdToEurRate,
    },
    payloads: {
      pair: pairJson,
      ton: tonJson,
      usdEur: usdEurJson,
    },
  };
};

const logSnapshot = (snapshot) => {
  console.log('--- FRE Market Snapshot ---');
  console.log(`FRE price (USD): ${formatCurrency(snapshot.priceUsd, 6)}`);
  console.log(`FRE price (EUR): ${formatCurrency(snapshot.priceEur, 6)} (USD price x USD->EUR rate)`);
  console.log(`FRE price (TON): ${formatCurrency(snapshot.priceTon, 8)} (USD price / TON price USD)`);
};

const runOnce = async () => {
  try {
    const { snapshot, payloads } = await fetchSnapshot();
    logSnapshot(snapshot);
    await persistSnapshot(snapshot, payloads);
  } catch (error) {
    console.error('❌ Unable to fetch/store FRE market data:', error.message);
    process.exitCode = 1;
  }
};

const start = async () => {
  if (SHOULD_WATCH) {
    console.log(`Watching FRE price feeds every ${POLL_INTERVAL_MS / 1000}s...`);
    await runOnce();
    setInterval(runOnce, POLL_INTERVAL_MS).unref?.();
  } else {
    await runOnce();
  }
};

start().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exitCode = 1;
});
