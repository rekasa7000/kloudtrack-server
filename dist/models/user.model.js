"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
class UserModel {
    async create(data) {
        return database_config_1.default.user.create({ data });
    }
    async findByEmail(email) {
        return database_config_1.default.user.findUnique({ where: { email } });
    }
    async findById(id) {
        return database_config_1.default.user.findUnique({ where: { id } });
    }
    async update(id, data) {
        return database_config_1.default.user.update({ where: { id }, data });
    }
    async createResetToken(userId, token, expiresAt) {
        return database_config_1.default.resetToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }
    async findResetToken(token) {
        return database_config_1.default.resetToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
    }
    async deleteResetToken(id) {
        await database_config_1.default.resetToken.delete({ where: { id } });
    }
}
exports.UserModel = UserModel;
