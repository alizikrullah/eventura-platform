import app from './app';
import { startSchedulers } from './config/scheduler';
import { startCronJobs } from './jobs/transactionJobs';

const PORT = process.env.PORT || 5000;

startSchedulers()
startCronJobs();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
