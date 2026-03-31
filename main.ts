import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Connection from "./config";
import Routes from "./src";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import path from "path";
import i18n from "i18n";
import { Server } from "socket.io";
import { initChat } from "./src/middlewares/chat";
import mongoSanitize from 'express-mongo-sanitize';
import { initScheduler } from "./src/utils/scheduler";
import { initDailyScheduler } from "./src/utils/dailyScheduler";

const app: express.Application = express();
app.use(express.json({ limit: "1mb" }));

Connection();
app.use(express.static('uploads'))
app.use(helmet());
app.use(cors(
  {
    origin:["http://localhost:8080"],
    credentials:true
  }
));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    
  },
  maxHttpBufferSize: 1e5,
  
});
// Sanitize only body and params (req.query is read-only in newer Express)
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});
server.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT} with cors enabled`);
});
process.on("unhandledRejection", (err: Error) => {
  console.error(`unhandledRejection ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("shutting the application down");
    process.exit(1);
  });
});
i18n.configure({
  locales: ["en", "ar"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  queryParameter: "lang",
});
app.use(i18n.init);
Routes(app);

// Pass `io` into the chat initialiser. This avoids a circular dependency
// (chat.ts importing from main.ts) and guarantees io is fully constructed.
export { io };
initChat(io);
initScheduler();
initDailyScheduler();
