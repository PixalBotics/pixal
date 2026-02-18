const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Ensure response is sent
    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path || err.param || err.location,
          message: err.msg,
        })),
      });
    }
  }
  next();
};

// Blog validations
const validateBlogCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Blog name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Blog name must be between 3 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 }).withMessage('Content must not exceed 10000 characters'),
  handleValidationErrors,
];

// Project validations
const validateProjectCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Project name must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  handleValidationErrors,
];

// Team validations
const validateTeamCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team member name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Role must not exceed 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Bio must not exceed 1000 characters'),
  handleValidationErrors,
];

// Testimonial validations
const validateTestimonialCreate = [
  body('clientName')
    .trim()
    .notEmpty().withMessage('Client name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Client name must be between 2 and 100 characters'),
  body('reviewText')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Review text must not exceed 2000 characters'),
  body('stars')
    .optional()
    .isInt({ min: 0, max: 5 }).withMessage('Stars must be between 0 and 5'),
  handleValidationErrors,
];

// MongoDB ObjectId validation
const validateMongoId = [
  param('id')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('Invalid ID format'),
  handleValidationErrors,
];

// Pagination and search validations
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search query must not exceed 200 characters'),
  query('sortBy')
    .optional()
    .trim()
    .isIn(['createdAt', 'name', 'updatedAt', '-createdAt', '-name', '-updatedAt'])
    .withMessage('Invalid sort field'),
  handleValidationErrors,
];

module.exports = {
  validateBlogCreate,
  validateProjectCreate,
  validateTeamCreate,
  validateTestimonialCreate,
  validateMongoId,
  validatePagination,
  handleValidationErrors,
};

