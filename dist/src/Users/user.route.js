"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_validation_1 = __importDefault(require("./user.validation"));
const user_service_1 = __importDefault(require("./user.service"));
const Usersrouter = (0, express_1.Router)();
Usersrouter.post('/register', user_validation_1.default.register, user_service_1.default.register);
Usersrouter.post('/login', user_validation_1.default.login, user_service_1.default.login);
Usersrouter.post('/logout', user_service_1.default.logout);
exports.default = Usersrouter;
