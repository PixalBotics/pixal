const Project = require('../models/Project');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');
const { isConfigured: cloudinaryConfigured, uploadImage: uploadToCloudinary, deleteByUrl: deleteFromCloudinary } = require('../utils/cloudinary');


exports.createProject = catchAsyncError(async (req, res, next) => {
  // Direct validation check (works with multipart/form-data)
  const errors = [];
  if (!req.body.name || !req.body.name.trim()) {
    errors.push({ field: 'name', message: 'Project name is required' });
  } else if (req.body.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Project name must be at least 3 characters' });
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
        req.body.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'pixal/projects');
      } else {
        req.body.imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
      }
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

  if (req.file) {
    if (project.imageUrl && cloudinaryConfigured()) {
      await deleteFromCloudinary(project.imageUrl).catch(() => {});
    }
    if (cloudinaryConfigured()) {
      req.body.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'pixal/projects');
    } else {
      req.body.imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    }
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

  if (project.imageUrl) {
    await deleteFromCloudinary(project.imageUrl).catch(() => {});
  }
  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: null,
  });
});
