import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const user = await authService.getProfile(req.user.id);
      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }
      await authService.requestPasswordReset(email);
      res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (error: any) {
      console.error('Request password reset error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { code, newPassword } = req.body;
      if (!code || !newPassword) {
        res.status(400).json({ success: false, error: 'Verification code and new password are required' });
        return;
      }
      await authService.resetPassword(code, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}