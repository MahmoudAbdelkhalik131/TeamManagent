import express from "express";
import dotenv from "dotenv";
import Connection from "./config";
import Routes from "./src";
import RateLimiter from "./src/middlewares/ratelimiter";
import cors from "cors"
import helmet  from "helmet";
import io from "socket.io"
const app: express.Application = express();
app.use(express.json({limit:'1mb'}));
dotenv.config();
Connection();
app.use(helmet())
app.use(cors());
app.use( RateLimiter)
app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT} with cors enabled`);
});

Routes(app);
