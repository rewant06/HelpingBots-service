-- CreateEnum
CREATE TYPE "JwtSigningKeyStatus" AS ENUM ('ACTIVE', 'RETIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "JwtSigningKey" (
    "id" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "publicJwk" JSONB NOT NULL,
    "privateKeyEnc" TEXT NOT NULL,
    "status" "JwtSigningKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "publishUntil" TIMESTAMP(3),

    CONSTRAINT "JwtSigningKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JwtSigningKey_kid_key" ON "JwtSigningKey"("kid");

-- CreateIndex
CREATE INDEX "JwtSigningKey_status_idx" ON "JwtSigningKey"("status");

-- CreateIndex
CREATE INDEX "JwtSigningKey_publishUntil_idx" ON "JwtSigningKey"("publishUntil");
