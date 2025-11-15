import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { QRCodeGenerator } from '@/components/wallet/QRCodeGenerator';
import { POSInterface } from '@/components/pos/POSInterface';

type EncaissementForm = { amount: string; memo: string };

interface ProfessionalEncaissementSectionProps {
  encaissement: EncaissementForm;
  setEncaissement: React.Dispatch<React.SetStateAction<EncaissementForm>>;
  paymentLink: string;
}

export const ProfessionalEncaissementSection: React.FC<
  ProfessionalEncaissementSectionProps
> = ({ encaissement, setEncaissement, paymentLink }) => (
  <Card className="bg-slate-900/70 border-slate-800">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-emerald-400" />
        Encaissement instantane
      </CardTitle>
      <p className="text-slate-400 text-sm">
        Creez des liens, QRs et utilisez le POS integre.
      </p>
    </CardHeader>
    <CardContent className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <Label>Montant (FRE)</Label>
        <Input
          value={encaissement.amount}
          onChange={(e) =>
            setEncaissement((prev) => ({ ...prev, amount: e.target.value }))
          }
          placeholder="Ex: 150"
          className="bg-slate-900/40 border-slate-800"
        />
        <Label>Memo</Label>
        <Input
          value={encaissement.memo}
          onChange={(e) =>
            setEncaissement((prev) => ({ ...prev, memo: e.target.value }))
          }
          placeholder="Reference interne / client"
          className="bg-slate-900/40 border-slate-800"
        />
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-400"
          disabled={!paymentLink}
          onClick={() => paymentLink && navigator.clipboard.writeText(paymentLink)}
        >
          Copier le lien d'encaissement
        </Button>
      </div>
      <div className="space-y-4">
        <QRCodeGenerator
          paymentLink={paymentLink}
          amount={
            encaissement.amount ? parseFloat(encaissement.amount) : undefined
          }
          memo={encaissement.memo || undefined}
        />
        <POSInterface />
      </div>
    </CardContent>
  </Card>
);
