-- AlterTable
ALTER TABLE "public"."Note" ADD COLUMN     "topicId" INTEGER;

-- CreateTable
CREATE TABLE "public"."NoteTopic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "NoteTopic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."NoteTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
