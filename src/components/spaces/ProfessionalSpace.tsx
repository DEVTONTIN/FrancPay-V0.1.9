import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTonWallet } from '@/hooks/useTonWallet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabaseClient';
import { ProfessionalDashboardSection } from '@/components/spaces/professional/ProfessionalDashboardSection';
import { ProfessionalClientsSection } from '@/components/spaces/professional/ProfessionalClientsSection';
import { ProfessionalEncaissementSection } from '@/components/spaces/professional/ProfessionalEncaissementSection';
import { ProfessionalSettingsSection } from '@/components/spaces/professional/ProfessionalSettingsSection';

type ProSection = 'dashboard' | 'clients' | 'encaissement' | 'settings';

interface ProfessionalSpaceProps {
  activeSection?: ProSection;
  onSectionChange?: (section: ProSection) => void;
}

export const ProfessionalSpace: React.FC<ProfessionalSpaceProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { generatePaymentLink } = useTonWallet();
  const [internalSection, setInternalSection] =
    useState<ProSection>('dashboard');
  const currentSection = activeSection ?? internalSection;

  const setSection = (section: ProSection) => {
    if (onSectionChange) onSectionChange(section);
    else setInternalSection(section);
  };

  const [encaissement, setEncaissement] = useState({
    amount: '',
    memo: '',
  });

  const paymentLink =
    encaissement.amount && Number(encaissement.amount) > 0
      ? generatePaymentLink(parseFloat(encaissement.amount), encaissement.memo)
      : '';

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setLogoutPending(true);
      await supabase.auth.signOut();
    } finally {
      setLogoutPending(false);
      setLogoutDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Professionnel
              </p>
              <h1 className="text-3xl font-bold">Espace FrancPay Business</h1>
              <p className="text-slate-400 text-sm">
                Suivez vos encaissements, clients et équipes.
              </p>
            </div>
          </div>
        </header>

        <div className="hidden md:flex gap-3">
          {[
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
            { id: 'encaissement', label: 'Encaissement', icon: CreditCard },
            { id: 'settings', label: 'Paramètres', icon: Settings2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentSection === item.id;
            return (
              <Button
                key={item.id}
                onClick={() => setSection(item.id as ProSection)}
                className={`rounded-full text-sm ${
                  active
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {currentSection === 'dashboard' && <ProfessionalDashboardSection />}
        {currentSection === 'clients' && <ProfessionalClientsSection />}
        {currentSection === 'encaissement' && (
          <ProfessionalEncaissementSection
            encaissement={encaissement}
            setEncaissement={setEncaissement}
            paymentLink={paymentLink}
          />
        )}
        {currentSection === 'settings' && (
          <ProfessionalSettingsSection
            onRequestLogout={() => setLogoutDialogOpen(true)}
            logoutPending={logoutPending}
          />
        )}
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-slate-950 text-white border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Cette action fermera votre session FrancPay Business sur cet appareil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-white"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={logoutPending}
            >
              Annuler
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleConfirmLogout}
              disabled={logoutPending}
            >
              {logoutPending ? 'Déconnexion...' : 'Confirmer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
