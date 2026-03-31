import { Document } from "mongoose";
import { MemberDashboard, AdminDashboard } from "./Dashboard.interface";

export interface DashboardSnapshot extends Document {
  username: string;
  role: "member" | "admin";
  snapshotDate: Date;
  data: MemberDashboard | AdminDashboard | any;
}
