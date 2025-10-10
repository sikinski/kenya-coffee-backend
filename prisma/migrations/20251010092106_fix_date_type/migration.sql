/*
  Warnings:

  - Changed the type of `processedAt` on the `NativeReceipt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."NativeReceipt" DROP COLUMN "processedAt",
ADD COLUMN     "processedAt" TIMESTAMP(6) NOT NULL;
