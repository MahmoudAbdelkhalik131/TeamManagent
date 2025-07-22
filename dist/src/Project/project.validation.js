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
const project_schema_1 = __importDefault(require("./project.schema"));
const validation_middleware_1 = __importDefault(require("../middlewares/validation.middleware"));
class ProjectValidation {
    constructor() {
        this.updateOne = [
            (0, express_validator_1.param)("id").isMongoId().withMessage("Invaild Id"),
            (0, express_validator_1.body)("name")
                .optional()
                .custom((val) => __awaiter(this, void 0, void 0, function* () {
                const project = yield project_schema_1.default.findOne({ name: val });
                if (project)
                    throw new Error("this Project Exits already");
            })),
            (0, express_validator_1.body)("color")
                .optional()
                .isEmpty()
                .withMessage("this field cann't be Empty"),
            (0, express_validator_1.body)("duration")
                .optional()
                .isEmpty()
                .withMessage("this field cann't be Empty"),
            validation_middleware_1.default,
        ];
        this.getone = [
            (0, express_validator_1.param)("id").isMongoId().withMessage("Invaild Id"),
            validation_middleware_1.default,
        ];
        this.deleteOne = [
            (0, express_validator_1.param)("id").isMongoId().withMessage("Invaild Id"),
            validation_middleware_1.default,
        ];
        this.create = [
            (0, express_validator_1.param)('id').isMongoId().withMessage("Invaild Id"),
            (0, express_validator_1.body)('name').isEmpty().withMessage("this field is required").custom((val) => __awaiter(this, void 0, void 0, function* () {
                const project = yield project_schema_1.default.findOne({ name: val });
                if (project)
                    throw new Error("this Project Exits already");
                return true;
            })),
            (0, express_validator_1.body)('color').isEmpty().withMessage("this field cann't be Empty"),
            (0, express_validator_1.body)('duration').isEmpty().withMessage("this field cann't be Empty"),
            validation_middleware_1.default
        ];
    }
}
const projectValidation = new ProjectValidation();
exports.default = projectValidation;
