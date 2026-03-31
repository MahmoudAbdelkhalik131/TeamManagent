import activityLogSchema from "./activity.schema";
import { IActivityLog } from "./activity.interface";

class ActivityService {
  async log(data: Partial<IActivityLog>) {
    try {
      await activityLogSchema.create(data);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  async getByProject(projectId: string) {
    return await activityLogSchema.find({ 
      $or: [
        { targetId: projectId, targetType: "Project" },
        { "details.projectId": projectId, targetType: "Task" }
      ]
    }).sort({ createdAt: -1 }).limit(50);
  }
}

export default new ActivityService();
