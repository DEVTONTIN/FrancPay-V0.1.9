import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { PostgrestError } from '@supabase/supabase-js';
import { UtilisateurHeader } from '@/components/spaces/utilisateur/UtilisateurHeader';
import { UtilisateurHomeSection, TransactionDisplay } from '@/components/spaces/utilisateur/UtilisateurHomeSection';
import { UtilisateurPaySection } from '@/components/spaces/utilisateur/UtilisateurPaySection';
import { UtilisateurSettingsSection, ProfileFormState } from '@/components/spaces/utilisateur/UtilisateurSettingsSection';
import { WalletDrawer } from '@/components/spaces/utilisateur/WalletDrawer';
import { ContactDrawer } from '@/components/spaces/utilisateur/ContactDrawer';
import { ShareDrawer } from '@/components/spaces/utilisateur/ShareDrawer';
import { DepositDrawer } from '@/components/spaces/utilisateur/DepositDrawer';
import { useOnchainDepositSync } from '@/hooks/useOnchainDepositSync';
import { UtilisateurInvestSection } from '@/components/spaces/utilisateur/UtilisateurInvestSection';
import { TransactionHistoryPage } from '@/components/spaces/utilisateur/TransactionHistorySheet';
import { TransactionDetailDrawer } from '@/components/spaces/utilisateur/TransactionDetailDrawer';
import { SendFundsPage } from '@/components/spaces/utilisateur/SendFundsPage';
import { UtilisateurProfilePage } from '@/components/spaces/utilisateur/UtilisateurProfilePage';
import {
  formatFreAmount,
  formatTransactionTitle,
  mapToTransactionDetail,
  SupabaseTransactionRow,
  TransactionDetail,
} from '@/components/spaces/utilisateur/transaction-utils';
import { generateReferralCodeFromId } from '@/lib/referral';

type UtilisateurSection = 'home' | 'invest' | 'settings' | 'pay';

const formatSupabaseError = (error: unknown) => {
  if (!error) return 'Une erreur inattendue est survenue.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof (error as { message?: string }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Impossible de valider cette operation.';
};

interface UtilisateurHomeProps {
  activeSection: UtilisateurSection;
  onChangeSection?: (section: UtilisateurSection) => void;
  historyVisible: boolean;
  onHistoryOpen: () => void;
  onHistoryClose: () => void;
  sendVisible: boolean;
  onSendOpen: () => void;
  onSendClose: () => void;
}

