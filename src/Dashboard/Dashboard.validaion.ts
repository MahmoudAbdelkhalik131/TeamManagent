import { Request, Response, NextFunction } from "express";

class DashboardValidation {
  // Dashboard endpoints are GET requests with no body parameters
  // Validation is minimal since authentication middleware handles user verification
  
  // Additional validation can be added here if needed in the future
  // For example, query parameter validation for filtering or pagination
}

const dashboardValidation = new DashboardValidation();
export default dashboardValidation;
