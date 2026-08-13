-- Remove obsolete hello-stub plugin installation rows (plugin removed from registry).
DELETE FROM "plugin_installations" WHERE "plugin_id" = 'hello-stub';
