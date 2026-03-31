import cron from "node-cron";
import userSchema from "../Users/user.schema";
import dashboardServices from "../Dashboard/Dashboard.services";
import dashboardSnapshotSchema from "../Dashboard/DashboardSnapshot.schema";

export const initScheduler = () => {
  // Weekly snapshot every Friday at 00:00 (Cron: 0 0 * * 5)
  // 0 - minute
  // 0 - hour
  // * - day of month
  // * - month
  // 5 - day of week (Friday)
  cron.schedule("0 0 * * 5", async () => {
    console.log("-----------------------------------------");
    console.log(`[${new Date().toISOString()}] Starting weekly dashboard snapshot job...`);
    
    try {
      const users = await userSchema.find({});
      let count = 0;
      
      for (const user of users) {
        const username = user.username;
        const role = user.role as "member" | "admin";
        
        try {
          let data;
          if (role === 'admin') {
            data = await dashboardServices.calculateAdminDashboard(username);
          } else {
            data = await dashboardServices.calculateMemberDashboard(username);
          }

          await dashboardSnapshotSchema.create({
            username,
            role,
            snapshotDate: new Date(),
            data
          });
          count++;
        } catch (err: any) {
          console.error(`Failed to snapshot for user ${username}:`, err.message);
        }
      }
      
      console.log(`Successfully created snapshots for ${count}/${users.length} users.`);

      // Cleanup old snapshots (> 90 days / 3 months)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const deleteResult = await dashboardSnapshotSchema.deleteMany({
        snapshotDate: { $lt: ninetyDaysAgo }
      });
      
      console.log(`Cleaned up ${deleteResult.deletedCount} snapshots older than 90 days.`);
      console.log("Weekly snapshot job completed.");
      console.log("-----------------------------------------");
      
    } catch (error: any) {
      console.error("Critical error in dashboard snapshot job:", error.message);
    }
  });
  
  console.log("Scheduler initialized: Weekly dashboard snapshots set for every Friday at 00:00.");
};
