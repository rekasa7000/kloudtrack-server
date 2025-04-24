import { Role } from '@prisma/client';

export interface AuthUser {
  id: number;
  userName: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  role?: string;
}