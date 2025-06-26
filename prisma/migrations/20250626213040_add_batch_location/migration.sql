-- Add location columns to Batch
ALTER TABLE "Batch" ADD COLUMN "locationLat" DOUBLE PRECISION;
ALTER TABLE "Batch" ADD COLUMN "locationLng" DOUBLE PRECISION;
