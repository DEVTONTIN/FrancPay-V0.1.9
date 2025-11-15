import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Award, Coins, Lock, RefreshCcw, ShieldCheck, Clock3, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

type StakeProductRecord = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  apyPercent: number;
  lockPeriodDays: number;
  minAmountFre: number;
  maxAmountFre: number | null;
  isLocked: boolean;
};

type StakePositionRecord = {
  id: string;
  productId?: string;
  principalFre: number;
  rewardAccruedFre: number;
  status: 'ACTIVE' | 'REDEEMED' | 'CANCELLED';
  lockedUntil?: string | null;
  nextRewardAt?: string | null;
  redeemedAt?: string | null;
  createdAt: string;
  productSnapshot?: Record<string, any>;
  product?: StakeProductRecord | null;
};

interface UtilisateurInvestSectionProps {
  authUserId: string | null;
  balanceFre: number;
  onRefreshWallet?: () => Promise<void> | void;
}

const formatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = (value: number) => formatter.format(value || 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return value;
  }
};

const computeDailyReward = (principal: number, apyPercent: number) => {
  if (!principal || !apyPercent) return 0;
  return Number(((principal * apyPercent) / 100 / 365).toFixed(2));
};

const normalizeStakeProductRecord = (input: Record<string, any>, fallbackId?: string): StakeProductRecord => {
  const resolveString = (value: any, fallback: string) =>
    typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  const code = resolveString(input.code, fallbackId ?? 'STAKE');
  const id = resolveString(input.id, fallbackId ?? code);
  return {
    id,
    code,
    title: resolveString(input.title, 'Staking'),
    description:
      typeof input.description === 'string'
        ? input.description
        : input.description === null || input.description === undefined
        ? null
        : String(input.description),
    apyPercent: Number(input.apyPercent ?? 0),
    lockPeriodDays: Number(input.lockPeriodDays ?? 0),
    minAmountFre: Number(input.minAmountFre ?? 0),
    maxAmountFre:
      input.maxAmountFre === null || input.maxAmountFre === undefined ? null : Number(input.maxAmountFre),
    isLocked: Boolean(
      input.isLocked !== undefined ? input.isLocked : Number(input.lockPeriodDays ?? 0) > 0
    ),
  };
};

