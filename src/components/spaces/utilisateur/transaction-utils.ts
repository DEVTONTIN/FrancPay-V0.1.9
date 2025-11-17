import { cn } from '@/lib/utils';

export type TransactionCategory = 'deposit' | 'transfer' | 'wallet' | 'merchant' | 'staking' | 'other';

export interface SupabaseTransactionRow {
  id: string;
  context: string;
  counterparty: string;
  amountFre: number | string;
  feeFre?: number | string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TransactionDetail {
  id: string;
  context: string;
  counterparty: string;
  amount: number;
  fee: number;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  category: TransactionCategory;
  direction: 'in' | 'out' | 'neutral';
  title: string;
}

const sanitizeMetadata = (metadata: unknown): Record<string, unknown> | null => {
  if (!metadata) return null;
  if (Array.isArray(metadata)) return null;
  if (typeof metadata === 'object') {
    return metadata as Record<string, unknown>;
  }
  return null;
};

const includesStakingKeyword = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('staking') || normalized.includes('stake') || normalized.includes('stak');
};

const isStakingWithdrawContext = (context?: string | null) => {
  if (!context) return false;
  const normalized = context.toLowerCase();
  return normalized.includes('withdraw') || normalized.includes('unlock');
};

const resolveMetadataTransactionType = (metadata?: Record<string, unknown> | null) => {
  if (!metadata) return undefined;
  const raw = (metadata as Record<string, unknown>).transactionType;
  return typeof raw === 'string' ? raw.toLowerCase() : undefined;
};

const isStakingWithdraw = (context: string, metadata?: Record<string, unknown> | null) => {
  if (isStakingWithdrawContext(context)) return true;
  const metaType = resolveMetadataTransactionType(metadata);
  return metaType === 'staking_withdraw' || metaType === 'staking_unlock';
};

export const resolveTransactionCategory = (
  context: string,
  extras?: { counterparty?: string; metadata?: Record<string, unknown> | null }
): TransactionCategory => {
  if (includesStakingKeyword(context)) return 'staking';
  const normalized = (context || '').toLowerCase();
  if (normalized.includes('deposit')) return 'deposit';
  if (normalized.includes('merchant') || normalized.includes('payment')) return 'merchant';
  if (normalized.includes('wallet')) return 'wallet';
  if (normalized.includes('transfer') || normalized.includes('contact')) return 'transfer';

  if (includesStakingKeyword(extras?.counterparty)) return 'staking';

  if (extras?.metadata && typeof extras.metadata === 'object') {
    const metadataString = JSON.stringify(extras.metadata).toLowerCase();
    if (includesStakingKeyword(metadataString)) {
      return 'staking';
    }
    if ('productCode' in extras.metadata) {
      return 'staking';
    }
  }
  return 'other';
};

export const transactionCategoryLabels: Record<TransactionCategory, string> = {
  deposit: 'Dépôt',
  transfer: 'Transfert',
  wallet: 'Wallet',
  merchant: 'Paiement',
  staking: 'Staking',
  other: 'Autre',
};

