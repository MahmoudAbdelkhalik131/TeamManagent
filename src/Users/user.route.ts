import { Router } from "express";
import userValidation from "./user.validation";
import userService from "./user.service";
import RateLimiter from "../middlewares/ratelimiter"
const Usersrouter = Router();
Usersrouter.use(RateLimiter)
Usersrouter.post("/register", userValidation.register, userService.register);
Usersrouter.post("/login", userValidation.login, userService.login);

export default Usersrouter;
