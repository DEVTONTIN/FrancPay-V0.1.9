import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface WalletDrawerProps {
  open: boolean;
  form: { address: string; amount: string; note: string };
  status: 'idle' | 'success' | 'error';
  onChange: (form: { address: string; amount: string; note: string }) => void;
  onClose: () => void;
  onConfirm: () => void;
  onError: () => void;
}

export const WalletDrawer: React.FC<WalletDrawerProps> = ({
  open,
  form,
  status,
  onChange,
  onClose,
  onConfirm,
  onError,
}) => {
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
          {status === 'success' && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              Paiement transmis au wallet TON.
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Impossible de signer la transaction. Merci de reessayer.
            </div>
          )}
          <div className="flex gap-3">
            <Button className="flex-1 rounded-xl bg-emerald-500 text-slate-950 font-semibold" onClick={onConfirm}>
              Confirmer l'envoi
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-red-500/60 text-red-200 hover:bg-red-500/10"
              onClick={onError}
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
