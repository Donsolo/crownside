-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'hair';

-- AlterTable
ALTER TABLE "StylistProfile" ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY['hair']::TEXT[];
