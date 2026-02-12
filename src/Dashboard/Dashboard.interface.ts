import { Document } from "mongoose";
import Project from "../Project/project.interface";
import Task from "../Task/task.interface";

// Overall statistics interface
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  inactiveProjects: number;
  doneProjects: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overallCompletionRate: number;
  overdueProjects: number;
  overdueTasks: number;
}

// Project summary for dashboard
export interface ProjectSummary {
  _id: string;
  name: string;
  status: "Active" | "Inactive" | "Done";
  percent: number;
  duration: string;
  endDate: Date;
  color: string;
  usernameAdmin: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
}

// Task summary for dashboard
export interface TaskSummary {
  _id: string;
  name: string;
  status: "Pending" | "In-progress" | "Done";
  duration: string;
  endDate: Date;
  color: string;
  projectName: string;
  usernameAdmin: string;
}

// Member dashboard data
export interface MemberDashboard {
  user: {
    username: string;
    role: string;
    email: string;
  };
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    personalCompletionRate: number;
    upcomingDeadlines: number;
  };
  projects: ProjectSummary[];
  tasks: TaskSummary[];
  upcomingTasks: TaskSummary[];
}

// Admin dashboard data
export interface AdminDashboard {
  user: {
    username: string;
    role: string;
    email: string;
  };
  stats: {
    totalManagedProjects: number;
    totalTeamMembers: number;
    totalAssignedTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    teamCompletionRate: number;
    activeProjects: number;
    doneProjects: number;
  };
  projects: ProjectSummary[];
  recentTasks: TaskSummary[];
  teamPerformance: {
    memberUsername: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }[];
}
