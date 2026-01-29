const express = require('express');
const router = express.Router();
const { createTestimonial, getTestimonials, getTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const { isAuthenticated } = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');
const { validateTestimonialCreate, validateMongoId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Client testimonials management
 */

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a testimonial
 *     description: Create a new client testimonial
 *     security:
 *       - bearerAuth: []
 *     tags: [Testimonials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *             properties:
 *               clientName:
 *                 type: string
 *                 description: Client name
 *                 example: "Jane Smith"
 *               reviewText:
 *                 type: string
 *                 description: Review text
 *                 example: "Excellent service and support!"
 *               stars:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 default: 5
 *                 description: Rating (0-5 stars)
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, allowRoles('admin', 'systemmanager'), validateTestimonialCreate, createTestimonial);

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all testimonials with pagination and search
 *     description: Retrieve testimonials with pagination, sorting, and search functionality
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in client name and review text
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, stars, -stars]
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of testimonials with pagination metadata
 */
router.get('/', validatePagination, getTestimonials);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   get:
 *     summary: Get testimonial by ID
 *     description: Retrieve a single testimonial by its ID
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial found
 *       404:
 *         description: Testimonial not found
 */
router.get('/:id', validateMongoId, getTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update a testimonial
 *     description: Update testimonial details
 *     security:
 *       - bearerAuth: []
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientName:
 *                 type: string
 *                 description: Client name
 *               reviewText:
 *                 type: string
 *                 description: Review text
 *               stars:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Rating (0-5 stars)
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 *       404:
 *         description: Testimonial not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), validateMongoId, validateTestimonialCreate, updateTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     description: Delete a testimonial by its ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 *       404:
 *         description: Testimonial not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), validateMongoId, deleteTestimonial);

module.exports = router;
