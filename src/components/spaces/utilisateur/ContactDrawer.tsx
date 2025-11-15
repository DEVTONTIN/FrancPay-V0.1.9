import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { TRANSFER_FEE_LABEL } from '@/config/fees';

interface ContactDrawerProps {
  open: boolean;
  form: { handle: string; amount: string; note: string };
  status: 'idle' | 'success' | 'error';
  onChange: (form: { handle: string; amount: string; note: string }) => void;
  onClose: () => void;
  onConfirm: () => void;
  onError: () => void;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
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
          <DrawerTitle>Transfert vers un utilisateur FrancPay</DrawerTitle>
          <DrawerDescription className="text-slate-400">
            Selectionnez le contact et confirmez le montant.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Identifiant FrancPay</Label>
            <Input
              value={form.handle}
              onChange={(e) => onChange({ ...form, handle: e.target.value })}
              placeholder="@prenom.nom"
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
            <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Message</Label>
            <Input
              value={form.note}
              onChange={(e) => onChange({ ...form, note: e.target.value })}
              placeholder="Merci pour votre confiance"
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          {status === 'success' && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              Transfert effectue et recu par le contact.
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Verifiez l'identifiant et reessayez.
            </div>
          )}
          <p className="text-xs text-slate-500">
            Frais fixe de {TRANSFER_FEE_LABEL} appliqué aux transferts entre utilisateurs.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 rounded-xl bg-emerald-500 text-slate-950 font-semibold" onClick={onConfirm}>
              Confirmer l'envoi
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-red-500/60 text-red-200 hover:bg-red-500/10"
              onClick={onError}
            >
              Signaler un echec
            </Button>
          </div>
        </div>
        <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};
