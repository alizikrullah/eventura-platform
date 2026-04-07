import app from './app';
import { startSchedulers } from './config/scheduler';

const PORT = process.env.PORT || 5000;

startSchedulers()

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
