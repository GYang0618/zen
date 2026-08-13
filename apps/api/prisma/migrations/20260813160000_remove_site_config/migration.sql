-- Remove site config module: permissions and tenant.settings.siteConfig payload

DELETE FROM "role_permissions"
WHERE "permission_id" IN (
  SELECT "id" FROM "permissions"
  WHERE "code" IN ('system:config:list', 'system:config:manage')
);

DELETE FROM "permissions"
WHERE "code" IN ('system:config:list', 'system:config:manage');

UPDATE "tenants"
SET "settings" = "settings" - 'siteConfig'
WHERE "settings" IS NOT NULL
  AND jsonb_typeof("settings") = 'object'
  AND "settings" ? 'siteConfig';
