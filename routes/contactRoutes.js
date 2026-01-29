const express = require('express');
const router = express.Router();
const { 
  createContact, 
  getContacts, 
  getContact,
  updateContactStatus,
  deleteContact 
} = require('../controllers/contactController');
const { isAuthenticated } = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');
const { validateMongoId, validatePagination } = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form management
 */

// Contact form validation
const validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number too long'),
  handleValidationErrors,
];

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form (Public)
 *     description: Anyone can submit contact form. User receives thank you email, admin receives notification.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               subject:
 *                 type: string
 *                 example: "Project Inquiry"
 *               message:
 *                 type: string
 *                 example: "I would like to discuss a project..."
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Contact form submitted successfully. Thank you email sent.
 *       400:
 *         description: Validation error
 */
router.post('/', validateContact, createContact);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (Admin only)
 *     description: Retrieve all contact form submissions with pagination and search
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, subject, message
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, name, -name]
 *           default: -createdAt
 *         description: Sort field
 *     responses:
 *       200:
 *         description: List of contact messages
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', isAuthenticated, allowRoles('admin'), validatePagination, getContacts);

/**
 * @swagger
 * /api/contact/{id}:
 *   get:
 *     summary: Get single contact (Admin only)
 *     description: View specific contact message
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact message found
 *       404:
 *         description: Contact not found
 */
router.get('/:id', isAuthenticated, allowRoles('admin'), validateMongoId, getContact);

/**
 * @swagger
 * /api/contact/{id}:
 *   put:
 *     summary: Update contact status (Admin only)
 *     description: Mark contact as read, replied, or archived
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, read, replied, archived]
 *               replied:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Contact status updated
 *       404:
 *         description: Contact not found
 */
router.put('/:id', isAuthenticated, allowRoles('admin'), validateMongoId, updateContactStatus);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete contact (Admin only)
 *     description: Delete a contact message
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 */
router.delete('/:id', isAuthenticated, allowRoles('admin'), validateMongoId, deleteContact);

module.exports = router;

