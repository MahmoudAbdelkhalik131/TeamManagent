import express from "express";
import dotenv from "dotenv";
import Connection from "./config";
import Routes from "./src";
import RateLimiter from "./src/middlewares/ratelimiter";
import cors from "cors"
const app: express.Application = express();
app.use(express.json());
dotenv.config();
Connection();
app.use(cors());
app.use( RateLimiter)
app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT} with cors enabled`);
});

Routes(app);
