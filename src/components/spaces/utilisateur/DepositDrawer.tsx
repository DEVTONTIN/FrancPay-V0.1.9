import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCcw, ShieldCheck, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { supabase } from '@/lib/supabaseClient';
import { beginCell } from '@ton/core';
import { Buffer } from 'buffer';

interface DepositDrawerProps {
  open: boolean;
  onClose: () => void;
  depositTag?: string;
  onManualRefresh?: () => void;
  onDeposited?: () => void;
}

const DEPOSIT_ADDRESS = 'UQCP0lUbs-Z5Q5saNmRH0WLqL8c0StIw0sGYlKcPdxuFMosC';

export const DepositDrawer: React.FC<DepositDrawerProps> = ({
  open,
  onClose,
  depositTag,
  onManualRefresh,
  onDeposited,
}) => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const readableTag = depositTag || 'FRP-TAG';

  useEffect(() => {
    if (!open) {
      setAmount('');
      setStatus('idle');
      setStatusMessage('');
    }
  }, [open]);

const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage('Copie dans le presse-papiers');
      setTimeout(() => setStatusMessage(''), 1600);
    } catch {
      setStatusMessage('Impossible de copier');
      setTimeout(() => setStatusMessage(''), 1600);
    }
  };

  const buildCommentPayload = (comment?: string) => {
    if (!comment) return undefined;
    return beginCell().storeUint(0, 32).storeBuffer(Buffer.from(comment)).endCell().toBoc().toString('base64');
  };

  const handleTonDeposit = async () => {
    if (!wallet) {
      setStatus('error');
      setStatusMessage('Connecte un wallet TonConnect avant de deposer.');
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setStatus('error');
      setStatusMessage('Montant invalide.');
      return;
    }

    setStatus('sending');
    setStatusMessage('Signature en cours dans TonConnect...');

    try {
      const payload = buildCommentPayload(readableTag);
      const tonAmount = BigInt(Math.round(numericAmount * 1e9));
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: DEPOSIT_ADDRESS,
            amount: tonAmount.toString(),
            payload,
          },
        ],
      });

      const { error } = await supabase.rpc('rpc_user_wallet_deposit', {
        p_counterparty: wallet.account?.address || 'TonConnect wallet',
        p_amount: numericAmount,
        p_metadata: {
          tag: readableTag,
          tonWallet: wallet.account?.address || null,
          source: 'tonconnect',
        },
      });

      if (error) {
        throw error;
      }

      setStatus('success');
      setStatusMessage('Depot enregistre. Actualisation du solde...');
      onDeposited?.();
    } catch (error) {
      console.error('TonConnect deposit error', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Depot interrompu. Verifie TonConnect et reessaie.');
    }
  };

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent className="h-[80vh] bg-slate-950 text-white border-slate-800">
        <DrawerHeader className="text-left space-y-2">
          <DrawerTitle>Ajouter des FRE</DrawerTitle>
          <DrawerDescription className="text-slate-400">
            Connecte ton wallet, choisis le montant et valide dans TonConnect. Ton tag suit chaque depot.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-4 space-y-5 text-sm">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tag unique FrancPay</p>
            <div className="flex gap-2">
              <Input readOnly value={readableTag} className="bg-slate-900 border-slate-800 text-white text-base" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(readableTag)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Chaque depot doit inclure ce tag (commentaire) pour garantir l attribution automatique.
            </p>
          </div>

          <div className="space-y-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 text-xs uppercase tracking-[0.3em]">
                <Wallet className="h-4 w-4" />
                TonConnect Classic
              </div>
              <TonConnectButton className="ton-connect-button-classic" />
            </div>
            {wallet ? (
              <p className="text-xs text-emerald-100">
                Wallet connecte: <span className="font-semibold">{wallet.account?.address.slice(0, 8)}...</span>
              </p>
            ) : (
              <p className="text-xs text-emerald-100">Connecte un wallet pour initier le depot.</p>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Montant a deposer (FRE)</p>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-base"
              />
            </div>
            <Button
              className="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-40"
              onClick={handleTonDeposit}
              disabled={!wallet || status === 'sending'}
            >
              Valider dans TonConnect
            </Button>
            {status === 'success' && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Depot envoye, en attente de confirmation.
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="h-4 w-4" />
                {statusMessage}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Adresse TON FrancPay</p>
            <div className="flex gap-2">
              <Input readOnly value={DEPOSIT_ADDRESS} className="bg-slate-900 border-slate-800 text-white text-[13px]" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(DEPOSIT_ADDRESS)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              En cas d envoi manuel, ajoute ton tag dans la note. Sans TonConnect la detection prendra plus de temps.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Securite
            </div>
            <p className="text-sm text-slate-200">
              Les depots sont verifies sur la blockchain avant d etre credites. FrancPay actualise ton solde toutes les 5
              secondes.
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-xl text-slate-200 hover:bg-slate-800/60"
              onClick={onManualRefresh}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Relancer la verification
            </Button>
          </div>

          {status === 'sending' && <p className="text-xs text-slate-400 animate-pulse">{statusMessage}</p>}
          {statusMessage && status !== 'sending' && status !== 'error' && (
            <p className="text-xs text-slate-400">{statusMessage}</p>
          )}
        </div>

        <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};