export const UtilisateurInvestSection: React.FC<UtilisateurInvestSectionProps> = ({
  authUserId,
  balanceFre,
  onRefreshWallet,
}) => {
  const [products, setProducts] = useState<StakeProductRecord[]>([]);
  const [positions, setPositions] = useState<StakePositionRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [stakeInputs, setStakeInputs] = useState<Record<string, string>>({});
  const [pendingStake, setPendingStake] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stakePreview, setStakePreview] = useState<{ product: StakeProductRecord; amount: number } | null>(null);
  const [resultModal, setResultModal] = useState<{ status: 'success' | 'error'; title: string; message: string } | null>(
    null
  );

  const loadInvestData = useCallback(async () => {
    setFetching(true);
    const [{ data: productData, error: productError }, positionResult] = await Promise.all([
      supabase
        .from('StakeProduct')
        .select('*')
        .eq('isActive', true)
        .order('apyPercent', { ascending: false }),
      authUserId
        ? supabase
            .from('UserStakePosition')
            .select(
              'id,productId,principalFre,rewardAccruedFre,status,lockedUntil,nextRewardAt,redeemedAt,createdAt,productSnapshot,product:productId(id,code,title,description,apyPercent,lockPeriodDays,minAmountFre,maxAmountFre,isLocked)'
            )
            .eq('authUserId', authUserId)
            .order('createdAt', { ascending: false })
        : { data: [], error: null },
    ]);

    if (productError) {
      console.error('Stake product fetch error', productError);
    } else if (productData) {
      const normalized: StakeProductRecord[] = (productData ?? []).map((product, index) =>
        normalizeStakeProductRecord(product as Record<string, any>, `STAKE-${index}`)
      );
      setProducts(normalized);
    }

    if ('error' in positionResult && positionResult.error) {
      console.error('Stake position fetch error', positionResult.error);
      setPositions([]);
    } else {
      const normalized: StakePositionRecord[] = (positionResult.data ?? []).map((row, index) => {
        const typedRow = row as Record<string, any>;
        const snapshot = (typedRow.productSnapshot ?? {}) as Record<string, any>;
        const normalizedProduct = typedRow.product
          ? normalizeStakeProductRecord(typedRow.product as Record<string, any>, typedRow.productId)
          : normalizeStakeProductRecord(snapshot, typedRow.productId ?? `POSITION-${index}`);
        const statusValue = (typedRow.status as StakePositionRecord['status']) ?? 'ACTIVE';
        return {
          id: String(typedRow.id ?? `position-${index}`),
          productId: typeof typedRow.productId === 'string' ? typedRow.productId : normalizedProduct.id,
          principalFre: Number(typedRow.principalFre ?? 0),
          rewardAccruedFre: Number(typedRow.rewardAccruedFre ?? 0),
          status: statusValue,
          lockedUntil: typedRow.lockedUntil ?? null,
          nextRewardAt: typedRow.nextRewardAt ?? null,
          redeemedAt: typedRow.redeemedAt ?? null,
          createdAt: typedRow.createdAt ?? new Date().toISOString(),
          productSnapshot: snapshot,
          product: normalizedProduct,
        };
      });
      setPositions(normalized);
    }

    setFetching(false);
  }, [authUserId]);

  useEffect(() => {
    loadInvestData();
  }, [loadInvestData]);

  const handleStakeInputChange = (code: string, value: string) => {
    setStakeInputs((prev) => ({ ...prev, [code]: value }));
  };

  const closeConfirm = () => setStakePreview(null);

  const handleStakePrompt = (product: StakeProductRecord) => {
    if (!authUserId) {
      setFeedback({ type: 'error', message: 'Connectez-vous pour investir.' });
      return;
    }
    const rawValue = stakeInputs[product.code] || '';
    const numericValue = Number(rawValue.replace(',', '.'));
    if (!numericValue || Number.isNaN(numericValue)) {
      setFeedback({ type: 'error', message: 'Saisissez un montant valide.' });
      return;
    }
    if (numericValue < product.minAmountFre) {
      setFeedback({
        type: 'error',
        message: `Minimum ${formatNumber(product.minAmountFre)} FRE requis.`,
      });
      return;
    }
    if (product.maxAmountFre && numericValue > product.maxAmountFre) {
      setFeedback({
        type: 'error',
        message: `Maximum ${formatNumber(product.maxAmountFre)} FRE autorisé pour cette offre.`,
      });
      return;
    }
    if (numericValue > balanceFre) {
      setFeedback({
        type: 'error',
        message: 'Montant supérieur à votre solde disponible.',
      });
      return;
    }

    setStakePreview({ product, amount: numericValue });
    setFeedback(null);
  };

  const confirmStake = async () => {
    if (!stakePreview) return;
    const preview = stakePreview;
    closeConfirm();
    setPendingStake(preview.product.code);
    try {
      const { error } = await supabase.rpc('rpc_user_stake_create', {
        p_product_code: preview.product.code,
        p_amount_fre: preview.amount,
      });
      if (error) throw error;
      setStakeInputs((prev) => ({ ...prev, [preview.product.code]: '' }));
      setResultModal({
        status: 'success',
        title: 'Staking confirmé',
        message: `Votre mise de ${formatNumber(preview.amount)} FRE sur ${preview.product.title} est en cours de synchronisation.`,
      });
      await loadInvestData();
      await onRefreshWallet?.();
    } catch (error) {
      console.error('Stake creation error', error);
      setResultModal({
        status: 'error',
        title: 'Echec du staking',
        message: error instanceof Error ? error.message : 'Impossible de créer la position.',
      });
    } finally {
      setPendingStake(null);
    }
  };

  const handleRedeem = async (position: StakePositionRecord) => {
    if (!authUserId) return;
    setRedeeming(position.id);
    setFeedback(null);
    try {
      const { error } = await supabase.rpc('rpc_user_stake_redeem', {
        p_position_id: position.id,
      });
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Position clôturée, FRE restitués.' });
      await loadInvestData();
      await onRefreshWallet?.();
    } catch (error) {
      console.error('Stake redeem error', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Retrait impossible pour cette position.',
      });
    } finally {
      setRedeeming(null);
    }
  };

  const activePositions = useMemo(() => positions.filter((pos) => pos.status === 'ACTIVE'), [positions]);
  const historicalPositions = useMemo(() => positions.filter((pos) => pos.status !== 'ACTIVE'), [positions]);
  const totalLocked = useMemo(
    () => activePositions.reduce((acc, pos) => acc + pos.principalFre, 0),
    [activePositions]
  );
  const totalRewards = useMemo(
    () => positions.reduce((acc, pos) => acc + pos.rewardAccruedFre, 0),
    [positions]
  );
  const totalDailyReward = useMemo(
    () =>
      activePositions.reduce((acc, pos) => {
        const apy = pos.product?.apyPercent ?? Number(pos.productSnapshot?.apyPercent ?? 0);
        return acc + computeDailyReward(pos.principalFre, apy);
      }, 0),
    [activePositions]
  );
  const nextRewardAt = useMemo(() => {
    const nextDates = activePositions
      .map((pos) => pos.nextRewardAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return nextDates[0];
  }, [activePositions]);

  return (
    <section className="space-y-4">
      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-emerald-400">
            <span>Investir</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-emerald-300 hover:text-emerald-100 hover:bg-slate-800/60"
              onClick={loadInvestData}
              disabled={fetching}
            >
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${fetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-slate-400">Solde disponible</p>
              <p className="text-xl font-semibold">{formatNumber(balanceFre)} FRE</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-slate-400">Capital immobilisé</p>
              <p className="text-xl font-semibold text-emerald-400">{formatNumber(totalLocked)} FRE</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-slate-400">Rewards cumulés</p>
              <p className="text-xl font-semibold text-emerald-300">{formatNumber(totalRewards)} FRE</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-slate-400">Prochaine distribution</p>
              <p className="text-sm font-semibold text-white">{formatDateTime(nextRewardAt)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 col-span-2">
              <p className="text-[11px] text-slate-400">Rewards quotidiens estimés</p>
              <p className="text-xl font-semibold text-emerald-300">
                {formatNumber(totalDailyReward)} FRE
                <span className="text-[11px] text-slate-400 ml-2">/ jour vers 08h00</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
            Rewards versés chaque jour à 08:00 (UTC) automatiquement par FrancPay.
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-100'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.code} className="bg-slate-900/80 border-slate-800 rounded-3xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{product.code}</p>
                  <p className="text-lg font-semibold">{product.title}</p>
                  <p className="text-xs text-slate-400">{product.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{product.apyPercent}%</p>
                  <p className="text-[11px] text-slate-400">APY fixe</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
                <Badge variant="outline" className="border-slate-700 bg-slate-900/60">
                  <Lock className="h-3 w-3 mr-1" />
                  {product.lockPeriodDays > 0 ? `Blocage ${product.lockPeriodDays} jours` : 'Retrait libre'}
                </Badge>
                <Badge variant="outline" className="border-slate-700 bg-slate-900/60">
                  <Award className="h-3 w-3 mr-1" />
                  Paiement quotidien 08h00
                </Badge>
                <Badge variant="outline" className="border-slate-700 bg-slate-900/60">
                  <Coins className="h-3 w-3 mr-1" />
                  Min {formatNumber(product.minAmountFre)} FRE
                  {product.maxAmountFre ? ` · Max ${formatNumber(product.maxAmountFre)} FRE` : ''}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={product.minAmountFre}
                  step="100"
                  placeholder={product.minAmountFre ? product.minAmountFre.toString() : '1000'}
                  value={stakeInputs[product.code] || ''}
                  onChange={(event) => handleStakeInputChange(product.code, event.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-base"
                />
                <Button
                  className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-40"
                  onClick={() => handleStakePrompt(product)}
                  disabled={pendingStake === product.code || fetching}
                >
                  {pendingStake === product.code ? 'Validation...' : 'Commencer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900/80 border-slate-800 rounded-3xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Positions actives
          </div>
          {fetching ? (
            <p className="text-xs text-slate-400">Chargement des positions...</p>
          ) : activePositions.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun staking en cours. Sélectionnez une offre ci-dessus.</p>
          ) : (
            <div className="space-y-3">
              {activePositions.map((position) => {
                const isLockedFuture =
                  Boolean(position.product?.isLocked) &&
                  !!position.lockedUntil &&
                  new Date(position.lockedUntil) > new Date();
                return (
                  <div
                    key={position.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{position.product?.title ?? 'Staking'}</p>
                        <p className="text-[11px] text-slate-500">Créé le {formatDateTime(position.createdAt)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          position.product?.isLocked
                            ? 'border-amber-400/50 text-amber-300'
                            : 'border-emerald-400/50 text-emerald-200'
                        }
                      >
                        {position.product?.isLocked ? 'Bloqué' : 'Flexible'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] text-slate-400">Capital</p>
                        <p className="font-semibold">{formatNumber(position.principalFre)} FRE</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Rewards cumulés</p>
                        <p className="font-semibold text-emerald-300">{formatNumber(position.rewardAccruedFre)} FRE</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Prochaine reward</p>
                        <p className="font-semibold">{formatDateTime(position.nextRewardAt)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Déblocage</p>
                        <p className="font-semibold">
                          {position.product?.isLocked
                            ? formatDateTime(position.lockedUntil)
                            : 'Disponible immédiat'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Reward quotidien</p>
                        <p className="font-semibold text-emerald-200">
                          {formatNumber(
                            computeDailyReward(
                              position.principalFre,
                              position.product?.apyPercent ?? Number(position.productSnapshot?.apyPercent ?? 0)
                            )
                          )}{' '}
                          FRE
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 rounded-xl border-slate-700 text-white hover:bg-slate-800/60 disabled:opacity-40"
                      onClick={() => handleRedeem(position)}
                      disabled={redeeming === position.id || isLockedFuture}
                    >
                      {redeeming === position.id ? 'Traitement...' : 'Retirer'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {historicalPositions.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-900 rounded-3xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Layers className="h-4 w-4 text-slate-400" />
              Historique
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              {historicalPositions.slice(0, 5).map((position) => (
                <div key={position.id} className="flex items-center justify-between border-b border-slate-800/60 pb-2 last:border-0">
                  <div>
                    <p className="text-sm text-white">{position.product?.title ?? 'Staking'}</p>
                    <p className="text-[11px] text-slate-500">
                      Capital {formatNumber(position.principalFre)} FRE · Clôturé le {formatDateTime(position.redeemedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {position.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={Boolean(stakePreview)}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirm();
          }
        }}
      >
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirmer le staking</AlertDialogTitle>
          </AlertDialogHeader>
          {stakePreview && (
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Vous allez immobiliser{' '}
                <span className="text-emerald-400 font-semibold">{formatNumber(stakePreview.amount)} FRE</span> sur
                l&rsquo;offre <span className="font-semibold">{stakePreview.product.title}</span> à{' '}
                {stakePreview.product.apyPercent}% APY.
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-xs">
                <p>Blocage: {stakePreview.product.isLocked ? `${stakePreview.product.lockPeriodDays} jours` : 'Flexible'}</p>
                <p>Rewards quotidiens à 08h00 (UTC) crédités automatiquement.</p>
                <p>
                  Estimation: ~{formatNumber(computeDailyReward(stakePreview.amount, stakePreview.product.apyPercent))} FRE
                  / jour.
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel className="flex-1 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-40"
              onClick={confirmStake}
              disabled={!!pendingStake}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(resultModal)}
        onOpenChange={(open) => {
          if (!open) {
            setResultModal(null);
          }
        }}
      >
        <DialogContent className="bg-slate-950 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {resultModal?.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              )}
              {resultModal?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">{resultModal?.message}</p>
          <div className="mt-4 flex justify-end">
            <Button className="rounded-xl bg-slate-800 text-white" onClick={() => setResultModal(null)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
