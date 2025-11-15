import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, Lock, Globe, Smartphone, Bell, LogOut, ChevronRight } from 'lucide-react';

const preferenceItems = [
  { icon: Globe, title: "Langue de l'application", detail: 'Francais (FR)' },
  { icon: Smartphone, title: 'Interface mobile', detail: 'Mode compact' },
  { icon: Bell, title: 'Notifications push', detail: 'Actives (24/7)' },
];

const securityItems = [
  { icon: Shield, title: 'Protection avancee', description: 'Biometrie + code PIN' },
  { icon: Lock, title: 'Code d acces', description: 'Modifiable depuis ce mobile' },
];

const supportItems = [
  { title: 'Centre d aide', description: 'Guides FrancPay, FAQ mobile', action: 'Consulter' },
  { title: 'Support prioritaire', description: 'Chat crypte disponible', action: 'Contacter' },
];

interface UtilisateurSettingsSectionProps {
  profileName: string;
  profileEmail?: string;
  onLogoutConfirm: () => Promise<void>;
  logoutPending: boolean;
}

export const UtilisateurSettingsSection: React.FC<UtilisateurSettingsSectionProps> = ({
  profileName,
  profileEmail,
  onLogoutConfirm,
  logoutPending,
}) => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleConfirmLogout = async () => {
    await onLogoutConfirm();
    setLogoutDialogOpen(false);
  };

  return (
    <section className="space-y-4">
      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-400 text-slate-950 font-semibold flex items-center justify-center">
              {(profileName || 'FP').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profil FrancPay</p>
              <p className="text-lg font-semibold text-white">{profileName}</p>
              <p className="text-xs text-slate-400">{profileEmail || 'email inconnu'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="rounded-full border border-slate-700 px-3 py-1">Compte Utilisateur</span>
            <span className="rounded-full border border-slate-700 px-3 py-1">Franc Numerique</span>
            <span className="rounded-full border border-slate-700 px-3 py-1">Plan Mobile</span>
          </div>
          <Button variant="outline" className="w-full rounded-2xl border-slate-700 text-white hover:bg-slate-900/80">
            Mettre a jour le profil
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Preferences</p>
          <div className="space-y-2">
            {preferenceItems.map((item) => (
              <button
                key={item.title}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-left hover:bg-slate-900/50 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-slate-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Securite & controle</p>
          <div className="space-y-3">
            {securityItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex items-start gap-3"
              >
                <item.icon className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Support & ressources</p>
          <div className="space-y-2">
            {supportItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-700 text-white">
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full rounded-2xl border-red-500/60 text-red-200 hover:bg-red-500/10 flex items-center justify-center gap-2"
          onClick={() => setLogoutDialogOpen(true)}
          disabled={logoutPending}
        >
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </Button>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-slate-950 text-white border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la deconnexion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Vous allez etre deconnecte de FrancPay sur cet appareil. Continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <Button variant="outline" className="border-slate-700 text-white" onClick={() => setLogoutDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleConfirmLogout}
              disabled={logoutPending}
            >
              {logoutPending ? 'Deconnexion...' : 'Confirmer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
