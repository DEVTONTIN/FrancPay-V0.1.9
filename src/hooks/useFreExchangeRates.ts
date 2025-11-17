import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FreExchangeSnapshot = {
  priceUsd: number;
  priceTon: number;
  usdToEur: number;
  updatedAt: string;
};

const parseRateValue = (value: string | number | null | undefined, label: string) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`${label} invalide dans FrePriceSnapshot.`);
  }
  return numericValue;
};

const fetchLatestSnapshot = async (): Promise<FreExchangeSnapshot> => {
  const { data, error } = await supabase
    .from('FrePriceSnapshot')
    .select('priceUsd, priceTon, usdToEurRate, fetchedAt')
    .order('fetchedAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Aucun snapshot de prix FRE disponible.');
  }

  return {
    priceUsd: parseRateValue(data.priceUsd, 'priceUsd'),
    priceTon: parseRateValue(data.priceTon, 'priceTon'),
    usdToEur: parseRateValue(data.usdToEurRate, 'usdToEurRate'),
    updatedAt: data.fetchedAt || new Date().toISOString(),
  };
};

export const useFreExchangeRates = () => {
  const [rates, setRates] = useState<FreExchangeSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchLatestSnapshot();
      setRates(snapshot);
    } catch (fetchError) {
      console.error('fre_exchange_rates_error', fetchError);
      setError('Cours du FRE indisponible pour le moment.');
      setRates(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const intervalId = window.setInterval(fetchRates, 1000 * 60 * 3);
    return () => window.clearInterval(intervalId);
  }, [fetchRates]);

  return { rates, loading, error, refresh: fetchRates };
};
