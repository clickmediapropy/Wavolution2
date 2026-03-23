import { internalMutation } from "./_generated/server";

/**
 * One-time migration: split contacts.name → firstName + lastName,
 * then clear the deprecated name field.
 *
 * Run via Convex dashboard: internal.migrations.migrateContactNames
 */
export const migrateContactNames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    let migrated = 0;

    for (const contact of contacts) {
      // Skip if already migrated (has firstName or no name)
      if (contact.firstName || !contact.name) continue;

      const parts = contact.name.trim().split(/\s+/);
      const firstName = parts[0] || undefined;
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

      await ctx.db.patch(contact._id, {
        firstName,
        lastName,
        name: undefined, // clear deprecated field
      });
      migrated++;
    }

    return { migrated, total: contacts.length };
  },
});
