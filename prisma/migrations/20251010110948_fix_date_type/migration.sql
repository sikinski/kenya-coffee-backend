/*
  Warnings:

  - Added the required column `processedAtRaw` to the `NativeReceipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."NativeReceipt" ADD COLUMN     "processedAtRaw" TEXT NOT NULL;
