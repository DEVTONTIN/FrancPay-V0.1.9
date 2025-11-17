import { useCallback, useMemo } from 'react';

export interface WalletBalance {
  fre: number;
  ton: number;
}

const defaultBalance: WalletBalance = { fre: 0, ton: 0 };

/**
 * Temporary stub while TonConnect integration is disabled.
 * Exposes the same API so the rest of the app can keep rendering,
 * but always reports a disconnected wallet.
 */
export const useTonWallet = () => {
  const balance = useMemo(() => defaultBalance, []);

  const sendPayment = useCallback(async (_recipient?: string, _amount?: number, _memo?: string) => {
    throw new Error('TonConnect integration is disabled for now.');
  }, []);

  const generatePaymentLink = useCallback((_amount?: number, _memo?: string) => '', []);

  return {
    wallet: null,
    address: null as string | null,
    balance,
    isLoading: false,
    isConnected: false,
    sendPayment,
    generatePaymentLink,
  };
};
