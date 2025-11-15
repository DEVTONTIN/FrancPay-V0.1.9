import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRightLeft, Info, MoreHorizontal, Share2, Plus } from 'lucide-react';

export interface TransactionDisplay {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
}

interface UtilisateurHomeSectionProps {
  transactions: TransactionDisplay[];
  isLoading?: boolean;
  onShare?: () => void;
  onDeposit?: () => void;
}

const quickActions = [
  { id: 'deposit' as const, label: 'Ajouter', icon: Plus },
  { id: 'move' as const, label: 'Deplacer', icon: ArrowRightLeft },
  { id: 'info' as const, label: 'Infos', icon: Info },
];

export const UtilisateurHomeSection: React.FC<UtilisateurHomeSectionProps> = ({
  transactions,
  isLoading = false,
  onShare,
  onDeposit,
}) => {
  return (
    <>
      <div className="mt-6 flex justify-between gap-4 px-2">
        <button
          type="button"
          onClick={onShare}
          className="flex flex-col items-center gap-1 text-[8px] text-slate-300 tracking-wide focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <span>Partager</span>
        </button>
        {quickActions.map((action) => {
          const handleClick =
            action.id === 'deposit'
              ? onDeposit
              : undefined;
          return (
            <button
              key={action.label}
              type={handleClick ? 'button' : undefined}
              onClick={handleClick}
              className="flex flex-col items-center gap-1 text-[8px] text-slate-400 tracking-wide focus:outline-none"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Offre FrancPay</p>
          <p className="text-xs text-slate-300">
            Inscris-toi sur FrancNumerique.com et beneficie de 50 FRE offerts (limite 31/12/2025).
          </p>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-200">Recent transaction</p>
          <p className="text-[11px] text-slate-400">
            Ici apparaitront les transactions recentes du compte.
          </p>
        </div>
        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">Chargement des transactions…</div>
            ) : transactions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">Aucune transaction recente.</div>
            ) : (
              transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className={`flex justify-between items-center px-4 py-3 ${
                    index < transactions.length - 1 ? 'border-b border-slate-800/70' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{tx.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400">FRE</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
};
