import React from 'react';
import { ArrowLeft, UserRound, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SendFundsPageProps {
  visible: boolean;
  onClose: () => void;
  onSendUser: () => void;
  onSendTon: () => void;
}

const sendOptions = [
  {
    id: 'user',
    title: 'Envoyer à un utilisateur',
    description: 'Transfert instantané vers @identifiant FrancPay.',
    icon: UserRound,
  },
  {
    id: 'ton',
    title: 'Envoyer via TON',
    description: 'Adresse publique TON ou TonConnect.',
    icon: Wallet,
  },
];

export const SendFundsPage: React.FC<SendFundsPageProps> = ({ visible, onClose, onSendUser, onSendTon }) => {
  if (!visible) return null;

  const handleSelect = (target: 'user' | 'ton') => {
    onClose();
    if (target === 'user') {
      onSendUser();
    } else {
      onSendTon();
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950 text-white">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Envoyer</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Envoyer des FRE</h2>
          <p className="text-sm text-slate-400">
            Choisis entre un transfert vers un utilisateur FrancPay ou un envoi vers la blockchain TON.
          </p>
        </div>

        <div className="space-y-3">
          {sendOptions.map((option) => (
            <Card
              key={option.id}
              className="cursor-pointer border border-slate-800 bg-slate-900/70 text-left transition hover:border-emerald-500/50"
              onClick={() => handleSelect(option.id === 'user' ? 'user' : 'ton')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-2xl bg-slate-950/80 p-3">
                  <option.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-semibold">{option.title}</p>
                  <p className="text-xs text-slate-400">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
          Les transferts utilisateur → utilisateur sont gratuits. Les envois via TON utilisent ton wallet connecté ou une
          adresse manuelle.
        </div>
      </div>
    </div>
  );
};
