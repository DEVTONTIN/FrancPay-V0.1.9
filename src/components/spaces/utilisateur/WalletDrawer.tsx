import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { TRANSFER_FEE_LABEL } from '@/config/fees';

interface WalletDrawerProps {
  open: boolean;
  form: { address: string; amount: string; note: string };
  status: 'idle' | 'pending' | 'success' | 'error';
  statusMessage?: string | null;
  onChange: (form: { address: string; amount: string; note: string }) => void;
  onClose: () => void;
  onConfirm: () => void;
  onError: () => void;
}

export const WalletDrawer: React.FC<WalletDrawerProps> = ({
  open,
  form,
  status,
  statusMessage,
  onChange,
  onClose,
  onConfirm,
  onError,
}) => {
  const isPending = status === 'pending';
  const resolvedMessage =
    statusMessage ||
    (status === 'success'
      ? 'Paiement transmis au wallet TON.'
      : status === 'error'
      ? 'Impossible de signer la transaction. Merci de verifier ton solde.'
      : '');

  return (
    <Drawer open={open} onOpenChange={(value) => {
      if (!value) onClose();
    }}>
      <DrawerContent className="h-[75vh] bg-slate-950 text-white border-slate-800">
        <DrawerHeader className="text-left">
          <DrawerTitle>Envoyer vers un wallet TON</DrawerTitle>
          <DrawerDescription className="text-slate-400">
            Confirmez le montant et l'adresse avant signature.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Adresse TON</Label>
            <Input
              value={form.address}
              onChange={(e) => onChange({ ...form, address: e.target.value })}
              placeholder="ton://wallet"
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Montant (FRE)</Label>
            <Input
              value={form.amount}
              onChange={(e) => onChange({ ...form, amount: e.target.value })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Note (optionnel)</Label>
            <Input
              value={form.note}
              onChange={(e) => onChange({ ...form, note: e.target.value })}
              placeholder="Reference interne"
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          {status === 'pending' && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Validation de la transaction en cours...
            </div>
          )}
          {status === 'success' && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              {resolvedMessage}
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              {resolvedMessage}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Frais fixe de {TRANSFER_FEE_LABEL} appliquǸ pour chaque envoi via TON.
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-xl bg-emerald-500 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? 'Validation...' : "Confirmer l'envoi"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-red-500/60 text-red-200 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onError}
              disabled={isPending}
            >
              Marquer en echec
            </Button>
          </div>
        </div>
        <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};
