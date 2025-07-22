"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRouter = void 0;
const express_1 = require("express");
const project_services_1 = __importDefault(require("./project.services"));
const project_validation_1 = __importDefault(require("./project.validation"));
exports.projectRouter = (0, express_1.Router)();
exports.projectRouter.route("/")
    .get(project_services_1.default.getAll)
    .post(project_validation_1.default.create, project_services_1.default.create);
exports.projectRouter.route('/:id')
    .get(project_validation_1.default.getone, project_services_1.default.getOne)
    .put(project_validation_1.default.updateOne, project_services_1.default.updateOne)
    .delete(project_validation_1.default.deleteOne, project_services_1.default.deleteOne);
exports.default = exports.projectRouter;
