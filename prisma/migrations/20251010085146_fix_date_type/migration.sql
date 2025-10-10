-- AlterTable
ALTER TABLE "public"."NativeReceipt" ALTER COLUMN "processedAt" DROP DEFAULT,
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMP(6);
