import { Wallet2, CreditCard, ShieldCheck, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AccessTarget = 'funds' | 'terminal';

interface ProfessionalAccessPortalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: AccessTarget) => void;
}

const cards = [
  {
    id: 'funds' as AccessTarget,
    title: 'Gestion des Fonds',
    description:
      'Retirez vos gains, gelez vos remboursements et offrez un service client premium.',
    bullets: [
      'Retrait des fonds',
      'Gestion des remboursements',
      'Support client dedie',
    ],
    icon: Wallet2,
    buttonLabel: 'Gestion des Fonds',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-400',
  },
  {
    id: 'terminal' as AccessTarget,
    title: 'Terminal de Vente',
    description:
      'Encaissez avec TPE integre, QR code ou liens de paiement avec suivi en temps reel.',
    bullets: ['Terminal TPE integre', 'Encaissements QR code', 'Suivi des ventes'],
    icon: CreditCard,
    buttonLabel: 'Terminal de Vente',
    buttonClass: 'bg-blue-500 hover:bg-blue-400',
  },
];

export const ProfessionalAccessPortal: React.FC<
  ProfessionalAccessPortalProps
> = ({ open, onClose, onNavigate }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 md:py-12 md:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-white/5"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour a mon espace
          </Button>
          <span className="text-xs uppercase tracking-[0.4em] text-emerald-400">
            Professionnel
          </span>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">
            Accedez a votre <span className="text-emerald-400">Compte Professionnel</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
            Gerez votre activite commerciale et vos finances professionnelles
            en toute serenite. Choisissez l'interface qui correspond a votre besoin immediat.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-2xl"
              >
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{card.description}</p>
                <ul className="space-y-2 text-sm text-slate-200 mb-6">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${card.buttonClass}`}
                  onClick={() => onNavigate(card.id)}
                >
                  {card.buttonLabel} &rarr;
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Accedez aux deux interfaces selon vos besoins du moment.</span>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Suivi en temps reel des volumes, litiges et encaissements.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
