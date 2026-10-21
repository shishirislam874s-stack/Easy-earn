import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from '../server/routes';
import { userAuthMiddleware } from '../server/auth';

const app = express();

// Body parsing with 20MB limit for screenshots and payloads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Route handlers: support both '/api' prefixed calls and root rewrites
app.use('/api', userAuthMiddleware, apiRouter);
app.use('/', userAuthMiddleware, apiRouter);

export default app;
