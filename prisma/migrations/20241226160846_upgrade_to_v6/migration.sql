-- AlterTable
ALTER TABLE "_RelatedResources" ADD CONSTRAINT "_RelatedResources_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RelatedResources_AB_unique";
