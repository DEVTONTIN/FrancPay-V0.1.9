-- Create enum for professional application workflow
DO $$
BEGIN
  CREATE TYPE "ProfessionalApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Create table storing professional applications
CREATE TABLE "ProfessionalApplication" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userProfileId" uuid NOT NULL,
  "authUserId" uuid,
  "contactEmail" text NOT NULL,
  "contactPhone" text,
  "lastName" text NOT NULL,
  "firstName" text NOT NULL,
  "addressLine1" text,
  "postalCode" text,
  "city" text,
  "country" text,
  "companyName" text NOT NULL,
  "legalForm" text,
  "siretNumber" text NOT NULL,
  "tvaNumber" text,
  "businessWebsite" text,
  "activityDescription" text,
  "status" "ProfessionalApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerId" uuid,
  "reviewedAt" timestamptz,
  "reviewNotes" text,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ProfessionalApplication_userProfileId_fkey"
    FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "ProfessionalApplication_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "UserProfile"("id") ON DELETE SET NULL
);

-- Constraints and indexes for faster lookups
CREATE UNIQUE INDEX "ProfessionalApplication_siretNumber_key"
  ON "ProfessionalApplication" ("siretNumber");

CREATE INDEX "ProfessionalApplication_userProfile_idx"
  ON "ProfessionalApplication" ("userProfileId");

CREATE INDEX "ProfessionalApplication_status_idx"
  ON "ProfessionalApplication" ("status");
