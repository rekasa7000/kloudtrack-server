"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
router.post("/signin", (0, error_1.asyncHandler)(async (req, res, next) => {
    res.json("Hello world");
}));
exports.default = router;
