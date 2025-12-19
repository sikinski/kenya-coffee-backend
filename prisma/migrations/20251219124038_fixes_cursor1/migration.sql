-- CreateTable
CREATE TABLE "public"."MenuItemType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "discountPrice" DECIMAL(65,30),
    "imageOriginal" TEXT,
    "imageThumbnail" TEXT,
    "quantity" INTEGER,
    "volume" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Menu" (
    "id" SERIAL NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_MenuItemToMenuItemType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MenuItemToMenuItemType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MenuItemToMenuTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MenuItemToMenuTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemType_name_key" ON "public"."MenuItemType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTag_name_key" ON "public"."MenuTag"("name");

-- CreateIndex
CREATE INDEX "MenuItem_active_idx" ON "public"."MenuItem"("active");

-- CreateIndex
CREATE INDEX "MenuItem_order_idx" ON "public"."MenuItem"("order");

-- CreateIndex
CREATE INDEX "_MenuItemToMenuItemType_B_index" ON "public"."_MenuItemToMenuItemType"("B");

-- CreateIndex
CREATE INDEX "_MenuItemToMenuTag_B_index" ON "public"."_MenuItemToMenuTag"("B");

-- AddForeignKey
ALTER TABLE "public"."_MenuItemToMenuItemType" ADD CONSTRAINT "_MenuItemToMenuItemType_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuItemToMenuItemType" ADD CONSTRAINT "_MenuItemToMenuItemType_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."MenuItemType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuItemToMenuTag" ADD CONSTRAINT "_MenuItemToMenuTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuItemToMenuTag" ADD CONSTRAINT "_MenuItemToMenuTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."MenuTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
