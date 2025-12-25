/*
  Warnings:

  - The primary key for the `ApiMetric` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `status` column on the `Tenant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'ARCHIVED');

-- DropIndex
DROP INDEX "ApiMetric_tenantId_timestamp_idx";

-- DropIndex
DROP INDEX "ApiMetric_timestamp_idx";

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "ApiMetric" DROP CONSTRAINT "ApiMetric_pkey",
ADD CONSTRAINT "ApiMetric_pkey" PRIMARY KEY ("tenantId", "timestamp", "route", "method", "statusCode");

-- AlterTable
ALTER TABLE "ShadowUser" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "TenantStatus";

-- DropEnum
DROP TYPE "UserStatus";
