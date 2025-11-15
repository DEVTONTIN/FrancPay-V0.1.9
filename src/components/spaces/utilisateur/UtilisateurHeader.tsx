import React from 'react';
import { Menu } from 'lucide-react';

interface UtilisateurHeaderProps {
  username: string;
  showBalance: boolean;
  balanceWhole: string;
  balanceCents: string;
}

export const UtilisateurHeader: React.FC<UtilisateurHeaderProps> = ({
  username,
  showBalance,
  balanceWhole,
  balanceCents,
}) => {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-200">
        <button
          type="button"
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 hover:bg-slate-900 transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-baseline gap-2 text-white">
          <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Compte</span>
          <span className="text-sm font-semibold">{username}</span>
        </div>
      </div>
      {showBalance && (
        <div className="text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">{balanceWhole}</span>
            <span className="text-xl font-semibold tabular-nums">,{balanceCents}</span>
            <span className="text-xl font-semibold text-emerald-400">FRE</span>
          </div>
        </div>
      )}
    </header>
  );
};
