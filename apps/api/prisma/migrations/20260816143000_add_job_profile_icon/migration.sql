-- Add configurable presentation metadata to global job profiles.
ALTER TABLE "job_profiles"
  ADD COLUMN "icon" TEXT,
  ADD COLUMN "icon_color" TEXT;

-- Preserve a useful visual for profiles created before this feature.
UPDATE "job_profiles"
SET
  "icon" = 'briefcase-business',
  "icon_color" = 'slate'
WHERE "icon" IS NULL;
