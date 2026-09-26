import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export function requireRole(...allowedRoles: ('STUDENT' | 'TEACHER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role "${req.user.role}" does not have permission for this resource.`,
      });
    }

    next();
  };
}
