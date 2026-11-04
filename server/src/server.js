require('dotenv').config({ quiet: true });
const dns = require('dns');
const mongoose = require('mongoose');

// Some Windows setups (VPNs, local DNS proxies) make Node query 127.0.0.1, which refuses
// the SRV lookup for mongodb+srv:// URIs. DNS_SERVERS=8.8.8.8,1.1.1.1 works around it.
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
const createApp = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(process.env.MONGODB_URI);
  const server = createApp().listen(PORT, () => console.log(`API listening on port ${PORT}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
