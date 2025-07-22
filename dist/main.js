"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = __importDefault(require("./config"));
const src_1 = __importDefault(require("./src"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10kb' }));
dotenv_1.default.config();
(0, config_1.default)();
app.listen(process.env.PORT, () => {
    console.log(`server started on port ${process.env.PORT}`);
});
(0, src_1.default)(app);
