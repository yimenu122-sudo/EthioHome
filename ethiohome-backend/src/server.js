/**
 * @file server.js
 * @description Server Bootstrap – Entry Point for EthioHome Backend
 * @author Senior Node.js Developer
 * @note Port 5003 conflicts cleared automatically again.
 */

const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');
const { connectDB, sequelize } = require('./config/db');
const socketHandler = require('./sockets/chat.socket');
const { initCronJobs } = require('./utils/cron');

/**
 * 1️⃣ SERVER INITIALIZATION
 */
const server = http.createServer(app);

// Configure Socket.io with production-ready security
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.io Chat Handlers
socketHandler(io);

/**
 * 2️⃣ SERVER BOOTSTRAP PROCESS
 */
const bootstrap = async () => {
  try {
    console.log('--- EthioHome Backend: Initializing Bootstrap ---');
    
    // Connect to PostgreSQL via Sequelize
    await connectDB();
    
    // Init Cron Jobs
    initCronJobs();
    
    // Start Listening for HTTP Requests
    server.listen(PORT, () => {
      console.log(`🚀 Server is running in ${NODE_ENV.toUpperCase()} mode`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Bootstrap failed to start:', error.message);
    process.exit(1);
  }
};

/**
 * 3️⃣ GRACEFUL SHUTDOWN HANDLER
 * Ensures all connections are closed properly before exiting
 */
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // 1. Close HTTP Server (Stops accepting new requests)
  server.close(() => {
    console.log('✅ HTTP server closed.');
    
    // 2. Close PostgreSQL Connection
    sequelize.close()
      .then(() => {
        console.log('✅ PostgreSQL connection closed.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing database:', err);
        process.exit(1);
      });
  });

  // Force shutdown after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000);
};

/**
 * 4️⃣ UNEXPECTED CRASH & SIGNAL HANDLING
 */

// Handle termination signals (e.g., from Docker, PM2, or Ctrl+C)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  const errMsg = err && (err.message || String(err));
  const errCode = err && err.code;

  if (errCode === 'ERR_STREAM_PREMATURE_CLOSE' || (errMsg && errMsg.includes('Premature close'))) {
    console.warn('⚠️  Promise premature close detected (Client disconnected). Ignoring to prevent server crash.');
    return;
  }

  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(`Error: ${err ? err.name : 'Unknown'} - ${errMsg}`);
  if (err && err.stack) console.error(err.stack);
  
  // Give server time to finish current requests before shutting down
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  const errMsg = err && (err.message || String(err));
  const errCode = err && err.code;

  // Gracefully handle Premature Close (client disconnect mid-stream)
  if (errCode === 'ERR_STREAM_PREMATURE_CLOSE' || (errMsg && errMsg.includes('Premature close'))) {
    console.warn('⚠️  Stream premature close detected (Client disconnected). Ignoring to prevent server crash.');
    return;
  }

  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(`Error: ${err ? err.name : 'Unknown'} - ${errMsg}`);
  if (err && err.stack) console.error(err.stack);
  
  // Attempt to close server before exiting to prevent EADDRINUSE on restart
  if (server && server.listening) {
    server.close(() => {
      console.log('✅ Server closed after exception.');
      process.exit(1);
    });
    // Force exit if close takes too long
    setTimeout(() => process.exit(1), 3000);
  } else {
    process.exit(1);
  }
});

// Start the application
bootstrap();
