import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Store, UserRound, Wallet, Scan, CheckCircle2 } from 'lucide-react';

type PayAction = 'merchant' | 'contact' | 'wallet';

interface UtilisateurPaySectionProps {
  onOpenContactDrawer: () => void;
  onOpenWalletDrawer: () => void;
  onPersistTransaction: (payload: { type: 'merchant'; target: string; amount: string; fee?: string }) => Promise<void>;
}

const payOptions = [
  {
    id: 'merchant' as PayAction,
    badge: 'Payer un commercant',
    title: 'Flux FrancPay',
    description: 'Scanner un QR ou saisir un code',
    icon: Store,
  },
  {
    id: 'contact' as PayAction,
    badge: 'Transfert utilisateur',
    title: 'Contact FrancPay',
    description: 'Envoyer vers @identifiant',
    icon: UserRound,
  },
  {
    id: 'wallet' as PayAction,
    badge: 'Envoyer vers',
    title: 'Wallet TON',
    description: 'Adresse publique TON',
    icon: Wallet,
  },
];

export const UtilisateurPaySection: React.FC<UtilisateurPaySectionProps> = ({
  onOpenContactDrawer,
  onOpenWalletDrawer,
  onPersistTransaction,
}) => {
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

  const handleOptionSelect = (action: PayAction) => {
    if (action === 'merchant') {
      setMerchantPage(true);
      setMerchantCodeInput('');
      setMerchantAmount('');
      setMerchantTag('');
      setMerchantDetails(null);
      setMerchantDrawerStatus('idle');
      setMerchantCodeError('');
      return;
    }
    if (action === 'contact') {
      onOpenContactDrawer();
    } else if (action === 'wallet') {
      onOpenWalletDrawer();
    }
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
      fee: '0.15 FRE',
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
        {!merchantPage ? (
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-semibold text-white">Choisir une action</p>
              <div className="grid gap-3 text-sm">
                {payOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionSelect(option.id)}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-900/70 p-2">
                        <option.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{option.badge}</p>
                        <p className="mt-1 text-white font-semibold">{option.title}</p>
                        <p className="text-[11px] text-slate-400">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <button type="button" className="text-xs uppercase tracking-[0.3em] text-slate-500" onClick={closeMerchantPage}>
                  Retour
                </button>
                <p className="text-lg font-semibold text-white mt-2">Payer un commercant</p>
                <p className="text-[11px] text-slate-400">
                  Utilisez le QR FrancPay ou saisissez un code commercant pour generer la transaction.
                </p>
              </div>
            </div>

            <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
              <CardContent className="p-4 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
                  <Scan className="mx-auto h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">QR FrancPay</p>
                  <p className="text-xs text-slate-400">
                    Placez le QR du commercant dans le cadre pour preparer votre paiement.
                  </p>
                  <Button className="rounded-full bg-emerald-500/90 text-slate-900 font-semibold" onClick={handleMerchantScan}>
                    Simuler le scan
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Code commercant</Label>
                  <Input
                    value={merchantCodeInput}
                    onChange={(e) => setMerchantCodeInput(e.target.value)}
                    placeholder="0000000000"
                    className="bg-slate-950/60 border-slate-800 text-white"
                  />
                  {merchantCodeError && <p className="text-xs text-red-300">{merchantCodeError}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Montant (FRE)</Label>
                  <Input
                    value={merchantAmount}
                    onChange={(e) => setMerchantAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-950/60 border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Tag / Reference (optionnel)</Label>
                  <Input
                    value={merchantTag}
                    onChange={(e) => setMerchantTag(e.target.value)}
                    placeholder="Ex: #commande-1024"
                    className="bg-slate-950/60 border-slate-800 text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl border-slate-700 text-white" onClick={handleMerchantCodeSubmit}>
                    Utiliser le code
                  </Button>
                  <Button className="flex-1 rounded-2xl bg-emerald-500/90 text-slate-900 font-semibold" onClick={handleMerchantScan}>
                    Valider via QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <Drawer
        open={merchantDrawerOpen}
        onOpenChange={(open) => {
          setMerchantDrawerOpen(open);
          if (!open) setMerchantDrawerStatus('idle');
        }}
      >
        <DrawerContent className="h-[70vh] bg-slate-950 text-white border-slate-800">
          <DrawerHeader className="text-left">
            <DrawerTitle>Confirmation du paiement</DrawerTitle>
            <DrawerDescription className="text-slate-400">
              Verifiez les informations avant de valider votre paiement FrancPay.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-4">
            {merchantDetails ? (
              <>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Commercant</p>
                  <p className="text-lg font-semibold text-white">{merchantDetails.name}</p>
                  <p className="text-xs text-slate-400">Reference {merchantDetails.reference}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Montant</p>
                      <p className="text-xl font-semibold text-white">{merchantDetails.amount} FRE</p>
                    </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tag</p>
                    <p className="text-sm text-white">{merchantDetails.tag ?? 'Aucun'}</p>
                  </div>
                </div>
                {merchantDrawerStatus === 'success' && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5" />
                    Paiement enregistre et notifie au commercant.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 rounded-2xl bg-emerald-500 text-slate-900 font-semibold"
                    onClick={handleMerchantSuccess}
                    disabled={merchantDrawerStatus === 'success'}
                  >
                    Confirmer le paiement
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl border-slate-700 text-white"
                    onClick={() => {
                      setMerchantDrawerOpen(false);
                      setMerchantDrawerStatus('idle');
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Selectionnez un QR ou un code avant de confirmer.</p>
            )}
          </div>
          <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
        </DrawerContent>
      </Drawer>
    </>
  );
};
