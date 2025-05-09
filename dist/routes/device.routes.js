"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_handler_middleware_1 = require("../middleware/error-handler.middleware");
const router = (0, express_1.Router)();
router.post("/create", (0, error_handler_middleware_1.asyncHandler)((req, res) => {
    const { email, firstName, lastName, password } = req.body;
}));
router.post("/update", (0, error_handler_middleware_1.asyncHandler)((req, res) => { }));
router.post("/delete", (0, error_handler_middleware_1.asyncHandler)((req, res) => { }));
router.get("/:id", (0, error_handler_middleware_1.asyncHandler)((req, res) => { }));
exports.default = router;
