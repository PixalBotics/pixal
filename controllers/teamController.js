const Team = require('../models/Team');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');
const { isConfigured: cloudinaryConfigured, uploadImage: uploadToCloudinary } = require('../utils/cloudinary');


exports.createTeamMember = catchAsyncError(async (req, res, next) => {
  // Direct validation check (works with multipart/form-data)
  const errors = [];
  if (!req.body.name || !req.body.name.trim()) {
    errors.push({ field: 'name', message: 'Team member name is required' });
  } else if (req.body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (req.body.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  if (req.body.role && req.body.role.length > 100) {
    errors.push({ field: 'role', message: 'Role must not exceed 100 characters' });
  }

  if (req.body.bio && req.body.bio.length > 1000) {
    errors.push({ field: 'bio', message: 'Bio must not exceed 1000 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  try {
    if (req.file) {
      if (cloudinaryConfigured()) {
        req.body.photoUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'pixal/team');
      } else {
        req.body.photoUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
      }
    }
    const member = await Team.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: { member },
    });
  } catch (error) {
    return next(error);
  }
});

exports.getTeam = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'name', 'role', and 'bio' fields
  const result = await paginate(Team, req, ['name', 'role', 'bio']);
  
  res.status(200).json({
    success: true,
    message: 'Team members fetched successfully',
    data: { members: result.data },
    pagination: result.pagination,
  });
});


exports.getTeamMember = catchAsyncError(async (req, res, next) => {
  const member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));
  res.status(200).json({
    success: true,
    message: 'Team member fetched successfully',
    data: { member },
  });
});


exports.updateTeamMember = catchAsyncError(async (req, res, next) => {
  let member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));

  if (req.file) {
    if (cloudinaryConfigured()) {
      req.body.photoUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'pixal/team');
    } else {
      req.body.photoUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    }
  }

  member = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Team member updated successfully',
    data: { member },
  });
});


exports.deleteTeamMember = catchAsyncError(async (req, res, next) => {
  const member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));

  await Team.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Team member deleted successfully',
    data: null,
  });
});
