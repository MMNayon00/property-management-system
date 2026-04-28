-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FlatStatus" AS ENUM ('VACANT', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "profileImage" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "totalFlats" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL,
    "flatNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "baseRent" INTEGER NOT NULL,
    "status" "FlatStatus" NOT NULL DEFAULT 'VACANT',
    "buildingId" TEXT NOT NULL,
    "currentTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "RentRecord" (
    "id" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "baseRent" INTEGER NOT NULL,
    "extraCharges" INTEGER NOT NULL DEFAULT 0,
    "serviceCharges" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Building_ownerId_idx" ON "Building"("ownerId");

-- CreateIndex
CREATE INDEX "Building_managerId_idx" ON "Building"("managerId");

-- CreateIndex
CREATE INDEX "Building_createdAt_idx" ON "Building"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Flat_currentTenantId_key" ON "Flat"("currentTenantId");

-- CreateIndex
CREATE INDEX "Flat_buildingId_idx" ON "Flat"("buildingId");

-- CreateIndex
CREATE INDEX "Flat_currentTenantId_idx" ON "Flat"("currentTenantId");

-- CreateIndex
CREATE INDEX "Flat_status_idx" ON "Flat"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Flat_buildingId_flatNumber_key" ON "Flat"("buildingId", "flatNumber");

-- CreateIndex
CREATE INDEX "Tenant_nidNumber_idx" ON "Tenant"("nidNumber");

-- CreateIndex
CREATE INDEX "Tenant_currentFlatId_idx" ON "Tenant"("currentFlatId");

-- CreateIndex
CREATE INDEX "TenantHistory_tenantId_idx" ON "TenantHistory"("tenantId");

-- CreateIndex
CREATE INDEX "TenantHistory_flatId_idx" ON "TenantHistory"("flatId");

-- CreateIndex
CREATE INDEX "TenantHistory_moveInDate_idx" ON "TenantHistory"("moveInDate");

-- CreateIndex
CREATE INDEX "RentRecord_flatId_idx" ON "RentRecord"("flatId");

-- CreateIndex
CREATE INDEX "RentRecord_buildingId_idx" ON "RentRecord"("buildingId");

-- CreateIndex
CREATE INDEX "RentRecord_year_month_idx" ON "RentRecord"("year", "month");

-- CreateIndex
CREATE INDEX "RentRecord_paymentStatus_idx" ON "RentRecord"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "RentRecord_flatId_year_month_key" ON "RentRecord"("flatId", "year", "month");

-- CreateIndex
CREATE INDEX "Payment_rentRecordId_idx" ON "Payment"("rentRecordId");

-- CreateIndex
CREATE INDEX "Payment_flatId_idx" ON "Payment"("flatId");

-- CreateIndex
CREATE INDEX "Payment_buildingId_idx" ON "Payment"("buildingId");

-- CreateIndex
CREATE INDEX "Payment_createdById_idx" ON "Payment"("createdById");

-- CreateIndex
CREATE INDEX "Charge_buildingId_idx" ON "Charge"("buildingId");

-- CreateIndex
CREATE INDEX "Charge_isActive_idx" ON "Charge"("isActive");

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flat" ADD CONSTRAINT "Flat_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flat" ADD CONSTRAINT "Flat_currentTenantId_fkey" FOREIGN KEY ("currentTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHistory" ADD CONSTRAINT "TenantHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHistory" ADD CONSTRAINT "TenantHistory_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRecord" ADD CONSTRAINT "RentRecord_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRecord" ADD CONSTRAINT "RentRecord_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentRecordId_fkey" FOREIGN KEY ("rentRecordId") REFERENCES "RentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
