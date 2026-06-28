-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('OT', 'SPEECH', 'PSYCHOLOGY');
CREATE TYPE "IntakeStatus" AS ENUM ('OPEN', 'LIMITED', 'CLOSED');
CREATE TYPE "WaitTimeBand" AS ENUM ('UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS');
CREATE TYPE "CapacityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "UpdatedBy" AS ENUM ('CLINIC', 'ADMIN', 'SYSTEM');
CREATE TYPE "ReferrerType" AS ENUM ('GP', 'SCHOOL', 'SUPPORT_COORDINATOR', 'PAEDIATRICIAN', 'FAMILY');
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'MATCHED', 'WAITLISTED', 'CANCELLED');
CREATE TYPE "ResponseType" AS ENUM ('CONFIRMED', 'UPDATED', 'NO_RESPONSE');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "lat" DECIMAL(65,30) NOT NULL,
    "lng" DECIMAL(65,30) NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "ndis_registered" BOOLEAN NOT NULL DEFAULT false,
    "bulk_billing" BOOLEAN NOT NULL DEFAULT false,
    "private_health" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityObject" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "intake_status" "IntakeStatus" NOT NULL,
    "age_bands_served" TEXT[],
    "wait_time_band" "WaitTimeBand" NOT NULL,
    "capacity_level" "CapacityLevel" NOT NULL,
    "monthly_referral_cap" INTEGER,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updated_by" "UpdatedBy" NOT NULL DEFAULT 'CLINIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityObject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referrer" (
    "id" TEXT NOT NULL,
    "type" "ReferrerType" NOT NULL,
    "organisation_name" TEXT,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "suburb" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Referrer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralRequest" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "child_age" INTEGER NOT NULL,
    "disciplines_requested" TEXT[],
    "urgency_score" INTEGER NOT NULL,
    "ai_interpretation" JSONB,
    "notes" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReferralRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "referral_request_id" TEXT NOT NULL,
    "availability_object_id" TEXT NOT NULL,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicAdmin" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicAdmin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FreshnessPrompt" (
    "id" TEXT NOT NULL,
    "availability_object_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "response_type" "ResponseType",
    CONSTRAINT "FreshnessPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "search_id" TEXT NOT NULL,
    "disciplines" TEXT[],
    "child_age" INTEGER NOT NULL,
    "urgency_score" INTEGER,
    "suburb" TEXT NOT NULL,
    "radius_km" DOUBLE PRECISION NOT NULL,
    "selected_clinic_id" TEXT,
    "selected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Clinic_suburb_idx" ON "Clinic"("suburb");
CREATE INDEX "AvailabilityObject_clinic_id_idx" ON "AvailabilityObject"("clinic_id");
CREATE INDEX "AvailabilityObject_discipline_idx" ON "AvailabilityObject"("discipline");
CREATE INDEX "AvailabilityObject_intake_status_idx" ON "AvailabilityObject"("intake_status");
CREATE INDEX "AvailabilityObject_confidence_score_idx" ON "AvailabilityObject"("confidence_score");
CREATE INDEX "AvailabilityObject_discipline_intake_status_confidence_score_idx" ON "AvailabilityObject"("discipline", "intake_status", "confidence_score");
CREATE UNIQUE INDEX "SearchLog_search_id_key" ON "SearchLog"("search_id");

-- AddForeignKey
ALTER TABLE "AvailabilityObject" ADD CONSTRAINT "AvailabilityObject_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralRequest" ADD CONSTRAINT "ReferralRequest_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "Referrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_referral_request_id_fkey" FOREIGN KEY ("referral_request_id") REFERENCES "ReferralRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_availability_object_id_fkey" FOREIGN KEY ("availability_object_id") REFERENCES "AvailabilityObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicAdmin" ADD CONSTRAINT "ClinicAdmin_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreshnessPrompt" ADD CONSTRAINT "FreshnessPrompt_availability_object_id_fkey" FOREIGN KEY ("availability_object_id") REFERENCES "AvailabilityObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
