ALTER TABLE "UserProfile"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "birthDate" DATE,
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "UserProfile_city_idx" ON "UserProfile" ("city");
CREATE INDEX IF NOT EXISTS "UserProfile_postalCode_idx" ON "UserProfile" ("postalCode");
