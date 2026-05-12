-- Create enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'MANAGER', 'TENANT');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "FlatStatus" AS ENUM ('VACANT', 'OCCUPIED');
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "profileImage" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "status" "UserStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "otp" TEXT,
    "otpExpires" TIMESTAMP(3),
    "ownerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Building table
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "totalFlats" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- Create Flat table
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL,
    "flatNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "baseRent" INTEGER NOT NULL,
    "extraCharges" INTEGER NOT NULL DEFAULT 0,
    "serviceCharges" INTEGER NOT NULL DEFAULT 0,
    "status" "FlatStatus" NOT NULL DEFAULT 'VACANT',
    "buildingId" TEXT NOT NULL,
    "currentTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flat_pkey" PRIMARY KEY ("id")
);

-- Create Tenant table
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "nidNumber" TEXT,
    "nidImage" TEXT,
    "profileImage" TEXT,
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "currentFlatId" TEXT,
    "advanceAmount" INTEGER,
    "advanceDate" TIMESTAMP(3),
    "advanceReceived" BOOLEAN,
    "email" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Create TenantHistory table
CREATE TABLE "TenantHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "moveOutDate" TIMESTAMP(3),
    "rentAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantHistory_pkey" PRIMARY KEY ("id")
);

-- Create RentRecord table
CREATE TABLE "RentRecord" (
    "id" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tenantId" TEXT,
    "month" TEXT NOT NULL,
    "baseRent" INTEGER NOT NULL,
    "extraCharges" INTEGER NOT NULL DEFAULT 0,
    "serviceCharges" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "dueAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentRecord_pkey" PRIMARY KEY ("id")
);

-- Create Payment table
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "rentRecordId" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Create Charge table
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "buildingId" TEXT,
    "amount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_ownerId_idx" ON "User"("ownerId");

CREATE INDEX "Building_ownerId_idx" ON "Building"("ownerId");
CREATE INDEX "Building_createdAt_idx" ON "Building"("createdAt");

CREATE UNIQUE INDEX "Flat_currentTenantId_key" ON "Flat"("currentTenantId");
CREATE INDEX "Flat_buildingId_idx" ON "Flat"("buildingId");
CREATE INDEX "Flat_currentTenantId_idx" ON "Flat"("currentTenantId");

CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");
CREATE INDEX "Tenant_email_idx" ON "Tenant"("email");

CREATE INDEX "RentRecord_flatId_idx" ON "RentRecord"("flatId");
CREATE INDEX "RentRecord_tenantId_idx" ON "RentRecord"("tenantId");
CREATE INDEX "RentRecord_month_idx" ON "RentRecord"("month");
CREATE UNIQUE INDEX "RentRecord_flatId_month_key" ON "RentRecord"("flatId", "month");
CREATE UNIQUE INDEX "RentRecord_tenantId_month_key" ON "RentRecord"("tenantId", "month");

-- Create foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Building" ADD CONSTRAINT "Building_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Flat" ADD CONSTRAINT "Flat_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Flat" ADD CONSTRAINT "Flat_currentTenantId_fkey" FOREIGN KEY ("currentTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantHistory" ADD CONSTRAINT "TenantHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantHistory" ADD CONSTRAINT "TenantHistory_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentRecord" ADD CONSTRAINT "RentRecord_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentRecord" ADD CONSTRAINT "RentRecord_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentRecord" ADD CONSTRAINT "RentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentRecordId_fkey" FOREIGN KEY ("rentRecordId") REFERENCES "RentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Charge" ADD CONSTRAINT "Charge_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;