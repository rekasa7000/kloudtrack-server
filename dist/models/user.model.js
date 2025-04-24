"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = __importDefault(require("../config/db"));
class UserModel {
    async create(data) {
        return db_1.default.user.create({ data });
    }
    async findByEmail(email) {
        return db_1.default.user.findUnique({ where: { email } });
    }
    async findById(id) {
        return db_1.default.user.findUnique({ where: { id } });
    }
    async update(id, data) {
        return db_1.default.user.update({ where: { id }, data });
    }
    async createResetToken(userId, token, expiresAt) {
        return db_1.default.resetToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }
    async findResetToken(token) {
        return db_1.default.resetToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
    }
    async deleteResetToken(id) {
        await db_1.default.resetToken.delete({ where: { id } });
    }
}
exports.UserModel = UserModel;
