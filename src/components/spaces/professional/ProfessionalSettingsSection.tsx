import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, ShieldCheck, Bell, Globe, LogOut } from 'lucide-react';

interface ProfessionalSettingsSectionProps {
  onRequestLogout: () => void;
  logoutPending: boolean;
}

const notificationItems = [
  { title: 'Alertes paiement', detail: 'Push et email actifs 24/7' },
  { title: 'Equipe & roles', detail: '4 acces actifs / 1 en attente' },
];

const complianceItems = [
  {
    title: 'Securite multi-facteurs',
    description: 'Toutes les connexions requerent un code Ton Connect ou OTP.',
    icon: ShieldCheck,
  },
  {
    title: 'Validation KYC',
    description: 'Document societe verifie le 15 nov. 2025.',
    icon: Globe,
  },
];

export const ProfessionalSettingsSection: React.FC<
  ProfessionalSettingsSectionProps
> = ({ onRequestLogout, logoutPending }) => (
  <div className="space-y-6">
    <Card className="bg-slate-900/70 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-emerald-400" />
          Parametres Business
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Mettez a jour les preferences de votre organisation et la conformite FrancPay.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {notificationItems.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex items-start gap-3"
          >
            <Bell className="h-4 w-4 text-emerald-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-slate-400">{item.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card className="bg-slate-900/70 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Securite & conformite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {complianceItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex items-start gap-3"
            >
              <Icon className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>
          );
        })}
        <Button
          variant="outline"
          className="w-full rounded-2xl border-red-500/70 text-red-200 hover:bg-red-500/10 flex items-center justify-center gap-2"
          onClick={onRequestLogout}
          disabled={logoutPending}
        >
          <LogOut className="h-4 w-4" />
          {logoutPending ? 'Deconnexion...' : 'Se deconnecter'}
        </Button>
      </CardContent>
    </Card>
  </div>
);
