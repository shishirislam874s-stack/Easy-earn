import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes';
import { userAuthMiddleware } from './auth';

const app = express();

// Body parsing with 20MB limit for screenshots and payloads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Request logger for troubleshooting
app.use((req, res, next) => {
  next();
});

// Route handlers: mount routes on both '/api' and '/' to handle all rewrite variants seamlessly
app.use('/api', userAuthMiddleware, apiRouter);
app.use('/', userAuthMiddleware, apiRouter);

// Global error handler ensuring JSON responses are always returned (never raw 500 HTML)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Vercel Serverless API Error]:', err);
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    error: err?.message || 'সার্ভার অভ্যন্তরীণ ত্রুটি (Server Internal Error)',
    status,
  });
});

export default app;
