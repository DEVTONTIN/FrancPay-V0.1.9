import { useState } from 'react';
import { ShieldCheck, Users, Loader2, Chrome } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SpaceType = 'professional' | 'utilisateur';
type AuthMode = 'login' | 'register';

type AuthState = {
  email: string;
  password: string;
  mode: AuthMode;
  loading: boolean;
  oauthLoading: boolean;
};

const spaceConfig: Record<
  SpaceType,
  {
    title: string;
    subtitle: string;
    bullets: string[];
    accent: string;
    icon: React.ReactNode;
  }
> = {
  professional: {
    title: 'Espace Professionnel',
    subtitle:
      'Centralisez les paiements, cartes collaborateurs et webhooks FrancPay.',
    bullets: [
      'Onboarding KYC complet et équipes illimitées',
      'Tableau de bord des règlements Franc Numérique',
      'Accès API sécurisé pour intégrer vos outils métier',
    ],
    accent: 'from-emerald-500 to-cyan-500',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  utilisateur: {
    title: 'Espace Utilisateur',
    subtitle:
      'Suivez vos paiements, remboursements et justificatifs officiels.',
    bullets: [
      'Historique temps réel des tickets et remboursements',
      'Notifications email et mobile paramétrables',
      'Support prioritaire et assistance FrancPay',
    ],
    accent: 'from-indigo-500 to-blue-500',
    icon: <Users className="h-5 w-5" />,
  },
};

const initialAuthState: Record<SpaceType, AuthState> = {
  professional: {
    email: '',
    password: '',
    mode: 'login',
    loading: false,
    oauthLoading: false,
  },
  utilisateur: {
    email: '',
    password: '',
    mode: 'login',
    loading: false,
    oauthLoading: false,
  },
};

export const AuthPortal = () => {
  const { toast } = useToast();
  const [authState, setAuthState] =
    useState<Record<SpaceType, AuthState>>(initialAuthState);

  const updateState = (space: SpaceType, patch: Partial<AuthState>) => {
    setAuthState((prev) => ({
      ...prev,
      [space]: { ...prev[space], ...patch },
    }));
  };

  const handleSubmit = (space: SpaceType) => async (event: React.FormEvent) => {
    event.preventDefault();
    const { email, password, mode } = authState[space];

    if (!email || !password) {
      toast({
        title: 'Informations manquantes',
        description: 'Merci de renseigner un email et un mot de passe.',
        variant: 'destructive',
      });
      return;
    }

    try {
      updateState(space, { loading: true });

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Connexion réussie',
          description: 'Bon retour sur FrancPay.',
        });
        localStorage.setItem(
          'francpay_last_space',
          space === 'professional' ? 'professional' : 'utilisateur'
        );
        window.location.replace(`/?space=${space}`);
        return;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { profile_type: space },
          },
        });
        if (error) throw error;
        toast({
          title: 'Compte créé',
          description:
            'Consultez votre boite mail pour confirmer votre adresse.',
        });
      }
    } catch (error) {
      toast({
        title: 'Action impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Merci de réessayer dans un instant.',
        variant: 'destructive',
      });
    } finally {
      updateState(space, { loading: false });
    }
  };

  const handleGoogle = async (space: SpaceType) => {
    try {
      updateState(space, { oauthLoading: true });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?space=${space}`,
          queryParams: {
            prompt: 'select_account',
          },
          scopes: 'email profile',
        },
      });
      if (error) throw error;
      toast({
        title: 'Redirection Google',
        description: 'Veuillez finaliser la connexion dans la fenêtre Google.',
      });
    } catch (error) {
      toast({
        title: 'Connexion Google refusée',
        description:
          error instanceof Error
            ? error.message
            : 'Google OAuth a renvoyé une erreur.',
        variant: 'destructive',
      });
      updateState(space, { oauthLoading: false });
    }
  };

  const spaces: SpaceType[] = ['professional', 'utilisateur'];

  return (
    <section className="bg-slate-950/70 py-16 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <p className="text-emerald-400 font-semibold uppercase tracking-[0.3em] text-xs">
            Authentification sécurisée
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Deux portails, une seule expérience FrancPay
          </h2>
          <p className="text-slate-300 max-w-3xl mx-auto">
            Choisissez votre parcours utilisateur ou professionnel. Connexion via
            email + mot de passe ou Google OAuth, avec protection renforcée par
            Supabase Auth.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {spaces.map((space) => {
            const state = authState[space];
            const config = spaceConfig[space];
            const modeLabel =
              state.mode === 'login' ? 'Connexion' : 'Inscription';

            return (
              <Card
                key={space}
                className="bg-slate-900/70 border-slate-800 text-white backdrop-blur"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl bg-gradient-to-r text-white shadow',
                        config.accent
                      )}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {config.title}
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        {config.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-400">
                    {config.bullets.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex gap-2 text-sm">
                    <Button
                      type="button"
                      variant={state.mode === 'login' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateState(space, { mode: 'login' })}
                    >
                      Connexion
                    </Button>
                    <Button
                      type="button"
                      variant={state.mode === 'register' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateState(space, { mode: 'register' })}
                    >
                      Inscription
                    </Button>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={handleSubmit(space)}
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`email-${space}`}>Email professionnel</Label>
                      <Input
                        id={`email-${space}`}
                        type="email"
                        placeholder="vous@entreprise.com"
                        value={state.email}
                        onChange={(event) =>
                          updateState(space, { email: event.target.value })
                        }
                        className="bg-slate-900/40 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`password-${space}`}>
                        Mot de passe
                      </Label>
                      <Input
                        id={`password-${space}`}
                        type="password"
                        placeholder="••••••••"
                        value={state.password}
                        onChange={(event) =>
                          updateState(space, { password: event.target.value })
                        }
                        className="bg-slate-900/40 border-slate-800"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      disabled={state.loading}
                    >
                      {state.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `${modeLabel} ${space === 'professional' ? 'Pro' : 'Utilisateur'}`
                      )}
                    </Button>
                  </form>
                </CardContent>

                <CardFooter className="flex-col items-stretch gap-4">
                  <div className="text-xs text-slate-500">
                    {state.mode === 'login'
                      ? 'Mot de passe oublié ? Utilisez Google ou contactez votre administrateur.'
                      : 'Une confirmation sera envoyée à cette adresse.'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-700 text-white hover:bg-slate-800"
                    onClick={() => handleGoogle(space)}
                    disabled={state.oauthLoading}
                  >
                    {state.oauthLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Chrome className="h-4 w-4 mr-2" />
                        Continuer avec Google
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
