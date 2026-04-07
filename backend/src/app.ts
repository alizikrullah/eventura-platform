import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer'
import authRouter from './routes/auth'
import userRouter from './routes/user'
dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Eventura API is running',
    timestamp: new Date().toISOString() 
  });
});

// Routes will be added here
// Example:
// import authRoutes from './routes/auth.routes';
// app.use('/api/auth', authRoutes);

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 2 MB' : err.message

    return res.status(400).json({
      success: false,
      message,
      error: message,
    });
  }

  if (err instanceof Error && err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'File harus berupa gambar',
      error: 'File harus berupa gambar',
    });
  }

  console.error(err.stack);
  return res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});



export default app;