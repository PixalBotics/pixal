
const express = require('express');
const router = express.Router();
const { createBlog, getBlogs, getBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { isAuthenticated } = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');
const { pdfUpload } = require('../utils/upload');
const { validateBlogCreate, validateMongoId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog management
 */

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog
 *     description: Create a new blog with optional PDF attachment
 *     security:
 *       - bearerAuth: []
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Blog title
 *                 example: "How to Build Modern Web Apps"
 *               content:
 *                 type: string
 *                 description: Blog content
 *                 example: "This is a comprehensive guide..."
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file attachment
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, allowRoles('admin', 'systemmanager'), pdfUpload.single('pdf'), validateBlogCreate, createBlog);

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blogs with pagination and search
 *     description: Retrieve blogs with pagination, sorting, and search functionality
 *     tags: [Blogs]
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
 *         description: Search in blog name and content
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, name, -name]
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of blogs with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     blogs:
 *                       type: array
 *                       items:
 *                         type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', validatePagination, getBlogs);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get blog by ID
 *     description: Retrieve a single blog by its ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog found
 *       404:
 *         description: Blog not found
 */
router.get('/:id', validateMongoId, getBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog
 *     description: Update blog details and optionally upload new PDF
 *     security:
 *       - bearerAuth: []
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Blog title
 *               content:
 *                 type: string
 *                 description: Blog content
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: New PDF file (optional)
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), pdfUpload.single('pdf'), validateMongoId, validateBlogCreate, updateBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     description: Delete a blog by its ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), validateMongoId, deleteBlog);

module.exports = router;