export const UtilisateurHome: React.FC<UtilisateurHomeProps> = ({
  activeSection,
  onChangeSection,
  historyVisible,
  onHistoryOpen,
  onHistoryClose,
  sendVisible,
  onSendOpen,
  onSendClose,
}) => {
  const { toast } = useToast();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [balanceFre, setBalanceFre] = useState<number>(0);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [transfersLocked, setTransfersLocked] = useState(false);
  const [transferLockReason, setTransferLockReason] = useState('');

  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);
  const [walletStatus, setWalletStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [walletForm, setWalletForm] = useState({ address: '', amount: '0', note: '' });

  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ handle: '', amount: '0', note: '' });
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const transactionsLoadedRef = useRef(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<TransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);
  const [profilePageOpen, setProfilePageOpen] = useState(false);
  const defaultProfileDetails: ProfileFormState = useMemo(
    () => ({
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
    }),
    []
  );
  const [profileDetails, setProfileDetails] = useState<ProfileFormState>(defaultProfileDetails);
  const profileSelectColumns =
    'username,referralCode,email,firstName,lastName,birthDate,phoneNumber,addressLine1,addressLine2,postalCode,city,country';

  const mapTransactionRow = useCallback((tx: SupabaseTransactionRow): TransactionDisplay => {
    const amountValue = Number(tx.amountFre) || 0;
    return {
      id: tx.id,
      title: formatTransactionTitle(tx.context, tx.counterparty, amountValue),
      amount: amountValue,
      createdAt: tx.createdAt,
    };
  }, []);

  const ensureProfileRecord = useCallback(
    async (sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, any> | undefined }) => {
      if (!sessionUser?.id) return null;
      const usernameMeta =
        typeof sessionUser.user_metadata?.username === 'string' ? sessionUser.user_metadata.username : undefined;
      const fallbackSeed =
        usernameMeta ||
        sessionUser.email?.split('@')[0] ||
        `francpay_${sessionUser.id.replace(/-/g, '').slice(0, 6)}`;
      const normalizeUsername = (value: string) => {
        const trimmed = value.trim().replace(/\s+/g, '_');
        const sanitized = trimmed.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
        const bounded = sanitized.slice(0, 20).replace(/^_+|_+$/g, '');
        if (bounded) return bounded;
        return `francpay_${Math.random().toString(36).slice(2, 6)}`;
      };
      const fallbackBase = normalizeUsername(fallbackSeed);
      const fallbackEmail = sessionUser.email || `${fallbackBase}@users.francpay.local`;
      const referredByCode =
        typeof sessionUser.user_metadata?.referral_code === 'string'
          ? sessionUser.user_metadata?.referral_code.toUpperCase()
          : null;
      const buildPayload = (usernameCandidate: string) => ({
        authUserId: sessionUser.id,
        username: usernameCandidate,
        email: fallbackEmail,
        profileType: 'UTILISATEUR' as const,
        referralCode: generateReferralCodeFromId(sessionUser.id),
        referredByCode,
      });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate =
          attempt === 0
            ? fallbackBase
            : normalizeUsername(`${fallbackBase}_${Math.random().toString(36).slice(2, 6)}`);
        const { data, error } = await supabase
          .from('UserProfile')
          .insert(buildPayload(candidate))
          .select(profileSelectColumns)
          .maybeSingle();
        if (!error) {
          return data;
        }
        const pgError = error as PostgrestError;
        if (pgError.code !== '23505') {
          console.error('ensure_profile_error', pgError);
          break;
        }
      }

      const { data: existing } = await supabase
        .from('UserProfile')
        .select(profileSelectColumns)
        .eq('authUserId', sessionUser.id)
        .maybeSingle();
      return existing || null;
    },
    [profileSelectColumns]
  );

  const refreshProfile = useCallback(async () => {
    setIsProfileLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setAuthUserId(null);
      setUsername('');
      setProfileEmail('');
      setBalanceFre(0);
      setTransactions([]);
      setTransactionsLoading(false);
      transactionsLoadedRef.current = false;
      setProfileDetails(defaultProfileDetails);
      setTransfersLocked(false);
      setTransferLockReason('');
      setIsProfileLoading(false);
      return;
    }

    setAuthUserId(session.user.id);
    setProfileEmail(session.user.email || '');
    const emailConfirmed = Boolean(session.user.email_confirmed_at || session.user.confirmed_at);
    setTransfersLocked(!emailConfirmed);
    setTransferLockReason(
      emailConfirmed ? '' : 'Valide ton email pour activer les envois vers les utilisateurs FrancPay ou via TON.'
    );

    if (!transactionsLoadedRef.current) {
      setTransactionsLoading(true);
    }

    const [
      { data: profileData, error: profileError },
      { data: balanceData, error: balanceError },
      { data: txData, error: txError },
    ] = await Promise.all([
      supabase
        .from('UserProfile')
        .select(profileSelectColumns)
        .eq('authUserId', session.user.id)
        .maybeSingle(),
      supabase.from('UserWalletBalance').select('balanceFre').eq('authUserId', session.user.id).maybeSingle(),
      supabase
        .from('UserPaymentTransaction')
        .select('id,counterparty,amountFre,createdAt,context')
        .eq('authUserId', session.user.id)
        .order('createdAt', { ascending: false })
        .limit(5),
    ]);

    let resolvedProfile = profileData;
    if (profileError) {
      console.error('Erreur profil', profileError);
    }
    if (!resolvedProfile) {
      resolvedProfile = await ensureProfileRecord(session.user);
    }
    if (resolvedProfile) {
      if (resolvedProfile.username) {
        setUsername(resolvedProfile.username);
      }
      let referralValue = resolvedProfile.referralCode;
      if (!referralValue) {
        const fallbackReferralCode = generateReferralCodeFromId(session.user.id);
        const { data: updatedReferral, error: referralUpdateError } = await supabase
          .from('UserProfile')
          .update({ referralCode: fallbackReferralCode })
          .eq('authUserId', session.user.id)
          .select('referralCode')
          .maybeSingle();
        if (referralUpdateError) {
          console.error('Erreur assignation referral', referralUpdateError);
        }
        referralValue = updatedReferral?.referralCode || fallbackReferralCode;
      }
      setReferralCode(referralValue);
      const resolvedEmail = resolvedProfile.email || session.user.email || `${session.user.id.slice(0, 6)}@users.francpay.local`;
      setProfileEmail(resolvedEmail);
      setProfileDetails({
        firstName: resolvedProfile.firstName ?? '',
        lastName: resolvedProfile.lastName ?? '',
        birthDate: resolvedProfile.birthDate ?? '',
        email: resolvedEmail,
        phoneNumber: resolvedProfile.phoneNumber ?? '',
        addressLine1: resolvedProfile.addressLine1 ?? '',
        addressLine2: resolvedProfile.addressLine2 ?? '',
        postalCode: resolvedProfile.postalCode ?? '',
        city: resolvedProfile.city ?? '',
        country: resolvedProfile.country ?? '',
      });
    } else {
      const fallbackEmail = session.user.email || `${session.user.id.slice(0, 6)}@users.francpay.local`;
      setProfileEmail(fallbackEmail);
    }

    if (balanceError) {
      console.error('Erreur balance', balanceError);
    } else if (balanceData?.balanceFre !== undefined && balanceData?.balanceFre !== null) {
      setBalanceFre(Number(balanceData.balanceFre));
    }

    if (txError) {
      console.error('Erreur transactions', txError);
      setTransactions([]);
    } else if (txData) {
      setTransactions(txData.map(mapTransactionRow));
    }

    if (!transactionsLoadedRef.current) {
      setTransactionsLoading(false);
      transactionsLoadedRef.current = true;
    }
    setIsProfileLoading(false);
  }, [mapTransactionRow, ensureProfileRecord]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleMerchantPayment = useCallback(
    async (payload: { reference: string; amount: string; tag?: string; name?: string }) => {
      const amountValue = Number(payload.amount) || 0;
      if (!payload.reference || amountValue <= 0) {
        return { success: false, message: 'Reference commercant ou montant invalide.' };
      }
      try {
        const { error } = await supabase.rpc('rpc_user_merchant_payment', {
          p_reference: payload.reference,
          p_amount_fre: amountValue,
          p_tag: payload.tag || null,
          p_metadata: {
            merchantName: payload.name,
            initiatedFrom: 'utilisateur_app',
          },
        });
        if (error) throw error;
        await refreshProfile();
        return { success: true, message: 'Paiement commercant valide.' };
      } catch (rpcError) {
        console.error('merchant_payment_error', rpcError);
        return { success: false, message: formatSupabaseError(rpcError) };
      }
    },
    [refreshProfile]
  );

  const handleWalletClose = () => {
    setWalletDrawerOpen(false);
    setWalletStatus('idle');
    setWalletMessage(null);
    setWalletForm({ address: '', amount: '0', note: '' });
  };

  const handleContactClose = () => {
    setContactDrawerOpen(false);
    setContactStatus('idle');
    setContactFeedback(null);
    setContactForm({ handle: '', amount: '0', note: '' });
  };

  const handleWalletConfirm = useCallback(async () => {
    const amountValue = Number(walletForm.amount) || 0;
    if (!walletForm.address || amountValue <= 0) {
      setWalletStatus('error');
      setWalletMessage('Indique une adresse TON valide et un montant positif.');
      return;
    }
    try {
      setWalletStatus('pending');
      setWalletMessage(null);
      const { error } = await supabase.rpc('rpc_user_wallet_payment', {
        p_wallet_address: walletForm.address.trim(),
        p_amount_fre: amountValue,
        p_note: walletForm.note || null,
        p_metadata: {
          initiatedFrom: 'utilisateur_app',
        },
      });
      if (error) throw error;
      setWalletStatus('success');
      setWalletMessage('Paiement transmis au wallet TON.');
      await refreshProfile();
    } catch (rpcError) {
      console.error('wallet_payment_error', rpcError);
      setWalletStatus('error');
      setWalletMessage(formatSupabaseError(rpcError));
    }
  }, [walletForm.address, walletForm.amount, walletForm.note, refreshProfile]);

  const handleWalletError = () => {
    setWalletStatus('error');
    setWalletMessage('Paiement annule.');
  };

  const handleContactConfirm = useCallback(async () => {
    const amountValue = Number(contactForm.amount) || 0;
    if (!contactForm.handle || amountValue <= 0) {
      setContactStatus('error');
      setContactFeedback('Identifiant et montant requis.');
      return;
    }
    try {
      setContactStatus('pending');
      setContactFeedback(null);
      const { error } = await supabase.rpc('rpc_transfer_between_users', {
        p_handle: contactForm.handle,
        p_amount: amountValue,
        p_note: contactForm.note || null,
      });
      if (error) throw error;
      setContactStatus('success');
      setContactFeedback('Transfert effectue et recu.');
      await refreshProfile();
    } catch (error) {
      console.error('Transfer contact error', error);
      setContactStatus('error');
      setContactFeedback(formatSupabaseError(error));
    }
  }, [contactForm.handle, contactForm.amount, contactForm.note, refreshProfile]);

  const handleContactError = () => {
    setContactStatus('error');
    setContactFeedback('Action annulee.');
  };

  const verifyContactHandle = useCallback(
    async (handle: string) => {
      const normalized = handle.replace(/^@/, '').trim().toLowerCase();
      if (!normalized) return false;
      const { data, error } = await supabase
        .from('UserProfile')
        .select('authUserId')
        .eq('username', normalized)
        .maybeSingle();
      if (error) {
        console.error('verify_contact_handle_error', error);
        return false;
      }
      return Boolean(data?.authUserId);
    },
    []
  );

  const [balanceWhole, balanceCents] = useMemo(() => {
    const formatted = formatFreAmount(balanceFre);
    const parts = formatted.split(',');
    return [parts[0], parts[1] ?? '00'];
  }, [balanceFre]);

  const depositTag = useMemo(() => {
    if (referralCode) return referralCode;
    if (authUserId) return `FRP-${authUserId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    return undefined;
  }, [referralCode, authUserId]);

  useOnchainDepositSync({
    enabled: Boolean(authUserId),
    onDeposit: refreshProfile,
  });

  useEffect(() => {
    if (!authUserId) return;

    const channel = supabase
      .channel(`utilisateur-home-${authUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'UserWalletBalance',
          filter: `authUserId=eq.${authUserId}`,
        },
        (payload) => {
          const balanceRecordNew = payload.new as { balanceFre?: number } | null;
          const balanceRecordOld = payload.old as { balanceFre?: number } | null;
          const balanceValue = balanceRecordNew?.balanceFre ?? balanceRecordOld?.balanceFre;
          if (balanceValue === undefined || balanceValue === null) return;
          setBalanceFre(Number(balanceValue));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'UserPaymentTransaction',
          filter: `authUserId=eq.${authUserId}`,
        },
        (payload) => {
          const updatedRow = (payload.new || payload.old) as SupabaseTransactionRow | null;
          if (!updatedRow) return;

          setTransactions((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((tx) => tx.id !== updatedRow.id);
            }

            const nextTx = mapTransactionRow(updatedRow);
            const withoutCurrent = prev.filter((tx) => tx.id !== nextTx.id);
            const merged =
              payload.eventType === 'UPDATE'
                ? [nextTx, ...withoutCurrent]
                : [nextTx, ...prev];
            return merged
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
          });
          setTransactionsLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUserId, mapTransactionRow]);

  const handleLogoutConfirm = useCallback(async () => {
    setLogoutPending(true);
    await supabase.auth.signOut();
    setLogoutPending(false);
    setAuthUserId(null);
    setUsername('');
    setProfileEmail('');
    setBalanceFre(0);
    setTransactions([]);
    setTransactionsLoading(false);
    transactionsLoadedRef.current = false;
    setProfileDetails(defaultProfileDetails);
  }, []);

  useEffect(() => {
    if (!depositDrawerOpen) return;
    const intervalId = window.setInterval(() => {
      refreshProfile();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [depositDrawerOpen, refreshProfile]);

  const handleManualDepositRefresh = useCallback(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleOpenSendPage = useCallback(() => {
    if (transfersLocked) {
      toast({
        title: 'Envoi verrouillé',
        description: transferLockReason || 'Valide ton email pour débloquer cette action.',
        variant: 'destructive',
      });
      return;
    }
    onSendOpen();
  }, [transfersLocked, transferLockReason, onSendOpen, toast]);

  useEffect(() => {
    if (transfersLocked) {
      setContactDrawerOpen(false);
      setWalletDrawerOpen(false);
      if (sendVisible) {
        onSendClose();
      }
    }
  }, [transfersLocked, sendVisible, onSendClose]);

  const openTransactionDetail = useCallback(
    async (transactionId: string, preset?: TransactionDetail) => {
      if (!transactionId) return;
      setDetailTargetId(transactionId);
      setDetailDrawerOpen(true);
      setDetailError(null);
      if (preset) {
        setDetailTransaction(preset);
        setDetailLoading(false);
        return;
      }
      setDetailLoading(true);
      setDetailTransaction(null);
      try {
        const { data, error } = await supabase
          .from('UserPaymentTransaction')
          .select('id,context,counterparty,amountFre,feeFre,metadata,createdAt')
          .eq('id', transactionId)
          .maybeSingle();
        if (error || !data) {
          throw error || new Error('transaction_not_found');
        }
        setDetailTransaction(mapToTransactionDetail(data));
      } catch (detailError) {
        console.error('Transaction detail error', detailError);
        setDetailError('Impossible de charger les détails de la transaction.');
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

const closeTransactionDetail = useCallback(() => {
  setDetailDrawerOpen(false);
  setDetailTransaction(null);
  setDetailError(null);
  setDetailTargetId(null);
}, []);

  const handleProfileSave = useCallback(
    async (nextProfile: ProfileFormState) => {
      if (!authUserId) {
        return { success: false, message: 'Connexion requise.' };
      }
      const updatePayload = {
        firstName: nextProfile.firstName || null,
        lastName: nextProfile.lastName || null,
        birthDate: nextProfile.birthDate || null,
        phoneNumber: nextProfile.phoneNumber || null,
        addressLine1: nextProfile.addressLine1 || null,
        addressLine2: nextProfile.addressLine2 || null,
        postalCode: nextProfile.postalCode || null,
        city: nextProfile.city || null,
        country: nextProfile.country || null,
        email: nextProfile.email || null,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('UserProfile')
        .update(updatePayload)
        .eq('authUserId', authUserId)
        .select(profileSelectColumns)
        .maybeSingle();
      if (error) {
        console.error('profile_update_error', error);
        return { success: false, message: 'Impossible de mettre à jour le profil.' };
      }
      const normalized: ProfileFormState = {
        firstName: data?.firstName ?? '',
        lastName: data?.lastName ?? '',
        birthDate: data?.birthDate ?? '',
        email: data?.email ?? '',
        phoneNumber: data?.phoneNumber ?? '',
        addressLine1: data?.addressLine1 ?? '',
        addressLine2: data?.addressLine2 ?? '',
        postalCode: data?.postalCode ?? '',
        city: data?.city ?? '',
        country: data?.country ?? '',
      };
      setProfileDetails(normalized);
      if (normalized.email) {
        setProfileEmail(normalized.email);
      }
      return { success: true, message: 'Profil mis à jour.' };
    },
    [authUserId]
  );

  const handleHistoryTransactionSelect = useCallback(
    (tx: TransactionDetail) => {
      openTransactionDetail(tx.id, tx);
    },
    [openTransactionDetail]
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 text-white py-4 px-4 pb-28">
        <div className="max-w-md mx-auto space-y-6">
          <UtilisateurHeader
            username={username || (isProfileLoading ? 'Chargement...' : 'FrancPay')}
            showBalance={activeSection === 'home'}
            balanceWhole={balanceWhole}
            balanceCents={balanceCents}
          />

          {activeSection === 'home' && (
            <UtilisateurHomeSection
              transactions={transactions}
              isLoading={transactionsLoading}
              onShare={() => setShareDrawerOpen(true)}
              onDeposit={() => setDepositDrawerOpen(true)}
              onShowHistory={onHistoryOpen}
              onSelectTransaction={(id) => openTransactionDetail(id)}
              onOpenSettings={() => onChangeSection?.('settings')}
              onOpenSendPage={handleOpenSendPage}
              sendDisabled={transfersLocked}
              sendDisabledReason={transferLockReason}
            />
          )}

      {activeSection === 'pay' && (
        <UtilisateurPaySection
          onPersistTransaction={handleMerchantPayment}
        />
      )}

          {activeSection === 'invest' && (
            <UtilisateurInvestSection
              authUserId={authUserId}
              balanceFre={balanceFre}
              onRefreshWallet={refreshProfile}
            />
          )}

          {activeSection === 'settings' && (
            <UtilisateurSettingsSection
              profileName={username || 'FrancPay'}
              profileEmail={profileEmail}
              profileDetails={profileDetails}
              onLogoutConfirm={handleLogoutConfirm}
              logoutPending={logoutPending}
              onOpenProfilePage={() => setProfilePageOpen(true)}
            />
          )}
      </div>
    </div>

      <TransactionHistoryPage
        visible={historyVisible}
        authUserId={authUserId}
        onClose={onHistoryClose}
        onSelectTransaction={handleHistoryTransactionSelect}
      />

      <UtilisateurProfilePage
        open={profilePageOpen}
        onClose={() => setProfilePageOpen(false)}
        profileName={username || 'FrancPay'}
        profileEmail={profileEmail}
        profileDetails={profileDetails}
        onSaveProfile={handleProfileSave}
      />

      <SendFundsPage
        visible={sendVisible}
        onClose={onSendClose}
        onSendUser={() => setContactDrawerOpen(true)}
        onSendTon={() => setWalletDrawerOpen(true)}
      />

      <TransactionDetailDrawer
        open={detailDrawerOpen}
        onClose={closeTransactionDetail}
        transaction={detailTransaction}
        isLoading={detailLoading}
        error={detailError}
        onReload={detailTargetId ? () => openTransactionDetail(detailTargetId) : undefined}
      />

      <WalletDrawer
        open={walletDrawerOpen}
        form={walletForm}
        status={walletStatus}
        statusMessage={walletMessage}
        onChange={setWalletForm}
        onClose={handleWalletClose}
        onConfirm={handleWalletConfirm}
        onError={handleWalletError}
      />

      <ContactDrawer
        open={contactDrawerOpen}
        form={contactForm}
        status={contactStatus}
        statusMessage={contactFeedback}
        onChange={setContactForm}
        onClose={handleContactClose}
        onConfirm={handleContactConfirm}
        onError={handleContactError}
        onValidateRecipient={verifyContactHandle}
      />

      <ShareDrawer open={shareDrawerOpen} onClose={() => setShareDrawerOpen(false)} referralCode={referralCode} />

      <DepositDrawer
        open={depositDrawerOpen}
        onClose={() => setDepositDrawerOpen(false)}
        depositTag={depositTag}
        onManualRefresh={handleManualDepositRefresh}
      />
    </>
  );
};
