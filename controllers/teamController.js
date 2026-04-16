const Team = require('../models/Team');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { isConfigured: cloudinaryConfigured, uploadImage: uploadToCloudinary, deleteByUrl: deleteFromCloudinary } = require('../utils/cloudinary');


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
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim();
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
    ];
  }

  const members = await Team.find(query).sort('-createdAt').lean().exec();

  const priorityRoles = ['co-founder', 'founder', 'cto'];
  const getRolePriority = (role = '') => {
    const normalizedRole = String(role).toLowerCase();
    if (normalizedRole.includes('co-founder')) return 0;
    if (normalizedRole.includes('founder')) return 1;
    if (normalizedRole.includes('cto')) return 2;
    return 3;
  };

  members.sort((a, b) => {
    const rolePriorityDiff = getRolePriority(a.role) - getRolePriority(b.role);
    if (rolePriorityDiff !== 0) return rolePriorityDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const total = members.length;
  const paginatedMembers = members.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit) || 0;

  res.status(200).json({
    success: true,
    message: 'Team members fetched successfully',
    data: { members: paginatedMembers },
    pagination: {
      total,
      count: paginatedMembers.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
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
    if (member.photoUrl && cloudinaryConfigured()) {
      await deleteFromCloudinary(member.photoUrl).catch(() => {});
    }
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

  if (member.photoUrl) {
    await deleteFromCloudinary(member.photoUrl).catch(() => {});
  }
  await Team.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Team member deleted successfully',
    data: null,
  });
});
