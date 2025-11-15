CREATE TYPE "ProfileType" AS ENUM ('UTILISATEUR', 'PROFESSIONAL');

CREATE TABLE "UserProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authUserId" UUID NOT NULL UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "profileType" "ProfileType" NOT NULL,
  "referralCode" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "UserProfile_profileType_idx" ON "UserProfile" ("profileType");
CREATE INDEX "UserProfile_email_idx" ON "UserProfile" ("email");
