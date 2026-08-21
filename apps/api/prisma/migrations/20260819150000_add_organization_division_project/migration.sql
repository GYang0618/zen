-- Add modern management-org types used by the shared hierarchy catalog.
ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'division';
ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'project';
