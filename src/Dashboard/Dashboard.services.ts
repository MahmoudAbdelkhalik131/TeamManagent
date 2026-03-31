import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
import taskSchema from "../Task/task.schema";
import userSchema from "../Users/user.schema";
import Project from "../Project/project.interface";
import Task from "../Task/task.interface";
import {
  DashboardStats,
  MemberDashboard,
  AdminDashboard,
  ProjectSummary,
  TaskSummary,
} from "./Dashboard.interface";

class DashboardServices {
  // Helper to calculate member dashboard data
  async calculateMemberDashboard(username: string): Promise<MemberDashboard> {
    // Get user info
    const user = await userSchema.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    // Get all projects where user is member or admin
    const projects: Project[] = await projectSchema.find({
      $or: [{ usernameMember: username }, { usernameAdmin: username }],
    });

    // Get all tasks assigned to user
    const tasks: Task[] = await taskSchema.find({
      $or: [{ usernameMember: username }, { usernameAdmin: username }],
    });

    // Calculate statistics
    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "Accepted").length;
    const pendingTasks = tasks.filter((t: any) => t.status === "Pending").length;
    const inProgressTasks = tasks.filter(
      (t: any) => t.status === "In-progress",
    ).length;
    const reviewingTasks = tasks.filter((t: any) => t.status === "Reviewing").length;
    const doneTasks = tasks.filter((t: any) => t.status === "Done").length;
    const personalCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get upcoming tasks (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter(
      (t: any) =>
        t.endDate > now &&
        t.endDate <= nextWeek &&
        t.status !== "Accepted",
    );

    // Format projects for dashboard
    const projectSummaries: ProjectSummary[] = await Promise.all(
      projects.map(async (p: any) => {
        const projectTasks = await taskSchema.find({ project: p._id });
        return {
          _id: p._id.toString(),
          name: p.name,
          status: p.status,
          percent: p.percent,
          duration: p.duration,
          endDate: p.endDate,
          color: p.color,
          usernameAdmin: p.usernameAdmin,
          memberCount: p.usernameMember.length,
          taskCount: projectTasks.length,
          completedTaskCount: projectTasks.filter((t: any) => t.status === "Done")
            .length,
          acceptedTaskCount: projectTasks.filter((t: any) => t.status === "Accepted")
            .length,
          statusBreakdown: {
            "Pending": projectTasks.filter((t: any) => t.status === "Pending").length,
            "In-progress": projectTasks.filter((t: any) => t.status === "In-progress").length,
            "Done": projectTasks.filter((t: any) => t.status === "Done").length,
            "Reviewing": projectTasks.filter((t: any) => t.status === "Reviewing").length,
            "Accepted": projectTasks.filter((t: any) => t.status === "Accepted").length,
          }
        };
      }),
    );

    // Format tasks for dashboard
    const taskSummaries: TaskSummary[] = tasks.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      status: t.status,
      duration: t.duration,
      endDate: t.endDate,
      color: t.color,
      projectName: t.project?.name || "Unknown",
      usernameAdmin: t.usernameAdmin,
    }));

    // Format upcoming tasks
    const upcomingTaskSummaries: TaskSummary[] = upcomingTasks.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      status: t.status,
      duration: t.duration,
      endDate: t.endDate,
      color: t.color,
      projectName: t.project?.name || "Unknown",
      usernameAdmin: t.usernameAdmin,
    }));

    // Calculate weekly productivity for the member (tasks assigned to them)
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyProductivity: Record<string, TaskSummary[]> = {};
    const nowDay = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(nowDay);
      date.setDate(date.getDate() - i);
      const dayName = daysArr[date.getDay()];
      const dayTasks = tasks.filter((t: any) => {
        const completedDate = new Date(t.updatedAt || t.createdAt);
        return t.status === 'Accepted' &&
               completedDate.toDateString() === date.toDateString();
      }).map((t: any) => ({
        _id: t._id.toString(),
        name: t.name,
        status: t.status as any,
        duration: t.duration,
        endDate: t.endDate,
        color: t.color,
        projectName: t.project?.name || "Unknown",
        usernameAdmin: t.usernameAdmin,
      }));
      weeklyProductivity[dayName] = dayTasks;
    }

    return {
      user: {
        username: user.username,
        role: user.role,
        email: user.email,
      },
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        reviewingTasks,
        doneTasks,
        acceptedTasks: completedTasks,
        personalCompletionRate,
        upcomingDeadlines: upcomingTasks.length,
      },
      projects: projectSummaries,
      tasks: taskSummaries,
      upcomingTasks: upcomingTaskSummaries,
      weeklyProductivity,
    };
  }

  // Helper to calculate admin dashboard data
  async calculateAdminDashboard(username: string): Promise<AdminDashboard> {
    // Get user info
    const user = await userSchema.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    // Get all projects where user is admin
    const managedProjects: Project[] = await projectSchema.find({
      usernameAdmin: username,
    });

    // Get all tasks from managed projects
    const projectIds = managedProjects.map((p: any) => p._id.toString());
    const allTasks: Task[] = await taskSchema.find({
      project: { $in: projectIds },
    });

    // Get unique team members from all managed projects
    const teamMembersSet = new Set<string>();
    managedProjects.forEach((p: any) => {
      p.usernameMember.forEach((member: string) => teamMembersSet.add(member));
    });
    const totalTeamMembers = teamMembersSet.size;

    // Calculate statistics
    const totalManagedProjects = managedProjects.length;
    const activeProjects = managedProjects.filter(
      (p: any) => p.status === "Active",
    ).length;
    const doneProjects = managedProjects.filter(
      (p: any) => p.status === "Done",
    ).length;
    const totalAssignedTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === "Accepted").length;
    const pendingTasks = allTasks.filter((t: any) => t.status === "Pending").length;
    const inProgressTasks = allTasks.filter(
      (t: any) => t.status === "In-progress",
    ).length;
    const reviewingTasks = allTasks.filter((t: any) => t.status === "Reviewing").length;
    const doneTasks = allTasks.filter((t: any) => t.status === "Done").length;
    const teamCompletionRate =
      totalAssignedTasks > 0
        ? Math.round((completedTasks / totalAssignedTasks) * 100)
        : 0;

    // Format projects for dashboard
    const projectSummaries: ProjectSummary[] = await Promise.all(
      managedProjects.map(async (p: any) => {
        const projectTasks = await taskSchema.find({ project: p._id });
        return {
          _id: p._id.toString(),
          name: p.name,
          status: p.status,
          percent: p.percent,
          duration: p.duration,
          endDate: p.endDate,
          color: p.color,
          usernameAdmin: p.usernameAdmin,
          memberCount: p.usernameMember.length,
          taskCount: projectTasks.length,
          completedTaskCount: projectTasks.filter((t: any) => t.status === "Done")
            .length,
          acceptedTaskCount: projectTasks.filter((t: any) => t.status === "Accepted")
            .length,
          statusBreakdown: {
            "Pending": projectTasks.filter((t: any) => t.status === "Pending").length,
            "In-progress": projectTasks.filter((t: any) => t.status === "In-progress").length,
            "Done": projectTasks.filter((t: any) => t.status === "Done").length,
            "Reviewing": projectTasks.filter((t: any) => t.status === "Reviewing").length,
            "Accepted": projectTasks.filter((t: any) => t.status === "Accepted").length,
          }
        };
      }),
    );

    // Get recent tasks (last 10)
    const recentTasks = allTasks
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    const recentTaskSummaries: TaskSummary[] = recentTasks.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      status: t.status,
      duration: t.duration,
      endDate: t.endDate,
      color: t.color,
      projectName: t.project?.name || "Unknown",
      usernameAdmin: t.usernameAdmin,
    }));

    // Calculate team performance
    const teamPerformance = Array.from(teamMembersSet).map((memberUsername) => {
      const memberTasks = allTasks.filter(
        (t: any) => t.usernameMember === memberUsername,
      );
      const memberCompletedTasks = memberTasks.filter(
        (t: any) => t.status === "Done",
      ).length;
      const memberAcceptedTasks = memberTasks.filter(
        (t: any) => t.status === "Accepted",
      ).length;
      const completionRate =
        memberTasks.length > 0
          ? Math.round((memberAcceptedTasks / memberTasks.length) * 100)
          : 0;

      // Calculate Rating: 5 - (reworks * 0.3) - (lateDays * 0.3)
      let totalRating = 0;
      let ratedTasksCount = 0;
      const now = new Date();

      for (const task of memberTasks) {
        // We only rate tasks that are either Accepted (final) or Overdue (current penalty)
        const isAccepted = task.status === "Accepted";
        const isOverdue = new Date(task.endDate) < now && task.status !== "Accepted" && task.status !== "Done";
        
        if (isAccepted || isOverdue) {
          let taskRating = 5.0;
          
          // Penalty for reworks
          taskRating -= (task.reviewCycles || 0) * 0.3;

          // Penalty for lateness
          let lateDate = isAccepted ? task.firstDoneAt : now;
          if (lateDate && new Date(lateDate) > new Date(task.endDate)) {
            const diffTime = Math.abs(new Date(lateDate).getTime() - new Date(task.endDate).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            taskRating -= diffDays * 0.3;
          } else if (!lateDate && isOverdue) {
             const diffTime = Math.abs(new Date().getTime() - new Date(task.endDate).getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             taskRating -= diffDays * 0.3;
          }

          totalRating += Math.max(0, taskRating);
          ratedTasksCount++;
        }
      }

      const rating = ratedTasksCount > 0 ? parseFloat((totalRating / ratedTasksCount).toFixed(1)) : 5.0;

      return {
        memberUsername,
        totalTasks: memberTasks.length,
        completedTasks: memberCompletedTasks,
        acceptedTasks: memberAcceptedTasks,
        completionRate,
        rating,
      };
    });

    // Calculate weekly productivity for admin (all managed projects)
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyProductivity: Record<string, TaskSummary[]> = {};
    const nowDay = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(nowDay);
      date.setDate(date.getDate() - i);
      const dayName = daysArr[date.getDay()];
      const dayTasks = allTasks.filter((t: any) => {
        const completedDate = new Date(t.updatedAt || t.createdAt);
        return t.status === 'Accepted' &&
               completedDate.toDateString() === date.toDateString();
      }).map((t: any) => ({
        _id: t._id.toString(),
        name: t.name,
        status: t.status as any,
        duration: t.duration,
        endDate: t.endDate,
        color: t.color,
        projectName: t.project?.name || "Unknown",
        usernameAdmin: t.usernameAdmin,
      }));
      weeklyProductivity[dayName] = dayTasks;
    }

    return {
      user: {
        username: user.username,
        role: user.role,
        email: user.email,
      },
      stats: {
        totalManagedProjects,
        totalTeamMembers,
        totalAssignedTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        reviewingTasks,
        doneTasks,
        acceptedTasks: completedTasks,
        teamCompletionRate,
        activeProjects,
        doneProjects,
      },
      projects: projectSummaries,
      recentTasks: recentTaskSummaries,
      teamPerformance,
      weeklyProductivity,
    };
  }

  // Get member dashboard handler
  getMemberDashboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.CurrentUser.username.toString();
        const data = await this.calculateMemberDashboard(username);
        res.status(200).json({ data });
      } catch (error: any) {
        return next(new Error(error.message));
      }
    },
  );

  // Get admin dashboard handler
  getAdminDashboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.CurrentUser.username.toString();
        const data = await this.calculateAdminDashboard(username);
        res.status(200).json({ data });
      } catch (error: any) {
        return next(new Error(error.message));
      }
    },
  );

  // Get overall statistics
  getOverallStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const username = req.CurrentUser.username.toString();

      // Get all projects where user is involved
      const projects: Project[] = await projectSchema.find({
        $or: [{ usernameMember: username }, { usernameAdmin: username }],
      });

      // Get all tasks where user is involved
      const tasks: Task[] = await taskSchema.find({
        $or: [{ usernameMember: username }, { usernameAdmin: username }],
      });

      // Calculate project statistics
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: any) => p.status === "Active").length;
      const inactiveProjects = projects.filter(
        (p: any) => p.status === "Inactive",
      ).length;
      const doneProjects = projects.filter((p: any) => p.status === "Done").length;

      // Calculate task statistics
      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter((t: any) => t.status === "Pending").length;
      const inProgressTasks = tasks.filter(
        (t: any) => t.status === "In-progress",
      ).length;
      const reviewingTasks = tasks.filter((t: any) => t.status === "Reviewing").length;
      const doneTasks = tasks.filter((t: any) => t.status === "Accepted").length;

      // Calculate completion rate
      const overallCompletionRate =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Calculate overdue items
      const now = new Date();
      const overdueProjects = projects.filter(
        (p: any) => p.endDate < now && p.status !== "Done",
      ).length;
      const overdueTasks = tasks.filter(
        (t: any) => t.endDate < now && t.status !== "Accepted",
      ).length;

      const stats: DashboardStats = {
        totalProjects,
        activeProjects,
        inactiveProjects,
        doneProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        reviewingTasks,
        doneTasks,
        acceptedTasks: doneTasks, // doneTasks variable already holds Accepted count
        overallCompletionRate,
        overdueProjects,
        overdueTasks,
      };

      res.status(200).json({ data: stats });
    },
  );
}

const dashboardServices = new DashboardServices();
export default dashboardServices;
