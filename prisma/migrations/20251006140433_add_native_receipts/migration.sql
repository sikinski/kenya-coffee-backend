-- CreateTable
CREATE TABLE "public"."NativeReceipt" (
    "id" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NativeReceipt_pkey" PRIMARY KEY ("id")
);
