import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check every minute for scheduled campaigns that are due to start
crons.interval(
  "check scheduled campaigns",
  { minutes: 1 },
  internal.scheduler.checkScheduledCampaigns,
  {},
);

export default crons;
