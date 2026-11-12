-- CreateEnum
CREATE TYPE "LessonPlanVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('EXERCISE', 'SHORT_FORM', 'LONG_FORM');

-- CreateEnum
CREATE TYPE "ResourceConfiguration" AS ENUM ('SOLO', 'PAIRS', 'GROUPS', 'WHOLE_CLASS', 'CIRCLE', 'BACKLINE', 'SCENE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriesOnResources" (
    "resourceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CategoriesOnResources_pkey" PRIMARY KEY ("resourceId","categoryId")
);

-- CreateTable
CREATE TABLE "LessonPlanItem" (
    "id" TEXT NOT NULL,
    "text" TEXT,
    "resourceId" TEXT,
    "duration" INTEGER,
    "order" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "LessonPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlanSection" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "lessonPlanId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LessonPlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "description" TEXT,
    "visibility" "LessonPlanVisibility" NOT NULL DEFAULT 'PRIVATE',
    "useDuration" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "configuration" "ResourceConfiguration" NOT NULL,
    "showIntroduction" TEXT,
    "video" TEXT,
    "alternativeNames" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editProposalOriginalResourceId" TEXT,
    "editProposalAuthorId" TEXT,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "_RelatedResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "CategoriesOnResources_categoryId_idx" ON "CategoriesOnResources"("categoryId");

-- CreateIndex
CREATE INDEX "CategoriesOnResources_resourceId_idx" ON "CategoriesOnResources"("resourceId");

-- CreateIndex
CREATE INDEX "LessonPlanItem_sectionId_idx" ON "LessonPlanItem"("sectionId");

-- CreateIndex
CREATE INDEX "LessonPlanItem_resourceId_idx" ON "LessonPlanItem"("resourceId");

-- CreateIndex
CREATE INDEX "LessonPlanSection_lessonPlanId_idx" ON "LessonPlanSection"("lessonPlanId");

-- CreateIndex
CREATE INDEX "LessonPlan_createdById_idx" ON "LessonPlan"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_id_key" ON "Resource"("id");

-- CreateIndex
CREATE INDEX "Resource_createdById_idx" ON "Resource"("createdById");

-- CreateIndex
CREATE INDEX "Resource_editProposalAuthorId_idx" ON "Resource"("editProposalAuthorId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_RelatedResources_AB_unique" ON "_RelatedResources"("A", "B");

-- CreateIndex
CREATE INDEX "_RelatedResources_B_index" ON "_RelatedResources"("B");

