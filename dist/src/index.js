"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const project_routes_1 = __importDefault(require("./Project/project.routes"));
const user_route_1 = __importDefault(require("./Users/user.route"));
const Routes = (app) => {
    app.use('/api/v1/project', project_routes_1.default);
    app.use('/api/v1/user', user_route_1.default);
};
exports.default = Routes;
