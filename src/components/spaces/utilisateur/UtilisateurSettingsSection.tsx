import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut, Settings2 } from 'lucide-react';

const preferenceItems = [
  { title: "Langue de l'application", detail: 'Français (FR)' },
  { title: 'Interface mobile', detail: 'Mode compact' },
  { title: 'Notifications push', detail: 'Actives (24/7)' },
];

const supportItems = [
  { title: "Centre d'aide", description: 'Guides FrancPay, FAQ mobile', action: 'Consulter' },
  { title: 'Support prioritaire', description: 'Chat crypté disponible', action: 'Contacter' },
];

export interface ProfileFormState {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
}

interface UtilisateurSettingsSectionProps {
  profileName: string;
  profileEmail?: string;
  profileDetails: ProfileFormState;
  onLogoutConfirm: () => Promise<void>;
  logoutPending: boolean;
  onOpenProfilePage: () => void;
}

export const UtilisateurSettingsSection: React.FC<UtilisateurSettingsSectionProps> = ({
  profileName,
  profileEmail,
  profileDetails,
  onLogoutConfirm,
  logoutPending,
  onOpenProfilePage,
}) => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleConfirmLogout = async () => {
    await onLogoutConfirm();
    setLogoutDialogOpen(false);
  };

  const displayName = profileName || 'Utilisateur FrancPay';
  const displayEmail = profileDetails.email || profileEmail || 'email inconnu';

  return (
    <>
      <section className="space-y-4 pb-12">
        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 font-semibold flex items-center justify-center text-xl">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profil FrancPay</p>
                <p className="text-lg font-semibold text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{displayEmail}</p>
              </div>
            </div>
            <Button
              className="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
              onClick={onOpenProfilePage}
            >
              Ouvrir la page profil
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Settings2 className="h-4 w-4 text-emerald-400" />
              Préférences rapides
            </div>
            <div className="space-y-2">
              {preferenceItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                  <Settings2 className="h-4 w-4 text-slate-500" />
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
            Se déconnecter
          </Button>
        </div>
      </section>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-slate-950 text-white border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Vous allez être déconnecté de FrancPay sur cet appareil. Continuer ?
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
              {logoutPending ? 'Déconnexion...' : 'Confirmer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
