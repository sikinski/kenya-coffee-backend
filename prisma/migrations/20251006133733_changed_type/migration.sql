/*
  Warnings:

  - Made the column `processedAt` on table `Receipt` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Receipt" ALTER COLUMN "processedAt" SET NOT NULL,
ALTER COLUMN "processedAt" SET DATA TYPE TEXT;
