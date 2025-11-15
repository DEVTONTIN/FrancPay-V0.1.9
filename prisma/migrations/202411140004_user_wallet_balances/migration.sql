CREATE TABLE "UserWalletBalance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authUserId" UUID NOT NULL,
  "balanceFre" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "UserWalletBalance_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "UserProfile" ("authUserId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "UserWalletBalance_authUserId_key" ON "UserWalletBalance" ("authUserId");

CREATE TABLE "UserPaymentTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authUserId" UUID NOT NULL,
  "context" TEXT NOT NULL,
  "counterparty" TEXT NOT NULL,
  "amountFre" NUMERIC(18,2) NOT NULL,
  "feeFre" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "UserPaymentTransaction_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "UserProfile" ("authUserId") ON DELETE CASCADE
);

CREATE INDEX "UserPaymentTransaction_authUserId_idx" ON "UserPaymentTransaction" ("authUserId");
