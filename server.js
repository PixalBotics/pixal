// Load environment variables early
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Mongoose connection helper that reads from process.env (config/db.js)
const connectDB = require('./config/db');

// Error handling middleware
const errorMiddleware = require('./middleware/errors');

// Initialize Express app
const app = express();
// Backend runs on port 3001 (Next.js will use 3000)
const port = process.env.PORT || 3001;

// Middleware setup
app.use(cors({ 
    origin: [
        'https://pixalbotics.com',
        'https://www.pixalbotics.com',
        'http://pixalbotics.com',
        'http://www.pixalbotics.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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

// Start function: connect to DB then start Express
async function start() {
  try {
    await connectDB();
    
    // Get local network IP
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
      const interfaces = networkInterfaces[interfaceName];
      interfaces.forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
        }
      });
    });
    
    // Listen on all network interfaces (0.0.0.0)
    app.listen(port, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 Pixal API Server Started                        ║
╠═══════════════════════════════════════════════════════╣
║   Port: ${port}                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                       ║
║   📱 Local Access:                                    ║
║   http://localhost:${port}                           ║
║                                                       ║
║   🌐 Network Access (from other devices):            ║
║   http://${localIP}:${port}                    ║
║                                                       ║
║   📚 API Documentation:                               ║
║   http://localhost:${port}/api-docs                  ║
║   http://${localIP}:${port}/api-docs           ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

start();
