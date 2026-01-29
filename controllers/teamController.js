const Team = require('../models/Team');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


exports.createTeamMember = catchAsyncError(async (req, res, next) => {
  if (req.file) {
    const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    req.body.photoUrl = url;
  }
  const member = await Team.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Team member added successfully',
    data: { member },
  });
});

exports.getTeam = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'name', 'role', and 'bio' fields
  const result = await paginate(Team, req, ['name', 'role', 'bio']);
  
  res.json({
    success: true,
    message: 'Team members fetched successfully',
    data: { members: result.data },
    pagination: result.pagination,
  });
});


exports.getTeamMember = catchAsyncError(async (req, res, next) => {
  const member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));
  res.json({
    success: true,
    message: 'Team member fetched successfully',
    data: { member },
  });
});


exports.updateTeamMember = catchAsyncError(async (req, res, next) => {
  let member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));

  // If new file uploaded, update photoUrl
  if (req.file) {
    const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    req.body.photoUrl = url;
  }

  member = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: 'Team member updated successfully',
    data: { member },
  });
});


exports.deleteTeamMember = catchAsyncError(async (req, res, next) => {
  const member = await Team.findById(req.params.id);
  if (!member) return next(new ErrorHandler('Team member not found', 404));

  await Team.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Team member deleted successfully',
    data: null,
  });
});
