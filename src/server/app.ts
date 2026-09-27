import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './api/routes';

export function createExpressApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', apiRouter);

  return app;
}
