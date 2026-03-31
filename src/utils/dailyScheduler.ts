import cron from "node-cron";
import taskSchema from "../Task/task.schema";
import { createNotification } from "../notification/notification.services";

export const initDailyScheduler = () => {
  // Run every day at 00:00 (Cron: 0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    console.log("-----------------------------------------");
    console.log(`[${new Date().toISOString()}] Starting daily overdue task check...`);
    
    try {
      const now = new Date();
      // Find tasks that are overdue and not finished
      const overdueTasks = await taskSchema.find({
        status: { $nin: ["Accepted", "Done"] },
        endDate: { $lt: now }
      });

      let notifiedCount = 0;
      for (const task of overdueTasks) {
        const today = new Date().toDateString();
        const lastNotif = task.lastOverdueNotificationAt ? new Date(task.lastOverdueNotificationAt).toDateString() : null;

        if (lastNotif !== today) {
          // Send daily reminder
          await createNotification(
            task.usernameMember,
            "Task Overdue",
            `Your task '${task.name}' is past its deadline. Please update its status as soon as possible.`,
            task.project._id.toString()
          );

          task.lastOverdueNotificationAt = now;
          await task.save();
          notifiedCount++;
        }
      }
      
      console.log(`Daily overdue check completed. Notified ${notifiedCount} members.`);
      console.log("-----------------------------------------");
      
    } catch (error: any) {
      console.error("Error in daily overdue scheduler:", error.message);
    }
  });
  
  console.log("Daily Scheduler initialized: Overdue task reminders set for every day at 00:00.");
};
