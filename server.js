// Load environment variables early
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Mongoose connection helper that reads from process.env (config/db.js)
const connectDB = require('./config/db');

// Error handling middleware
const errorMiddleware = require('./middleware/errors');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration - Public (Allow all origins)
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve uploads as static
app.use('/uploads', express.static('uploads'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pixal API Server is running!',
    version: '1.0.0',
    docs: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Keep-alive endpoint for Render (prevents server from sleeping)
app.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// API routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const teamRoutes = require('./routes/teamRoutes');
const contactRoutes = require('./routes/contactRoutes');

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/contact', contactRoutes);

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pixal API Documentation'
}));

// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NotFound'
  });
});

// Global error handler - must be the last middleware
app.use(errorMiddleware);

// Keep-alive interval for Render (prevents server from sleeping)
let keepAliveInterval;
const startKeepAlive = () => {
  // For production on Render, ping the /ping endpoint to keep server awake
  if (process.env.NODE_ENV === 'production') {
    const serviceUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL;
    const interval = parseInt(process.env.KEEP_ALIVE_INTERVAL) || 300000; // 5 minutes default
    
    if (serviceUrl) {
      const keepAliveUrl = `${serviceUrl}/ping`;
      
      keepAliveInterval = setInterval(() => {
        try {
          const https = require('https');
          const http = require('http');
          const client = keepAliveUrl.startsWith('https') ? https : http;
          
          client.get(keepAliveUrl, (res) => {
            res.on('data', () => {}); // Consume response
            res.on('end', () => {
              if (res.statusCode === 200) {
                console.log(`✅ Keep-alive ping successful`);
              }
            });
          }).on('error', (err) => {
            // Silent fail for connection errors
            if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
              console.log(`⚠️ Keep-alive ping failed: ${err.message}`);
            }
          });
        } catch (error) {
          // Silent fail
        }
      }, interval);
      
      console.log(`🔄 Keep-alive enabled: pinging ${keepAliveUrl} every ${interval / 1000}s`);
    } else {
      // Fallback: Use internal request to /ping endpoint
      keepAliveInterval = setInterval(() => {
        // Internal ping to keep server active
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/ping',
          method: 'GET',
          timeout: 5000
        };
        
        const req = http.request(options, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`✅ Internal keep-alive ping successful`);
            }
          });
        });
        
        req.on('error', () => {
          // Silent fail
        });
        
        req.on('timeout', () => {
          req.destroy();
        });
        
        req.end();
      }, interval);
      
      console.log(`🔄 Internal keep-alive enabled: pinging every ${interval / 1000}s`);
    }
  }
};

// Start function: connect to DB then start Express
async function start() {
  try {
    await connectDB();
    
    // Get local network IP (only for development)
    let localIP = 'localhost';
    if (process.env.NODE_ENV !== 'production') {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
          }
        });
      });
    }
    
    // Listen on all network interfaces
    app.listen(port, '0.0.0.0', () => {
      const env = process.env.NODE_ENV || 'development';
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 Pixal API Server Started                        ║
╠═══════════════════════════════════════════════════════╣
║   Port: ${port}                                      ║
║   Environment: ${env}                                ║
║   CORS: Public (All origins allowed)                 ║
      `);
      
      if (env !== 'production') {
        console.log(`
║                                                       ║
║   📱 Local Access:                                    ║
║   http://localhost:${port}                           ║
║                                                       ║
║   🌐 Network Access:                                 ║
║   http://${localIP}:${port}                          ║
║                                                       ║
║   📚 API Documentation:                               ║
║   http://localhost:${port}/api-docs                  ║
        `);
      }
      
      console.log(`
║   🏥 Health Check: /health                            ║
║   🔄 Keep-Alive: /ping                                ║
╚═══════════════════════════════════════════════════════╝
      `);
      
      // Start keep-alive for production
      startKeepAlive();
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...');
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  process.exit(0);
});

start();
