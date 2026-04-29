import cron from "node-cron";
import { generateMonthlyRentRecords } from "./rent-service";

/**
 * Initializes all cron jobs for the application.
 */
export function initCronJobs() {
  // Prevent multiple initializations in development due to hot reloading
  if (global.cronInitialized) {
    return;
  }

  console.log("[Cron] Initializing background jobs...");

  // 1. Primary Run: 00:00 on the 1st day of every month
  // This is the main trigger for generating new month's rent.
  cron.schedule("0 0 1 * *", async () => {
    console.log("[Cron] Running scheduled monthly rent generation...");
    try {
      await generateMonthlyRentRecords();
    } catch (error) {
      console.error("[Cron] Monthly rent generation failed:", error);
    }
  });

  // 2. Safety Check: Daily at 01:00 AM
  // This ensures that if the server was down at the start of the month, 
  // the records are generated as soon as it's back up.
  // The service logic skips if records already exist, making this safe to run daily.
  cron.schedule("0 1 * * *", async () => {
    console.log("[Cron] Running daily rent generation safety check...");
    try {
      await generateMonthlyRentRecords();
    } catch (error) {
      console.error("[Cron] Daily rent generation check failed:", error);
    }
  });

  // 3. Optional: Run once on initialization if needed
  // generateMonthlyRentRecords(); 

  global.cronInitialized = true;
  console.log("[Cron] Jobs scheduled successfully.");
}

// Extend global type for development hot reloading check
declare global {
  var cronInitialized: boolean | undefined;
}
