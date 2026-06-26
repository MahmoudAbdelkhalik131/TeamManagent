import { Router } from "express";
import dashboardServices from "./Dashboard.services";
import auth from "../auth/auth.middleware";


export const dashboardRouter: Router = Router();

// Get member dashboard - accessible to all authenticated users
dashboardRouter.get(
  "/member",
  auth.verifyToken,
  dashboardServices.getMemberDashboard,
);

// Get admin dashboard - accessible only to admins
dashboardRouter.get(
  "/admin",
  auth.allowedRoles(["admin"]),
  dashboardServices.getAdminDashboard,
);

// Get overall statistics - accessible to all authenticated users
dashboardRouter.get(
  "/stats",
  auth.verifyToken,
  dashboardServices.getOverallStats,
);

// Get dashboard history - accessible to all authenticated users
dashboardRouter.get(
  "/history",
  auth.verifyToken,
  dashboardServices.getDashboardHistory,
);

// Get AI Insights - accessible to all authenticated users
dashboardRouter.get(
  "/ai-insights",
  auth.allowedRoles(["admin"]),
  auth.verifyToken,
  dashboardServices.getAIInsights,
);

export default dashboardRouter;

