import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie or Authorization header
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  req.user = payload;
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
