-- AlterTable
ALTER TABLE "public"."NativeReceipt" ADD COLUMN     "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
