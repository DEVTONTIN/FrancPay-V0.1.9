import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Phone, CalendarDays, MapPin, ArrowLeft } from 'lucide-react';
import { ProfileFormState } from '@/components/spaces/utilisateur/UtilisateurSettingsSection';

interface UtilisateurProfilePageProps {
  open: boolean;
  onClose: () => void;
  profileName: string;
  profileEmail?: string;
  profileDetails: ProfileFormState;
  onSaveProfile: (data: ProfileFormState) => Promise<{ success: boolean; message?: string }>;
}

const emptyState: ProfileFormState = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  country: '',
};

export const UtilisateurProfilePage: React.FC<UtilisateurProfilePageProps> = ({
  open,
  onClose,
  profileName,
  profileEmail,
  profileDetails,
  onSaveProfile,
}) => {
  const resolvedInitialState = useMemo(() => {
    return {
      ...emptyState,
      ...profileDetails,
    };
  }, [profileDetails]);

  const [formState, setFormState] = useState<ProfileFormState>(resolvedInitialState);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormState(resolvedInitialState);
      setSaveMessage(null);
    }
  }, [open, resolvedInitialState]);

  const handleChange = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    const result = await onSaveProfile(formState);
    setSaving(false);
    setSaveMessage(result.message || (result.success ? 'Profil enregistré.' : 'Impossible d’enregistrer.'));
    if (result.success) {
      setTimeout(() => {
        setSaveMessage(null);
        onClose();
      }, 1200);
    }
  };

  if (!open) {
    return null;
  }

  const readonlyUsername = profileName || 'Utilisateur FrancPay';
  const readonlyEmail = profileDetails.email || profileEmail || 'email inconnu';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-950/95 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center text-sm text-slate-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <p className="text-sm font-semibold">Profil FrancPay</p>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-6 text-sm">
        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
          <div className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 font-semibold flex items-center justify-center">
              {readonlyUsername.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{readonlyUsername}</p>
              <p className="text-xs text-slate-400">{readonlyEmail}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
            Nom d’utilisateur
          </Label>
          <p className="text-[11px] text-slate-500">Non modifiable</p>
          <Input readOnly value={readonlyUsername} className="bg-slate-900 border-slate-800 text-white" />
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Email</Label>
          <p className="text-[11px] text-slate-500">Non modifiable</p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input readOnly value={readonlyEmail} className="bg-slate-900 border-slate-800 text-white pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Nom
            </Label>
            <Input
              id="firstName"
              value={formState.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Prénom
            </Label>
            <Input
              id="lastName"
              value={formState.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Date de naissance
            </Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="birthDate"
                type="date"
                value={formState.birthDate}
                onChange={(event) => handleChange('birthDate', event.target.value)}
                className="bg-slate-900 border-slate-800 text-white pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="phoneNumber"
                type="tel"
                value={formState.phoneNumber}
                onChange={(event) => handleChange('phoneNumber', event.target.value)}
                placeholder="+33 6 ..."
                className="bg-slate-900 border-slate-800 text-white pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Adresse
            </Label>
            <Input
              id="addressLine1"
              value={formState.addressLine1}
              onChange={(event) => handleChange('addressLine1', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Complément
            </Label>
            <Input
              id="addressLine2"
              value={formState.addressLine2}
              onChange={(event) => handleChange('addressLine2', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Code postal
            </Label>
            <Input
              id="postalCode"
              value={formState.postalCode}
              onChange={(event) => handleChange('postalCode', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Ville
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="city"
                value={formState.city}
                onChange={(event) => handleChange('city', event.target.value)}
                className="bg-slate-900 border-slate-800 text-white pl-9"
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="country" className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Pays
            </Label>
            <Input
              id="country"
              value={formState.country}
              onChange={(event) => handleChange('country', event.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
        </div>

        {saveMessage && <p className="text-xs text-emerald-400">{saveMessage}</p>}

        <Button
          className="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
        </Button>
      </div>
    </div>
  );
};

