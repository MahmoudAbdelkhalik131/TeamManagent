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
const project_schema_1 = __importDefault(require("./project.schema"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
class ProjectServices {
    constructor() {
        this.getAll = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const project = yield project_schema_1.default.find();
            if (!project)
                res.json({ message: "OPSss THERE IS NO DATA" });
            res.status(200).json({ data: project });
        }));
        this.create = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const project = yield project_schema_1.default.create(req.body);
            res.status(201).json({ data: project });
        }));
        this.deleteOne = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield project_schema_1.default.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Item deleted succefully" });
        }));
        this.getOne = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const project = yield project_schema_1.default.findById(req.params.id);
            res.status(200).json({ data: project });
        }));
        this.updateOne = (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const project = yield project_schema_1.default.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
            res.status(200).json({ data: project });
        }));
    }
}
const projectServices = new ProjectServices();
exports.default = projectServices;
