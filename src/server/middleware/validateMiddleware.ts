import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issuesList = (err as any).issues || (err as any).errors || [];
        return res.status(400).json({
          error: 'Validation failed',
          issues: issuesList.map((e: any) => ({ field: e.path?.join('.') || 'body', message: e.message })),
        });
      }
      return res.status(400).json({ error: 'Malformed request body' });
    }
  };
}
