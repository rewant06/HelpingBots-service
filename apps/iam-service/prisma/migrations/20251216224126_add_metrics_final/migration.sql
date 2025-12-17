-- CreateTable
CREATE TABLE "ApiMetric" (
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'public',
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiMetric_pkey" PRIMARY KEY ("timestamp","tenantId","route","method","statusCode")
);

-- CreateIndex
CREATE INDEX "ApiMetric_timestamp_idx" ON "ApiMetric"("timestamp");

-- CreateIndex
CREATE INDEX "ApiMetric_tenantId_timestamp_idx" ON "ApiMetric"("tenantId", "timestamp");
