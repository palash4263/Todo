const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const taskRoutes = require('./routes/tasks.routes');
const { notFound, errorHandler } = require('./middleware/errors');

// CLIENT_ORIGIN: comma-separated list of allowed origins, or * (default) to allow any.
function corsOrigin() {
  const origins = (process.env.CLIENT_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return origins.includes('*') ? true : origins;
}

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render sits behind a proxy
  app.use(helmet());
  app.use(cors({ origin: corsOrigin() }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });
  app.use('/api/tasks', taskRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
