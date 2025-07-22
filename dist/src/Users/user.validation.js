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
const express_validator_1 = require("express-validator");
const user_schema_1 = __importDefault(require("./user.schema"));
const validation_middleware_1 = __importDefault(require("../middlewares/validation.middleware"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserValidation {
    constructor() {
        this.register = [
            (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required')
                .custom((val_1, _a) => __awaiter(this, [val_1, _a], void 0, function* (val, { req }) {
                const user = yield user_schema_1.default.findOne({ username: val });
                if (user) {
                    throw new Error('Username already exists');
                }
                return true;
            })),
            (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
                .custom((val, { req }) => {
                if (val.length < 8) {
                    throw new Error('Password must be at least 8 characters long');
                }
                const confirmPassword = req.body.confirmPassword;
                if (val !== confirmPassword) {
                    throw new Error('Password and Confirm Password do not match');
                }
                return true;
            }),
            validation_middleware_1.default
        ];
        this.login = [
            (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required').custom((val_1, _a) => __awaiter(this, [val_1, _a], void 0, function* (val, { req }) {
                const user = yield user_schema_1.default.findOne({ username: val });
                if (!user) {
                    throw new Error('User not found please register first.....');
                }
                const isPasswordCorrect = bcrypt_1.default.compareSync(req.body.password, user.password);
                if (!isPasswordCorrect) {
                    throw new Error('Invalid Username or Password');
                }
                return true;
            })),
            (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
            validation_middleware_1.default
        ];
    }
}
const userValidation = new UserValidation();
exports.default = userValidation;
