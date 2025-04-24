import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRegister, validateLogin } from '../validators/auth-validator';

const router = Router();

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);
router.get('/profile', authenticate, AuthController.getProfile);

export { router as authRouter };