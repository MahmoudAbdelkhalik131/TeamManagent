"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class Tokens {
    createToken(payload) {
        jsonwebtoken_1.default.sign({ payload }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE_DATE });
    }
    verifyToken(token, secretKey) {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
    }
}
const Token = new Tokens();
exports.default = Token;
