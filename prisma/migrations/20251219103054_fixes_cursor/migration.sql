/*
  Warnings:

  - A unique constraint covering the columns `[taskId,date]` on the table `DailyTask` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."DailyTask_taskId_key";

-- AlterTable
ALTER TABLE "public"."DailyTask" ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal';

-- CreateIndex
CREATE INDEX "DailyTask_date_idx" ON "public"."DailyTask"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTask_taskId_date_key" ON "public"."DailyTask"("taskId", "date");
