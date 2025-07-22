"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Connection = () => {
    try {
        mongoose_1.default.connect(process.env.DBLINK);
        console.log("connected to dataBase");
    }
    catch (e) {
        console.log(e);
    }
};
exports.default = Connection;
