import { CreditCard, Users, BarChart3 } from 'lucide-react';

type ProTab = 'clients' | 'dashboard' | 'encaissement';

interface ProNavProps {
  active: ProTab;
  onChange: (tab: ProTab) => void;
}

const proItems: Array<{ id: ProTab; label: string; icon: React.ReactNode }> = [
  { id: 'clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { id: 'dashboard', label: 'Board', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'encaissement', label: 'Encaisser', icon: <CreditCard className="h-4 w-4" /> },
];

export const ProNav: React.FC<ProNavProps> = ({ active, onChange }) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur">
      <div className="flex justify-around items-center px-3 py-2">
        {proItems.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <span
                className={`p-1.5 rounded-full ${
                  isActive ? 'bg-emerald-500/10' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
