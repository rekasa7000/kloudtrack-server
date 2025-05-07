"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
router.post("/users", user_controller_1.createUser);
router.post("/users/bulk", user_controller_1.bulkCreateUsers);
exports.default = router;
