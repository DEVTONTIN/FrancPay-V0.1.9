import { Address } from '@ton/core';

const WATCH_ADDRESS =
  import.meta.env.VITE_TON_WATCH_ADDRESS ||
  'UQCP0lUbs-Z5Q5saNmRH0WLqL8c0StIw0sGYlKcPdxuFMosC';
const TON_API_KEY = import.meta.env.VITE_TONCENTER_API_KEY || '';
const TON_API_BASE =
  import.meta.env.VITE_TON_TRANSACTIONS_API || 'https://tonapi.io/v2/accounts';
const TON_PROVIDER = (import.meta.env.VITE_TON_PROVIDER || 'tonapi').toLowerCase();

export interface ParsedTonTransaction {
  hash: string;
  lt?: string;
  amountTon: number;
  memo?: string;
  commentNormalized?: string;
  utime?: number;
  metadata?: Record<string, unknown>;
}

export const TON_WATCH_ADDRESS = WATCH_ADDRESS;

type TonApiAddressRef = { address?: string };

type TonApiAction =
  | {
      type: 'JettonTransfer';
      JettonTransfer?: {
        amount?: string;
        jetton?: { address?: string; symbol?: string; decimals?: number };
        recipient?: TonApiAddressRef;
        sender?: TonApiAddressRef;
        comment?: string;
      };
    }
  | {
      type: 'TonTransfer';
      TonTransfer?: {
        amount?: string;
        recipient?: TonApiAddressRef;
        comment?: string;
      };
    }
  | { type: string; [key: string]: any };

type TonApiEvent = {
  event_id?: string;
  lt?: string;
  timestamp?: number;
  actions?: TonApiAction[];
};

type ToncenterTransaction = {
  transaction_id?: { lt?: string; hash?: string };
  in_msg?: { value?: string; message?: string; body?: string; msg_data?: any };
  utime?: number;
};

function resolveAddress(address: string) {
  try {
    const parsed = Address.parseFriendly(address);
    return {
      friendly: parsed.address.toString({ bounceable: true, urlSafe: true }),
      rawHex: Buffer.from(parsed.address.hash).toString('hex'),
    };
  } catch {
    return { friendly: address, rawHex: address.replace(/:/g, '') };
  }
}

function normalizeComment(value?: string | null) {
  return (value || '').replace(/\s+/g, '').toUpperCase();
}

function normalizeTonApiBase(base: string) {
  if (!base || !base.includes('/accounts')) {
    return 'https://tonapi.io/v2/accounts';
  }
  return base;
}

function matchAddress(value: string | undefined, target: { friendly: string; rawHex: string }) {
  if (!value) return false;
  try {
    const parsed = Address.parseFriendly(value);
    const friendly = parsed.address.toString({ bounceable: true, urlSafe: true });
    if (friendly === target.friendly) return true;
    const rawHex = Buffer.from(parsed.address.hash).toString('hex');
    return rawHex === target.rawHex;
  } catch {
    const stripped = value.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    const normalized =
      stripped.length > target.rawHex.length
        ? stripped.slice(stripped.length - target.rawHex.length)
        : stripped;
    return normalized === target.rawHex.toLowerCase() || value === target.friendly;
  }
}

