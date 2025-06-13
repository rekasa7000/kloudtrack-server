import { Socket } from "socket.io";
import { AuthContainer } from "../../modules/auth/container";
import jwt from "jsonwebtoken";
import { config } from "../../config/environment";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  organizationId?: number;
  userRole?: string;
}

export const AuthWebSocketMiddleware = (authContainer: AuthContainer) => {
  return async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = extractToken(socket);

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid authentication token"));
      }

      const user = await authContainer.service.getProfile(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.organizationId = user.organizationId;
      socket.userRole = user.role;

      socket.join(`user:${user.id}`);

      if (user.organizationId) {
        socket.join(`organization:${user.organizationId}`);
      }

      next();
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  };
};

function extractToken(socket: Socket): string | null {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  if (socket.handshake.query?.token) {
    return socket.handshake.query.token as string;
  }

  const authHeader = socket.handshake.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }

  const cookies = socket.handshake.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}
