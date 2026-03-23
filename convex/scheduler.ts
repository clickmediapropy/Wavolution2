import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Cron-driven scheduler: checks for draft campaigns whose scheduledAt
 * timestamp has passed and starts them automatically.
 */
export const checkScheduledCampaigns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find draft campaigns with a scheduledAt in the past
    const due = await ctx.db
      .query("campaigns")
      .withIndex("by_status_and_scheduledAt", (q) =>
        q.eq("status", "draft").lte("scheduledAt", now),
      )
      .take(25);

    for (const campaign of due) {
      // Transition to running
      await ctx.db.patch(campaign._id, {
        status: "running",
        startedAt: Date.now(),
      });

      // Kick off the campaign worker
      await ctx.scheduler.runAfter(
        0,
        internal.campaignWorker.processBatch,
        { campaignId: campaign._id },
      );
    }
  },
});
