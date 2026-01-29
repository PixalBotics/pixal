const Contact = require('../models/Contact');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const sendEmail = require('../utils/sendEmail');
const { thankYouEmail, contactNotificationEmail } = require('../utils/emailTemplates');
const { paginate } = require('../utils/pagination');

// Create contact message (Public)
exports.createContact = catchAsyncError(async (req, res, next) => {
  const { name, email, subject, message, phone } = req.body;
  
  // Create contact in database
  const contact = await Contact.create({
    name,
    email,
    subject: subject || 'Contact Form Submission',
    message,
    phone
  });
  
  // Send thank you email to user
  try {
    await sendEmail({
      to: email,
      subject: `Thank You for Contacting ${process.env.APP_NAME || 'Pixal Botics'}`,
      html: thankYouEmail(name),
    });
    console.log(`✅ Thank you email sent to ${email}`);
  } catch (emailError) {
    console.error('❌ Failed to send thank you email:', emailError.message);
    // Don't fail the request if email fails
  }
  
  // Send notification to admin (info@pixalbotics.com)
  try {
    await sendEmail({
      to: process.env.EMAIL_USER || 'info@pixalbotics.com',
      subject: `New Contact Form Submission from ${name}`,
      html: contactNotificationEmail(contact),
    });
    console.log(`✅ Contact notification sent to admin`);
  } catch (emailError) {
    console.error('❌ Failed to send admin notification:', emailError.message);
  }
  
  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us! We will get back to you soon.',
    data: { contact },
  });
});

// Get all contacts (Admin only)
exports.getContacts = catchAsyncError(async (req, res, next) => {
  const result = await paginate(Contact, req, ['name', 'email', 'subject', 'message']);
  
  res.json({
    success: true,
    message: 'Contacts fetched successfully',
    data: { contacts: result.data },
    pagination: result.pagination,
  });
});

// Get single contact (Admin only)
exports.getContact = catchAsyncError(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) return next(new ErrorHandler('Contact not found', 404));
  
  res.json({
    success: true,
    message: 'Contact fetched successfully',
    data: { contact },
  });
});

// Update contact status (Admin only)
exports.updateContactStatus = catchAsyncError(async (req, res, next) => {
  const { status, replied } = req.body;
  
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status, replied },
    { new: true, runValidators: true }
  );
  
  if (!contact) return next(new ErrorHandler('Contact not found', 404));
  
  res.json({
    success: true,
    message: 'Contact status updated successfully',
    data: { contact },
  });
});

// Delete contact (Admin only)
exports.deleteContact = catchAsyncError(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) return next(new ErrorHandler('Contact not found', 404));
  
  await Contact.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Contact deleted successfully',
    data: null,
  });
});

