const Project = require('../models/Project');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


exports.createProject = catchAsyncError(async (req, res, next) => {
  // Direct validation check (works with multipart/form-data)
  const errors = [];
  if (!req.body.name || !req.body.name.trim()) {
    errors.push({ field: 'name', message: 'Project name is required' });
  } else if (req.body.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Project name must be at least 3 characters' });
  } else if (req.body.name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Project name must not exceed 200 characters' });
  }

  if (req.body.description && req.body.description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must not exceed 5000 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  try {
    // If a file was uploaded via Multer, set imageUrl automatically
    if (req.file) {
      // build full URL
      const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
      req.body.imageUrl = url;
    }
    
    const project = await Project.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    return next(error);
  }
});


exports.getProjects = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'name' and 'description' fields
  const result = await paginate(Project, req, ['name', 'description']);
  
  res.status(200).json({
    success: true,
    message: 'Projects fetched successfully',
    data: { projects: result.data },
    pagination: result.pagination,
  });
});


exports.getProject = catchAsyncError(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ErrorHandler('Project not found', 404));
  res.status(200).json({
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

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project },
  });
});


exports.deleteProject = catchAsyncError(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ErrorHandler('Project not found', 404));

  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: null,
  });
});
