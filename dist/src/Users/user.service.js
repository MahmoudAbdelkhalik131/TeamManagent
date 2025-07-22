"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_schema_1 = __importDefault(require("./user.schema"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Tokens_1 = __importDefault(require("../middlewares/Tokens"));
class UserService {
    constructor() {
        this.login = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            const user = yield user_schema_1.default.findOne({ username: username });
            if (!user) {
                return next(new Error('User not found'));
            }
            const isPasswordCorrect = bcrypt_1.default.compareSync(password, user.password);
            if (!isPasswordCorrect) {
                return next(new Error('Invalid Username or Password'));
            }
            const token = Tokens_1.default.createToken(user);
            res.status(200).json({ data: { username: user.username, userRole: user.role, UserId: user.id, token: token }, message: 'User logged in successfully' });
        }));
        this.register = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const newUser = yield user_schema_1.default.create({
                username: req.body.username,
                password: bcrypt_1.default.hashSync(req.body.password, 10),
            });
            yield newUser.save();
            res.status(201).json({ data: newUser.username, message: 'User registered successfully' });
        }));
        this.logout = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            res.clearCookie('token');
            res.status(200).json({ message: 'Logged out successfully' });
        }));
    }
}
const userService = new UserService();
exports.default = userService;
