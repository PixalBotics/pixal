
const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { isAuthenticated } = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');
const { projectImagesUpload, handleMulterError } = require('../utils/upload');
const { validateProjectCreate, validateProjectUpdate, validateMongoId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: |
 *       Multipart fields: **name** (required), **description** (optional text),
 *       **coverImage** (optional, single file), **images** (optional, up to 10 gallery files — separate from cover).
 *     security:
 *       - bearerAuth: []
 *     tags: [Projects]
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
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description (body text)
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Single cover / thumbnail image
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images (max 10), separate field from coverImage
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  isAuthenticated,
  allowRoles('admin', 'systemmanager'),
  projectImagesUpload,
  handleMulterError,
  validateProjectCreate,
  createProject
);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with pagination and search
 *     description: Retrieve projects with pagination, sorting, and search functionality
 *     tags: [Projects]
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
 *         description: Search in project name and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, name, -name]
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of projects with pagination metadata
 */
router.get('/', validatePagination, getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a single project by its ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project found
 *       404:
 *         description: Project not found
 */
router.get('/:id', validateMongoId, getProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: |
 *       Optional **coverImage** replaces only the cover; optional **images** (up to 10) replaces only the gallery.
 *       **name** and **description** can be updated without files.
 *     security:
 *       - bearerAuth: []
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  isAuthenticated,
  allowRoles('admin', 'systemmanager'),
  projectImagesUpload,
  handleMulterError,
  validateMongoId,
  validateProjectUpdate,
  updateProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by its ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), validateMongoId, deleteProject);

module.exports = router;
