"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    static async register(req, res) {
        try {
            const { userName, email, password, role = 'USER' } = req.body;
            const { user, token } = await authService.register({ userName, email, password, role });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict',
            });
            res.status(201).json({
                success: true,
                data: { id: user.id, userName: user.userName, email: user.email, role: user.role, token },
            });
        }
        catch (error) {
            console.error('Register error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token } = await authService.login(email, password);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict',
            });
            res.json({
                success: true,
                data: { id: user.id, userName: user.userName, email: user.email, role: user.role, token },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const user = await authService.getProfile(req.user.id);
            res.json({ success: true, data: user });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
    static async logout(req, res) {
        res.clearCookie('token');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    static async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, error: 'Email is required' });
                return;
            }
            await authService.requestPasswordReset(email);
            res.json({ success: true, message: 'Password reset link sent to your email' });
        }
        catch (error) {
            console.error('Request password reset error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                res.status(400).json({ success: false, error: 'Token and new password are required' });
                return;
            }
            await authService.resetPassword(token, newPassword);
            res.json({ success: true, message: 'Password reset successfully' });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
exports.AuthController = AuthController;
