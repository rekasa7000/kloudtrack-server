"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_config_1 = __importDefault(require("./config/environment.config"));
app_1.default.listen(environment_config_1.default.PORT, () => {
    console.log(`Server running on port ${environment_config_1.default.PORT}`);
});