async function fetchFromTonApi(limit: number): Promise<ParsedTonTransaction[]> {
  const target = resolveAddress(WATCH_ADDRESS);
  const base = normalizeTonApiBase(TON_API_BASE);
  const url = `${base.replace(/\/$/, '')}/${target.friendly}/events?limit=${limit}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (TON_API_KEY) headers.Authorization = `Bearer ${TON_API_KEY}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TonAPI ${res.status}: ${await res.text()}`);
  }

  const payload = await res.json();
  const events: TonApiEvent[] = payload?.events ?? payload?.result ?? [];
  const parsed: ParsedTonTransaction[] = [];

  for (const event of events) {
    for (const action of event.actions || []) {
      const jetton = parseJettonAction(action, target, event);
      if (jetton) {
        parsed.push(jetton);
        continue;
      }
      const tonTransfer = parseTonAction(action, target, event);
      if (tonTransfer) {
        parsed.push(tonTransfer);
      }
    }
  }

  return parsed;
}

function parseJettonAction(
  action: TonApiAction,
  recipient: { friendly: string; rawHex: string },
  event: TonApiEvent
): ParsedTonTransaction | null {
  if (action.type !== 'JettonTransfer' || !action.JettonTransfer) return null;
  if (!matchAddress(action.JettonTransfer.recipient?.address, recipient)) return null;

  const amountRaw = Number(action.JettonTransfer.amount ?? '0');
  const decimals =
    action.JettonTransfer.jetton?.decimals ??
    (action as any).JettonTransfer?.decimals ??
    9;
  const amount = amountRaw / 10 ** decimals;
  const memo = action.JettonTransfer.comment || '';

  return {
    hash: event.event_id || '',
    lt: event.lt,
    amountTon: amount,
    memo,
    commentNormalized: normalizeComment(memo),
    utime: event.timestamp,
    metadata: {
      jettonAddress: action.JettonTransfer.jetton?.address,
      jettonSymbol: action.JettonTransfer.jetton?.symbol,
      sender: action.JettonTransfer.sender?.address,
    },
  };
}

function parseTonAction(
  action: TonApiAction,
  recipient: { friendly: string; rawHex: string },
  event: TonApiEvent
): ParsedTonTransaction | null {
  if (action.type !== 'TonTransfer' || !action.TonTransfer) return null;
  if (!matchAddress(action.TonTransfer.recipient?.address, recipient)) return null;
  const amountNano = Number(action.TonTransfer.amount ?? '0');
  const memo = action.TonTransfer.comment || '';
  return {
    hash: event.event_id || '',
    lt: event.lt,
    amountTon: amountNano / 1e9,
    memo,
    commentNormalized: normalizeComment(memo),
    utime: event.timestamp,
  };
}

async function fetchFromToncenter(limit: number): Promise<ParsedTonTransaction[]> {
  const { friendly } = resolveAddress(WATCH_ADDRESS);
  const params = new URLSearchParams({
    address: friendly,
    limit: String(limit),
  });
  if (TON_API_KEY) params.set('api_key', TON_API_KEY);
  const base = TON_API_BASE.includes('toncenter.com')
    ? TON_API_BASE
    : 'https://toncenter.com/api/v2/getTransactions';
  const url = `${base}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Toncenter ${res.status}: ${await res.text()}`);
  }
  const payload = await res.json();
  const txs: ToncenterTransaction[] =
    payload?.result?.transactions ?? payload?.result ?? payload?.transactions ?? [];

  return txs
    .map((tx) => {
      const memo = extractToncenterMemo(tx);
      const amountNano = Number(tx.in_msg?.value ?? '0');
      return {
        hash: tx.transaction_id?.hash || '',
        lt: tx.transaction_id?.lt,
        amountTon: amountNano / 1e9,
        memo,
        commentNormalized: normalizeComment(memo),
        utime: tx.utime,
      };
    })
    .filter((tx) => tx.hash && tx.amountTon > 0);
}

function extractToncenterMemo(tx: ToncenterTransaction) {
  const inMsg = tx.in_msg || {};
  const msgData = inMsg.msg_data || {};
  if (msgData.text) return msgData.text;
  if (msgData.comment) return msgData.comment;
  if (msgData.body) return msgData.body;
  if (msgData.base64) {
    try {
      return Buffer.from(msgData.base64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
  return inMsg.message || inMsg.body || '';
}

export async function fetchTonTransactions(limit = 20): Promise<ParsedTonTransaction[]> {
  if (!WATCH_ADDRESS || typeof fetch !== 'function') return [];

  try {
    if (TON_PROVIDER === 'toncenter') {
      return await fetchFromToncenter(limit);
    }
    const tonApiTxs = await fetchFromTonApi(limit);
    if (!tonApiTxs.length) {
      console.warn('TonAPI returned no events; consider switching to toncenter provider');
    }
    return tonApiTxs;
  } catch (tonApiError) {
    console.warn('TonAPI watcher error', tonApiError);
    if (TON_PROVIDER !== 'toncenter') {
      try {
        return await fetchFromToncenter(limit);
      } catch (toncenterError) {
        console.error('Toncenter fallback failed', toncenterError);
      }
    }
    return [];
  }
}
