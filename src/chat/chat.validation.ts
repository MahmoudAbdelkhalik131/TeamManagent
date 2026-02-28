import { param, query } from "express-validator";
import projectSchema from "../Project/project.schema";
import userSchema from "../Users/user.schema";
import validatorMiddleware from "../middlewares/validation.middleware";

class ChatValidation {
  /**
   * Validate the :receiverUsername route param for private chat history.
   * Rules:
   *  - Must be a non-empty string
   *  - The receiver must actually exist in the users collection
   *  - A user cannot fetch a conversation with themselves
   */
  getPrivateHistory = [
    param("receiverUsername")
      .trim()
      .notEmpty()
      .withMessage("Receiver username is required")
      .custom(async (val, { req }) => {
        // Prevent self-conversation (nonsensical)
        if (val === req.CurrentUser.username) {
          throw new Error("You cannot fetch a conversation with yourself");
        }
        // Confirm the other party exists in the DB
        const user = await userSchema.findOne({ username: val });
        if (!user) {
          throw new Error(`User "${val}" not found`);
        }
        return true;
      }),
    validatorMiddleware,
  ];

  /**
   * Validate the :projectId route param for group chat and announcements.
   * Rules:
   *  - Must be a valid MongoDB ObjectId
   *  - The project must exist
   *  - The requesting user must be either the admin or a member of that project
   *    (prevents outsiders from reading internal project conversations)
   */
  getProjectChat = [
    param("projectId")
      .trim()
      .notEmpty()
      .withMessage("Project ID is required")
      .isMongoId()
      .withMessage("Invalid Project ID format")
      .custom(async (val, { req }) => {
        const project = await projectSchema.findById(val);
        if (!project) {
          throw new Error("Project not found");
        }
        const username = req.CurrentUser.username;
        const isAdmin = project.usernameAdmin === username;
        const isMember = project.usernameMember.includes(username);
        if (!isAdmin && !isMember) {
          throw new Error(
            "You are not authorized to view this project's chat"
          );
        }
        return true;
      }),
    validatorMiddleware,
  ];
}

const chatValidation = new ChatValidation();
export default chatValidation;
