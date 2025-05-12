import jwt from 'jsonwebtoken';

export const generateToken = (payload: { id: number }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
};