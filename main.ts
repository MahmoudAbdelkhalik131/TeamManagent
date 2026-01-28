import express from "express";
import dotenv from "dotenv";
import Connection from "./config";
import Routes from "./src";
import cors from "cors"
import http from "http"
import helmet  from "helmet";
import { initSocket } from "./src/middlewares/chat";
import path from "path";
import i18n from "i18n";
const app: express.Application = express();
app.use(express.json({limit:'1mb'}));
dotenv.config();
Connection();
app.use(helmet())
app.use(cors());
const server = http.createServer(app);
initSocket(server);
app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT} with cors enabled`);
});
i18n.configure({
  locales: ["en", "ar"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  queryParameter: "lang",
});
app.use(i18n.init);
Routes(app);
