const User = require('../models/User');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const { 
  welcomeEmail, 
  forgotPasswordEmail, 
  passwordResetSuccessEmail,
  accountUpdateEmail,
  accountDeletedEmail 
} = require('../utils/emailTemplates');
const crypto = require('crypto');



exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  if (email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered', errors: { email: 'Email already exists' } });
  }
  const user = await User.create({ name, email, password, role });
  const userObj = user.toObject();
  delete userObj.password;
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user: userObj },
  });
});




exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  if (!email) errors.email = 'Email is required';
  if (email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email not found', errors: { email: 'Email not registered' } });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password', errors: { password: 'Password is incorrect' } });
  }
  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;
  // Generate JWT token
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '90d' });
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    data: { user: userObj },
  });
});


exports.getUser = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  
  // Validate MongoDB ObjectId format
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler('Invalid user ID format', 400));
  }
  
  const user = await User.findById(userId).select('-password');
  if (!user) return next(new ErrorHandler('User not found', 404));
  
  res.json({
    success: true,
    message: 'User fetched successfully',
    data: { user },
  });
});


// Get all users (Admin only)
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find().select('-password').sort('-createdAt');
  
  res.json({
    success: true,
    message: 'Users fetched successfully',
    count: users.length,
    data: { users },
  });
});


// Create user by admin (sends email with credentials)
exports.createUserByAdmin = catchAsyncError(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // Validation
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  if (email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  
  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ 
      success: false, 
      message: 'Email already registered', 
      errors: { email: 'Email already exists' } 
    });
  }
  
  // Create user
  const user = await User.create({ name, email, password, role: role || 'user' });
  const userObj = user.toObject();
  delete userObj.password;
  
  // Send welcome email with credentials
  try {
    await sendEmail({
      to: email,
      subject: `Welcome to ${process.env.APP_NAME || 'Pixal'} - Your Account Details`,
      html: welcomeEmail(name, email, password, role || 'user'),
    });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (emailError) {
    console.error('❌ Failed to send welcome email:', emailError.message);
    // Don't fail the request if email fails
  }
  
  res.status(201).json({
    success: true,
    message: 'User created successfully. Login credentials have been sent to the user\'s email.',
    data: { user: userObj },
  });
});


// Update user (Admin only)
exports.updateUser = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  
  // Validate MongoDB ObjectId format
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler('Invalid user ID format', 400));
  }
  
  let user = await User.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  
  const { name, email, role } = req.body;
  const updates = {};
  const changes = [];
  
  if (name && name !== user.name) {
    updates.name = name;
    changes.push({ field: 'Name', value: name });
  }
  if (email && email !== user.email) {
    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (emailExists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use', 
        errors: { email: 'Email already exists' } 
      });
    }
    updates.email = email;
    changes.push({ field: 'Email', value: email });
  }
  if (role && role !== user.role) {
    updates.role = role;
    changes.push({ field: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1) });
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'No changes provided' 
    });
  }
  
  user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select('-password');
  
  // Send update notification email
  if (changes.length > 0) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Updated',
        html: accountUpdateEmail(user.name, changes),
      });
    } catch (emailError) {
      console.error('❌ Failed to send update email:', emailError.message);
    }
  }
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});


// Delete user (Admin only)
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  
  // Validate MongoDB ObjectId format
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler('Invalid user ID format', 400));
  }
  
  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  
  // Prevent deleting yourself
  if (req.user.id === userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'You cannot delete your own account' 
    });
  }
  
  const userName = user.name;
  const userEmail = user.email;
  
  await User.findByIdAndDelete(userId);
  
  // Send deletion notification email
  try {
    await sendEmail({
      to: userEmail,
      subject: 'Account Deleted',
      html: accountDeletedEmail(userName, userEmail),
    });
  } catch (emailError) {
    console.error('❌ Failed to send deletion email:', emailError.message);
  }
  
  res.json({
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});


// Forget Password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide email address' 
    });
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'No user found with this email address' 
    });
  }
  
  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  
  // Send email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: forgotPasswordEmail(user.name, resetToken),
    });
    
    res.json({
      success: true,
      message: 'Password reset email sent successfully. Please check your email.',
      data: {
        // Only send in development
        ...(process.env.NODE_ENV !== 'production' && { resetToken }),
      },
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorHandler('Failed to send email. Please try again later.', 500));
  }
});


// Reset Password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide token and new password' 
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters' 
    });
  }
  
  // Hash the token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  
  if (!user) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid token or token has expired' 
    });
  }
  
  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  // Send success email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      html: passwordResetSuccessEmail(user.name),
    });
  } catch (emailError) {
    console.error('❌ Failed to send password reset success email:', emailError.message);
  }
  
  res.json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  });
});
