const REFERRAL_PREFIX = 'FRP';

const randomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export const generateReferralCodeFromId = (authUserId?: string | null) => {
  if (!authUserId) {
    return `${REFERRAL_PREFIX}-${randomSuffix()}${randomSuffix()}`;
  }
  const normalized = authUserId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const head = normalized.slice(0, 6).padEnd(6, 'X');
  const tail = normalized.slice(-4) || randomSuffix();
  return `${REFERRAL_PREFIX}-${head}${tail}`;
};
