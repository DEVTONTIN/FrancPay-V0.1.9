import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Store, Scan, CheckCircle2 } from 'lucide-react';
import { TRANSFER_FEE_FRE, TRANSFER_FEE_LABEL } from '@/config/fees';

interface UtilisateurPaySectionProps {
  onPersistTransaction: (payload: {
    type: 'merchant';
    target: string;
    amount: string;
    fee?: string | number;
  }) => Promise<void>;
}

export const UtilisateurPaySection: React.FC<UtilisateurPaySectionProps> = ({ onPersistTransaction }) => {
  const [merchantPage, setMerchantPage] = useState(false);
  const [merchantCodeInput, setMerchantCodeInput] = useState('');
  const [merchantAmount, setMerchantAmount] = useState('');
  const [merchantTag, setMerchantTag] = useState('');
  const [merchantDetails, setMerchantDetails] = useState<{ name: string; reference: string; amount: string; tag?: string } | null>(
    null
  );
  const [merchantDrawerOpen, setMerchantDrawerOpen] = useState(false);
  const [merchantDrawerStatus, setMerchantDrawerStatus] = useState<'idle' | 'success'>('idle');
  const [merchantCodeError, setMerchantCodeError] = useState('');

  const openMerchantFlow = () => {
    setMerchantPage(true);
    setMerchantCodeInput('');
    setMerchantAmount('');
    setMerchantTag('');
    setMerchantDetails(null);
    setMerchantDrawerStatus('idle');
    setMerchantCodeError('');
  };

  const openMerchantDrawer = (context: { name: string; reference: string; amount: string; tag?: string }) => {
    setMerchantDetails(context);
    setMerchantDrawerStatus('idle');
    setMerchantDrawerOpen(true);
  };

  const handleMerchantScan = () => {
    openMerchantDrawer({
      name: 'QR FrancPay',
      reference: `QR-${Date.now().toString().slice(-6)}`,
      amount: merchantAmount || '0',
      tag: merchantTag || undefined,
    });
  };

  const handleMerchantCodeSubmit = () => {
    if (merchantCodeInput.replace(/\D/g, '').length !== 10) {
      setMerchantCodeError('Le code doit comporter exactement 10 chiffres.');
      return;
    }
    setMerchantCodeError('');
    openMerchantDrawer({
      name: 'Code commercant FrancPay',
      reference: merchantCodeInput,
      amount: merchantAmount || '0',
      tag: merchantTag || undefined,
    });
  };

  const handleMerchantSuccess = async () => {
    if (!merchantDetails) return;
    await onPersistTransaction({
      type: 'merchant',
      target: merchantDetails.reference,
      amount: merchantDetails.amount,
      fee: TRANSFER_FEE_FRE,
    });
    setMerchantDrawerStatus('success');
  };

  const closeMerchantPage = () => {
    setMerchantPage(false);
    setMerchantCodeInput('');
    setMerchantAmount('');
    setMerchantTag('');
    setMerchantDetails(null);
    setMerchantDrawerOpen(false);
    setMerchantDrawerStatus('idle');
    setMerchantCodeError('');
  };

  return (
    <>
      <section className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Payer un commercant</p>
          <h2 className="text-2xl font-semibold text-white">Flux FrancPay</h2>
          <p className="text-sm text-slate-400">Scanne un QR ou saisie un code pour regler un commerçant FrancPay.</p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={openMerchantFlow}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-left transition duration-200 hover:border-emerald-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950/80 p-3">
                <Store className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">Flux FrancPay</p>
                <p className="text-base font-semibold text-white">Scanner ou saisir un code</p>
                <p className="text-xs text-slate-400">
                  Paiement instantané, frais fixe de {TRANSFER_FEE_LABEL}.
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {merchantPage && (
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <button type="button" className="text-emerald-300" onClick={closeMerchantPage}>
              ← Retour
            </button>
            <span>Flux FrancPay</span>
          </div>

          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
            <CardContent className="p-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
                <Scan className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="text-sm font-semibold text-white">QR FrancPay</p>
                <p className="text-xs text-slate-400">
                  Place le QR du commercant dans le cadre pour préparer ton paiement.
                </p>
                <Button className="rounded-full bg-emerald-500/90 text-slate-900 font-semibold" onClick={handleMerchantScan}>
                  Simuler le scan
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Code commerçant</Label>
                <Input
                  inputMode="numeric"
                  value={merchantCodeInput}
                  onChange={(event) => setMerchantCodeInput(event.target.value)}
                  placeholder="1234567890"
                  className="border-slate-800 bg-slate-950 text-white"
                  maxLength={10}
                />
                {merchantCodeError && <p className="text-[11px] text-red-400">{merchantCodeError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Montant (FRE)</Label>
                <Input
                  inputMode="decimal"
                  value={merchantAmount}
                  onChange={(event) => setMerchantAmount(event.target.value)}
                  placeholder="0.00"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Tag optionnel</Label>
                <Input
                  value={merchantTag}
                  onChange={(event) => setMerchantTag(event.target.value)}
                  placeholder="FRP-123"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <Button
                className="w-full rounded-2xl bg-emerald-500 text-slate-900 font-semibold"
                onClick={handleMerchantCodeSubmit}
              >
                Continuer
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <Drawer open={merchantDrawerOpen} onOpenChange={setMerchantDrawerOpen}>
        <DrawerContent className="bg-slate-950 text-white border-slate-900">
          <DrawerHeader>
            <DrawerTitle>Paiement commerçant</DrawerTitle>
            <DrawerDescription>Vérifie les informations avant de confirmer le paiement.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-3 text-sm">
            <p className="text-slate-400">Nom</p>
            <p className="text-white font-semibold">{merchantDetails?.name}</p>
            <p className="text-slate-400">Référence</p>
            <p className="text-white font-mono">{merchantDetails?.reference}</p>
            <p className="text-slate-400">Montant</p>
            <p className="text-2xl font-semibold text-emerald-400">{merchantDetails?.amount || '0'} FRE</p>
            <div>
              <p className="text-slate-400">Frais</p>
              <p className="text-sm text-slate-200">{TRANSFER_FEE_LABEL}</p>
            </div>
            {merchantDetails?.tag && (
              <>
                <p className="text-slate-400">Tag</p>
                <p className="text-white">{merchantDetails.tag}</p>
              </>
            )}
            {merchantDrawerStatus === 'success' ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Paiement enregistré.
              </div>
            ) : (
              <Button className="w-full rounded-2xl bg-emerald-500 text-slate-900 font-semibold" onClick={handleMerchantSuccess}>
                Confirmer le paiement
              </Button>
            )}
          </div>
          <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">Fermer</DrawerClose>
        </DrawerContent>
      </Drawer>
    </>
  );
};
