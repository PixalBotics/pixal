
const express = require('express');
const router = express.Router();
const { createTeamMember, getTeam, getTeamMember, updateTeamMember, deleteTeamMember } = require('../controllers/teamController');
const { isAuthenticated } = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');
const { imageUpload, handleMulterError } = require('../utils/upload');
const { validateTeamCreate, validateMongoId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Team
 *   description: Team members management
 */

/**
 * @swagger
 * /api/team:
 *   post:
 *     summary: Add a team member
 *     description: Create a new team member with optional photo upload
 *     security:
 *       - bearerAuth: []
 *     tags: [Team]
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
 *                 description: Team member name
 *                 example: "John Doe"
 *               role:
 *                 type: string
 *                 description: Team member role
 *                 example: "Full Stack Developer"
 *               bio:
 *                 type: string
 *                 description: Team member biography
 *                 example: "Experienced developer with 5+ years"
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Team member photo
 *     responses:
 *       201:
 *         description: Team member added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, allowRoles('admin', 'systemmanager'), imageUpload.single('photo'), handleMulterError, createTeamMember);

/**
 * @swagger
 * /api/team:
 *   get:
 *     summary: Get all team members with pagination and search
 *     description: Retrieve team members with pagination, sorting, and search functionality
 *     tags: [Team]
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
 *         description: Search in name, role, and bio
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, name, -name]
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of team members with pagination metadata
 */
router.get('/', validatePagination, getTeam);

/**
 * @swagger
 * /api/team/{id}:
 *   get:
 *     summary: Get team member by ID
 *     description: Retrieve a single team member by their ID
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     responses:
 *       200:
 *         description: Team member found
 *       404:
 *         description: Team member not found
 */
router.get('/:id', validateMongoId, getTeamMember);

/**
 * @swagger
 * /api/team/{id}:
 *   put:
 *     summary: Update a team member
 *     description: Update team member details and optionally upload new photo
 *     security:
 *       - bearerAuth: []
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Team member name
 *               role:
 *                 type: string
 *                 description: Team member role
 *               bio:
 *                 type: string
 *                 description: Team member biography
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: New team member photo (optional)
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *       404:
 *         description: Team member not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), imageUpload.single('photo'), handleMulterError, validateMongoId, updateTeamMember);

/**
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete a team member
 *     description: Delete a team member by their ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     responses:
 *       200:
 *         description: Team member deleted successfully
 *       404:
 *         description: Team member not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', isAuthenticated, allowRoles('admin', 'systemmanager'), validateMongoId, deleteTeamMember);

module.exports = router;
