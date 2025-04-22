"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_handler_middleware_1 = require("../middleware/error-handler.middleware");
const router = (0, express_1.Router)();
router.post("/signin", (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    res.json("Hello world");
}));
exports.default = router;
