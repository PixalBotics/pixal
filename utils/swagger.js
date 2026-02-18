const swaggerJsdoc = require('swagger-jsdoc');

// Get production URL from environment (Render provides RENDER_EXTERNAL_URL)
const productionUrl = process.env.RENDER_EXTERNAL_URL || process.env.PRODUCTION_URL || 'https://api.pixal.com';
const port = process.env.PORT || 3001;

// Build servers array dynamically
const servers = [
  {
    url: `http://localhost:${port}`,
    description: 'Development server'
  }
];

// Add production server only if we're in production or have production URL
if (process.env.NODE_ENV === 'production' || productionUrl !== 'https://api.pixal.com') {
  servers.push({
    url: productionUrl,
    description: 'Production server'
  });
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pixal API',
      version: '1.0.0',
      description: `
        # Pixal API Documentation
        
        Professional API for managing blogs, projects, team members, and testimonials.
        
        ## Features
        - ✅ JWT Authentication & Authorization
        - ✅ Pagination & Search on all GET endpoints
        - ✅ File Upload (Images & PDFs)
        - ✅ Input Validation
        - ✅ Error Handling
        - ✅ Role-based Access Control
        
        ## Authentication
        Most POST endpoints require authentication. Use the login endpoint to get a token,
        then include it in the Authorization header as: \`Bearer <token>\`
        
        ## Pagination
        All listing endpoints support the following query parameters:
        - \`page\`: Page number (default: 1)
        - \`limit\`: Items per page (default: 10, max: 100)
        - \`search\`: Search term for filtering
        - \`sortBy\`: Sort field (prefix with - for descending order)
      `,
      contact: {
        name: 'API Support',
        email: 'support@pixal.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            count: {
              type: 'integer',
              description: 'Number of items in current page'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            },
            hasNextPage: {
              type: 'boolean'
            },
            hasPrevPage: {
              type: 'boolean'
            },
            nextPage: {
              type: 'integer',
              nullable: true
            },
            prevPage: {
              type: 'integer',
              nullable: true
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User authentication and management'
      },
      {
        name: 'Blogs',
        description: 'Blog posts management'
      },
      {
        name: 'Projects',
        description: 'Portfolio projects management'
      },
      {
        name: 'Team',
        description: 'Team members management'
      },
      {
        name: 'Testimonials',
        description: 'Client testimonials management'
      }
    ]
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
