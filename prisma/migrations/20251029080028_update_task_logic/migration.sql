/*
  Warnings:

  - You are about to drop the column `createdAt` on the `DailyTask` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `DailyTask` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `DailyTask` table. All the data in the column will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[taskId]` on the table `DailyTask` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `taskId` to the `DailyTask` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "public"."DailyTask" DROP COLUMN "createdAt",
DROP COLUMN "text",
DROP COLUMN "updatedAt",
ADD COLUMN     "taskId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Report";

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyTask_taskId_key" ON "public"."DailyTask"("taskId");

-- AddForeignKey
ALTER TABLE "public"."DailyTask" ADD CONSTRAINT "DailyTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
