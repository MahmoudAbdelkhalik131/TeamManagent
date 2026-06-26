export interface AppMessage {
  code: string;
  message: string;
}

const MESSAGES: Record<string, AppMessage> = {
  GENERIC_ERROR: { code: 'ERR_GEN_001', message: "An unexpected error occurred" },
  AUTH_INVALID_CREDENTIALS: { code: 'ERR_AUTH_001', message: "Invalid username or password" },
  AUTH_REQUIRED: { code: 'ERR_AUTH_002', message: "Authentication required" },
  FORBIDDEN: { code: 'ERR_AUTH_003', message: "Not authorized to perform this action" },
  NOT_FOUND: { code: 'ERR_GEN_404', message: "Resource not found" },
  INVALID_INPUT: { code: 'ERR_VAL_001', message: "Invalid input" },
  CREATED: { code: 'SUCCESS_001', message: "Created successfully" },
  UPDATED: { code: 'SUCCESS_002', message: "Updated successfully" },
  DELETED: { code: 'SUCCESS_003', message: "Deleted successfully" },
  INVALID_STATUS: { code: 'ERR_VAL_002', message: "Invalid status value" },
  INVALID_ID: { code: 'ERR_VAL_003', message: "Invalid id format" },
  RATE_LIMIT: { code: 'ERR_GEN_429', message: "Too many requests, please try again later" },
  
  // Specific Registration Errors
  AUTH_EMAIL_EXISTS: { code: 'ERR_AUTH_004', message: "email already exists" },
  AUTH_USERNAME_EXISTS: { code: 'ERR_AUTH_005', message: "Username already exists" },
  AUTH_USER_NOT_FOUND: { code: 'ERR_AUTH_006', message: "User not found please register first" },
};

export default MESSAGES;