export const transactionCategoryBadge = (category: TransactionCategory) => {
  const base = 'text-xs px-3 py-1 rounded-full border';
  switch (category) {
    case 'deposit':
      return cn(base, 'border-emerald-400 text-emerald-300 bg-emerald-500/10');
    case 'transfer':
      return cn(base, 'border-sky-400 text-sky-200 bg-sky-500/10');
    case 'wallet':
      return cn(base, 'border-indigo-400 text-indigo-200 bg-indigo-500/10');
    case 'merchant':
      return cn(base, 'border-amber-400 text-amber-200 bg-amber-500/10');
    case 'staking':
      return cn(base, 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-500/10');
    default:
      return cn(base, 'border-slate-500 text-slate-300 bg-slate-500/10');
  }
};

const formatCounterparty = (value?: string | null) => value?.trim() || 'FrancPay';

export const formatTransactionTitle = (context: string, counterparty: string, amount: number, metadata?: Record<string, unknown> | null) => {
  const category = resolveTransactionCategory(context, { counterparty, metadata });
  const target = formatCounterparty(counterparty);
  switch (category) {
    case 'deposit':
      return 'Depot on-chain';
    case 'merchant':
      return 'Paiement ' + target;
    case 'wallet':
      return 'Wallet ' + target;
    case 'staking':
      if (isStakingWithdraw(context, metadata)) {
        return 'Retrait staking ' + target;
      }
      return amount >= 0 ? 'Recompense ' + target : 'Blocage ' + target;
    case 'transfer':
      return 'Transfert ' + target;
    default:
      return 'Operation ' + target;
  }
};

export const mapToTransactionDetail = (row: SupabaseTransactionRow): TransactionDetail => {
  const amount = Number(row.amountFre) || 0;
  const fee = Number(row.feeFre) || 0;
  const metadata = sanitizeMetadata(row.metadata);
  const category = resolveTransactionCategory(row.context, { counterparty: row.counterparty, metadata });
  return {
    id: row.id,
    context: row.context,
    counterparty: row.counterparty,
    amount,
    fee,
    createdAt: row.createdAt,
    metadata,
    category,
    direction: amount > 0 ? 'in' : amount < 0 ? 'out' : 'neutral',
    title: formatTransactionTitle(row.context, row.counterparty, amount, metadata),
  };
};

type StakingRewardBucket = {
  id: string;
  productCode?: string | null;
  counterparty: string;
  payoutDate: string;
  latestCreatedAt: string;
  totalAmount: number;
  transactionIds: string[];
  payoutTimestamps: string[];
  entries: Array<{
    id: string;
    amountFre: number;
    createdAt: string;
    payoutAt?: string | null;
    positionId?: string | null;
  }>;
};

const buildRewardBucketId = (productCode: string | null | undefined, dateKey: string) => {
  const normalizedCode = productCode ? productCode.toLowerCase() : 'staking';
  return `stakeagg_${normalizedCode}_${dateKey}`;
};

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const getStringMetadataValue = (metadata: Record<string, unknown> | null, key: string) => {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
};

export const aggregateStakingRewardRows = (rows: SupabaseTransactionRow[]): SupabaseTransactionRow[] => {
  const buckets = new Map<string, StakingRewardBucket>();
  const passthrough: SupabaseTransactionRow[] = [];

  rows.forEach((row) => {
    const metadata = sanitizeMetadata(row.metadata);
    const normalizedRow: SupabaseTransactionRow = { ...row, metadata };
    const amount = Number(row.amountFre) || 0;
    const category = resolveTransactionCategory(row.context, { counterparty: row.counterparty, metadata });
    const isWithdraw = isStakingWithdraw(row.context, metadata);
    const isReward = category === 'staking' && amount > 0 && !isWithdraw;
    if (!isReward) {
      passthrough.push(normalizedRow);
      return;
    }

    const payoutValue = getStringMetadataValue(metadata, 'payoutAt');
    const payoutTimestamp = payoutValue ? new Date(payoutValue) : new Date(row.createdAt);
    const dateKey = toDateKey(payoutTimestamp);
    const productCode = getStringMetadataValue(metadata, 'productCode') ?? (row.counterparty || '').toLowerCase();
    const bucketKey = `${productCode || 'staking'}__${dateKey}`;
    const counterparty = row.counterparty || 'Staking';

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        id: buildRewardBucketId(productCode, dateKey),
        productCode,
        counterparty,
        payoutDate: dateKey,
        latestCreatedAt: row.createdAt,
        totalAmount: 0,
        transactionIds: [],
        payoutTimestamps: [],
        entries: [],
      });
    }

    const bucket = buckets.get(bucketKey)!;
    bucket.totalAmount += amount;
    bucket.transactionIds.push(row.id);
    bucket.payoutTimestamps.push(payoutTimestamp.toISOString());
    bucket.entries.push({
      id: row.id,
      amountFre: amount,
      createdAt: row.createdAt,
      payoutAt: payoutValue ?? null,
      positionId: getStringMetadataValue(metadata, 'positionId') ?? null,
    });

    if (new Date(row.createdAt).getTime() > new Date(bucket.latestCreatedAt).getTime()) {
      bucket.latestCreatedAt = row.createdAt;
    }
  });

  const aggregatedRows: SupabaseTransactionRow[] = Array.from(buckets.values()).map((bucket) => ({
    id: bucket.id,
    context: 'staking_reward_aggregate',
    counterparty: bucket.counterparty,
    amountFre: Number(bucket.totalAmount.toFixed(2)),
    feeFre: 0,
    createdAt: bucket.latestCreatedAt,
    metadata: {
      aggregated: true,
      aggregationType: 'staking_reward_daily',
      productCode: bucket.productCode,
      payoutDate: bucket.payoutDate,
      payoutTimeline: bucket.payoutTimestamps,
      transactionIds: bucket.transactionIds,
      entryCount: bucket.transactionIds.length,
      entries: bucket.entries,
    },
  }));

  return [...aggregatedRows, ...passthrough].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const freFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatFreAmount = (value: number, options?: { showSign?: boolean }) => {
  const absolute = Math.abs(value);
  const formatted = freFormatter.format(absolute);
  if (absolute === 0) {
    return options?.showSign ? `+${formatted}` : formatted;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  if (options?.showSign) {
    return `+${formatted}`;
  }
  return formatted;
};
