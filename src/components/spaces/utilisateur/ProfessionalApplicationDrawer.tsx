import { useCallback, useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';

type ApplicationStatus = 'pending' | 'approved';

const baseForm = {
  lastName: '',
  firstName: '',
  email: '',
  phoneNumber: '',
  address: '',
  postalCode: '',
  city: '',
  country: '',
  companyName: '',
  legalForm: '',
  siretNumber: '',
  tvaNumber: '',
  businessWebsite: '',
  activityDescription: '',
};

interface ProfessionalApplicationDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (status: ApplicationStatus) => void;
  authUserId: string | null;
  profileEmail?: string;
}

export const ProfessionalApplicationDrawer: React.FC<
  ProfessionalApplicationDrawerProps
> = ({ open, onClose, onSubmitted, authUserId, profileEmail }) => {
  const { toast } = useToast();
  const buildDefaultForm = (email?: string) => ({
    ...baseForm,
    email: email || '',
  });
  const [form, setForm] = useState(() => buildDefaultForm(profileEmail));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(buildDefaultForm(profileEmail));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileEmail]);

  const isFormValid = useMemo(() => {
    return (
      form.lastName.trim() &&
      form.firstName.trim() &&
      form.email.trim() &&
      form.phoneNumber.trim() &&
      form.companyName.trim() &&
      form.legalForm.trim() &&
      form.siretNumber.trim()
    );
  }, [form]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolveProfileId = useCallback(async () => {
    if (!authUserId) return null;
    const { data, error } = await supabase
      .from('UserProfile')
      .select('id')
      .eq('authUserId', authUserId)
      .maybeSingle();
    if (error) {
      console.error('resolve_profile_id_error', error);
      return null;
    }
    return data?.id ?? null;
  }, [authUserId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const resolvedProfileId = await resolveProfileId();
    if (!resolvedProfileId) {
      toast({
        title: 'Profil indisponible',
        description: 'Reessaie dans un instant, ton profil utilisateur est encore en cours de chargement.',
        variant: 'destructive',
      });
      return;
    }
    if (!isFormValid) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Merci de remplir les informations obligatoires.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        submittedAt: new Date().toISOString(),
      };
      const applicationRecord = {
        userProfileId: resolvedProfileId,
        authUserId,
        contactEmail: form.email,
        contactPhone: form.phoneNumber || null,
        lastName: form.lastName,
        firstName: form.firstName,
        addressLine1: form.address || null,
        postalCode: form.postalCode || null,
        city: form.city || null,
        country: form.country || null,
        companyName: form.companyName,
        legalForm: form.legalForm || null,
        siretNumber: form.siretNumber,
        tvaNumber: form.tvaNumber || null,
        businessWebsite: form.businessWebsite || null,
        activityDescription: form.activityDescription || null,
      };

      let status: ApplicationStatus = 'pending';
      let submittedViaFunction = false;
      try {
        const { data, error } = await supabase.functions.invoke(
          'submit-professional-application',
          { body: { ...payload, ...applicationRecord } }
        );
        if (error) throw error;
        submittedViaFunction = true;
        status = data?.status === 'APPROVED' ? 'approved' : 'pending';
      } catch (edgeError) {
        console.warn('submit_professional_application_edge_failed', edgeError);
      }

      if (!submittedViaFunction) {
        const { data, error } = await supabase
          .from('ProfessionalApplication')
          .insert(applicationRecord)
          .select('status')
          .maybeSingle();
        if (error) throw error;
        status = data?.status === 'APPROVED' ? 'approved' : 'pending';
      }

      toast({
        title: 'Demande envoyee',
        description:
          status === 'approved'
            ? 'Acces professionnel confirme instantanement.'
            : 'Notre equipe analyse votre dossier. Vous serez notifie des que la validation sera effectuee.',
      });
      onSubmitted(status);
      setForm(buildDefaultForm(profileEmail));
      onClose();
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : 'Impossible denvoyer le dossier pour le moment.';
      toast({
        title: 'Envoi impossible',
        description,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10 space-y-6">
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
            FrancPay Business
          </span>
        </div>

        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-bold">Devenir Professionnel</h1>
          <p className="text-slate-400">
            Partagez les informations legales de votre entreprise. FrancPay verifie votre dossier sous 24 a 48h.
          </p>
        </div>

        <div className="flex-1 rounded-3xl border border-white/5 bg-slate-950/80 px-6 py-6">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                Informations personnelles
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nom</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="NOM"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prenom</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="Prenom"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Email professionnel</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="vous@entreprise.com"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telephone</Label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) =>
                      handleChange('phoneNumber', e.target.value)
                    }
                    placeholder="+33 6 00 00 00 00"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Adresse</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="12 rue de ..."
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Code postal</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) =>
                      handleChange('postalCode', e.target.value)
                    }
                    placeholder="75000"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Ville</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Paris"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pays</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="France"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Entreprise & conformite
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) =>
                      handleChange('companyName', e.target.value)
                    }
                    placeholder="FrancPay SAS"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Forme juridique</Label>
                  <Input
                    value={form.legalForm}
                    onChange={(e) => handleChange('legalForm', e.target.value)}
                    placeholder="SAS, SARL, Auto-entrepreneur..."
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Numero SIRET</Label>
                  <Input
                    value={form.siretNumber}
                    onChange={(e) =>
                      handleChange('siretNumber', e.target.value)
                    }
                    placeholder="123 456 789 00012"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Numero TVA</Label>
                  <Input
                    value={form.tvaNumber}
                    onChange={(e) =>
                      handleChange('tvaNumber', e.target.value)
                    }
                    placeholder="FRXX999999999"
                    className="bg-slate-900/40 border-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Site web (optionnel)</Label>
                <Input
                  value={form.businessWebsite}
                  onChange={(e) =>
                    handleChange('businessWebsite', e.target.value)
                  }
                  placeholder="https://votre-entreprise.com"
                  className="bg-slate-900/40 border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <Label>Activite & besoins</Label>
                <Textarea
                  value={form.activityDescription}
                  onChange={(e) =>
                    handleChange('activityDescription', e.target.value)
                  }
                  placeholder="Expliquez votre modele economique, les volumes de paiement, les canaux de vente..."
                  className="bg-slate-900/40 border-slate-800 min-h-[120px]"
                />
                <p className="text-[11px] text-slate-500">
                  Ces informations restent confidentielles et servent a
                  configurer vos limites et controles de conformite.
                </p>
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400"
                disabled={submitting}
              >
                {submitting ? 'Transmission...' : 'Envoyer a FrancPay'}
              </Button>
              <p className="text-[11px] text-slate-500 text-center">
                En envoyant ce formulaire vous autorisez FrancPay a verifier vos
                informations legales (KYC/KYB).
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
