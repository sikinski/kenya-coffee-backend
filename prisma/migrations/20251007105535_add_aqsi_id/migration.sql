/*
  Warnings:

  - A unique constraint covering the columns `[aqsiId]` on the table `NativeReceipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."NativeReceipt" ADD COLUMN     "aqsiId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NativeReceipt_aqsiId_key" ON "public"."NativeReceipt"("aqsiId");
