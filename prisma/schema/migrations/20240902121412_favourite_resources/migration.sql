-- CreateTable
CREATE TABLE "UserFavourites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "UserFavourites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFavourites_userId_idx" ON "UserFavourites"("userId");

-- CreateIndex
CREATE INDEX "UserFavourites_resourceId_idx" ON "UserFavourites"("resourceId");
