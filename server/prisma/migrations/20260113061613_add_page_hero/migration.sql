-- CreateTable
CREATE TABLE "PageHero" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "desktopImageUrl" TEXT,
    "mobileImageUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageHero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageHero_pageKey_key" ON "PageHero"("pageKey");
