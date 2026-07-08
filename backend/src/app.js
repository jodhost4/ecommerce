require('dotenv').config();
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const prisma = require('./config/database');
const redisClient = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const { helmetConfig, corsConfig, hppConfig, xssProtection } = require('./middleware/security');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();

app.use(helmetConfig);
app.use(corsConfig);
app.use(hppConfig);
app.use(xssProtection);
app.use(compression({ level: 6, threshold: 0 }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    await redisClient.ping();
    console.log('Redis connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  redisClient.quit();
  process.exit(0);
});

module.exports = app;
