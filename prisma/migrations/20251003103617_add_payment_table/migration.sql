-- CreateTable
CREATE TABLE "public"."Receipt" (
    "id" TEXT NOT NULL,
    "cashier_name" TEXT NOT NULL,
    "discount" TEXT,
    "type" INTEGER,
    "customerInfo" JSONB,
    "positions" JSONB,
    "amount" DECIMAL(65,30) NOT NULL,
    "calculationAddress" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);
