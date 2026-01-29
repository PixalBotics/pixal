const Project = require('../models/Project');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


exports.createProject = catchAsyncError(async (req, res, next) => {
  // If a file was uploaded via Multer, set imageUrl automatically
  if (req.file) {
    // build full URL
    const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    req.body.imageUrl = url;
  }
  const project = await Project.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project },
  });
});


exports.getProjects = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'name' and 'description' fields
  const result = await paginate(Project, req, ['name', 'description']);
  
  res.json({
    success: true,
    message: 'Projects fetched successfully',
    data: { projects: result.data },
    pagination: result.pagination,
  });
});


exports.getProject = catchAsyncError(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ErrorHandler('Project not found', 404));
  res.json({
    success: true,
    message: 'Project fetched successfully',
    data: { project },
  });
});


exports.updateProject = catchAsyncError(async (req, res, next) => {
  let project = await Project.findById(req.params.id);
  if (!project) return next(new ErrorHandler('Project not found', 404));

  // If new file uploaded, update imageUrl
  if (req.file) {
    const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    req.body.imageUrl = url;
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project },
  });
});


exports.deleteProject = catchAsyncError(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ErrorHandler('Project not found', 404));

  await Project.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Project deleted successfully',
    data: null,
  });
});
