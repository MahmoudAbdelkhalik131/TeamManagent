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
  // Get member dashboard
  getMemberDashboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const username = req.CurrentUser.username.toString();

      // Get user info
      const user = await userSchema.findOne({ username });
      if (!user) {
        return next(new Error("User not found"));
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
      const completedTasks = tasks.filter((t) => t.status === "Done").length;
      const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
      const inProgressTasks = tasks.filter(
        (t) => t.status === "In-progress",
      ).length;
      const personalCompletionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Get upcoming tasks (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingTasks = tasks.filter(
        (t) =>
          t.endDate > now &&
          t.endDate <= nextWeek &&
          t.status !== "Done",
      );

      // Format projects for dashboard
      const projectSummaries: ProjectSummary[] = await Promise.all(
        projects.map(async (p) => {
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
            completedTaskCount: projectTasks.filter((t) => t.status === "Done")
              .length,
          };
        }),
      );

      // Format tasks for dashboard
      const taskSummaries: TaskSummary[] = tasks.map((t) => ({
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
      const upcomingTaskSummaries: TaskSummary[] = upcomingTasks.map((t) => ({
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
      const weeklyProductivity = [];
      const nowDay = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(nowDay);
        date.setDate(date.getDate() - i);
        const dayName = daysArr[date.getDay()];
        const count = tasks.filter(t => {
          const completedDate = new Date(t.updatedAt || t.createdAt);
          return t.status === 'Done' &&
                 completedDate.toDateString() === date.toDateString();
        }).length;
        weeklyProductivity.push({ name: dayName, tasks: count });
      }

      const memberDashboard: MemberDashboard = {
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
          personalCompletionRate,
          upcomingDeadlines: upcomingTasks.length,
        },
        projects: projectSummaries,
        tasks: taskSummaries,
        upcomingTasks: upcomingTaskSummaries,
        weeklyProductivity,
      };

      res.status(200).json({ data: memberDashboard });
    },
  );

  // Get admin dashboard
  getAdminDashboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const username = req.CurrentUser.username.toString();

      // Get user info
      const user = await userSchema.findOne({ username });
      if (!user) {
        return next(new Error("User not found"));
      }

      // Get all projects where user is admin
      const managedProjects: Project[] = await projectSchema.find({
        usernameAdmin: username,
      });

      // Get all tasks from managed projects
      const projectIds = managedProjects.map((p) => p._id.toString());
      const allTasks: Task[] = await taskSchema.find({
        project: { $in: projectIds },
      });

      // Get unique team members from all managed projects
      const teamMembersSet = new Set<string>();
      managedProjects.forEach((p) => {
        p.usernameMember.forEach((member) => teamMembersSet.add(member));
      });
      const totalTeamMembers = teamMembersSet.size;

      // Calculate statistics
      const totalManagedProjects = managedProjects.length;
      const activeProjects = managedProjects.filter(
        (p) => p.status === "Active",
      ).length;
      const doneProjects = managedProjects.filter(
        (p) => p.status === "Done",
      ).length;
      const totalAssignedTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === "Done").length;
      const pendingTasks = allTasks.filter((t) => t.status === "Pending").length;
      const inProgressTasks = allTasks.filter(
        (t) => t.status === "In-progress",
      ).length;
      const teamCompletionRate =
        totalAssignedTasks > 0
          ? Math.round((completedTasks / totalAssignedTasks) * 100)
          : 0;

      // Format projects for dashboard
      const projectSummaries: ProjectSummary[] = await Promise.all(
        managedProjects.map(async (p) => {
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
            completedTaskCount: projectTasks.filter((t) => t.status === "Done")
              .length,
          };
        }),
      );

      // Get recent tasks (last 10)
      const recentTasks = allTasks
        .sort(
          (a:any, b:any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10);

      const recentTaskSummaries: TaskSummary[] = recentTasks.map((t) => ({
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
          (t) => t.usernameMember === memberUsername,
        );
        const memberCompletedTasks = memberTasks.filter(
          (t) => t.status === "Done",
        ).length;
        const completionRate =
          memberTasks.length > 0
            ? Math.round((memberCompletedTasks / memberTasks.length) * 100)
            : 0;

        return {
          memberUsername,
          totalTasks: memberTasks.length,
          completedTasks: memberCompletedTasks,
          completionRate,
        };
      });

      // Calculate weekly productivity for admin (all managed projects)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyProductivity = [];
      const nowDay = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(nowDay);
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        const count = allTasks.filter(t => {
          const completedDate = new Date(t.updatedAt || t.createdAt);
          return t.status === 'Done' &&
                 completedDate.toDateString() === date.toDateString();
        }).length;
        weeklyProductivity.push({ name: dayName, tasks: count });
      }

      const adminDashboard: AdminDashboard = {
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
          teamCompletionRate,
          activeProjects,
          doneProjects,
        },
        projects: projectSummaries,
        recentTasks: recentTaskSummaries,
        teamPerformance,
        weeklyProductivity,
      };

      res.status(200).json({ data: adminDashboard });
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
      const activeProjects = projects.filter((p) => p.status === "Active").length;
      const inactiveProjects = projects.filter(
        (p) => p.status === "Inactive",
      ).length;
      const doneProjects = projects.filter((p) => p.status === "Done").length;

      // Calculate task statistics
      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
      const inProgressTasks = tasks.filter(
        (t) => t.status === "In-progress",
      ).length;
      const doneTasks = tasks.filter((t) => t.status === "Done").length;

      // Calculate completion rate
      const overallCompletionRate =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Calculate overdue items
      const now = new Date();
      const overdueProjects = projects.filter(
        (p) => p.endDate < now && p.status !== "Done",
      ).length;
      const overdueTasks = tasks.filter(
        (t) => t.endDate < now && t.status !== "Done",
      ).length;

      const stats: DashboardStats = {
        totalProjects,
        activeProjects,
        inactiveProjects,
        doneProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        doneTasks,
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
