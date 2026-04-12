const Project = require('../models/Project');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');
const { isConfigured: cloudinaryConfigured, uploadImage: uploadToCloudinary, deleteByUrl: deleteFromCloudinary } = require('../utils/cloudinary');

function getCoverFile(req) {
  return req.files?.coverImage?.[0] ?? null;
}

function getGalleryFiles(req) {
  return req.files?.images?.length ? [...req.files.images] : [];
}

async function uploadOneImage(file, req) {
  const base = `${req.protocol}://${req.get('host')}`;
  if (cloudinaryConfigured()) {
    if (!file.buffer) throw new Error('Missing file buffer for Cloudinary upload');
    return uploadToCloudinary(file.buffer, file.mimetype, 'pixal/projects');
  }
  return `${base}/uploads/images/${file.filename}`;
}

async function deleteUrls(urls) {
  for (const url of urls) {
    if (url) await deleteFromCloudinary(url).catch(() => {});
  }
}

function galleryUrls(project) {
  if (!project.images?.length) return [];
  return project.images.map((img) => img.url).filter(Boolean);
}

function coverUrls(project) {
  const urls = [];
  if (project.coverImageUrl) urls.push(project.coverImageUrl);
  if (project.imageUrl) urls.push(project.imageUrl);
  return urls;
}

function allImageUrls(project) {
  return [...coverUrls(project), ...galleryUrls(project)];
}

exports.createProject = catchAsyncError(async (req, res, next) => {
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
    delete req.body.images;
    delete req.body.coverImageUrl;
    delete req.body.imageUrl;

    const coverFile = getCoverFile(req);
    if (coverFile) {
      req.body.coverImageUrl = await uploadOneImage(coverFile, req);
      req.body.imageUrl = null;
    }

    const galleryFiles = getGalleryFiles(req);
    if (galleryFiles.length > 0) {
      const urls = [];
      for (const file of galleryFiles) {
        urls.push(await uploadOneImage(file, req));
      }
      req.body.images = urls.map((url) => ({ url }));
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

  delete req.body.images;
  delete req.body.coverImageUrl;
  delete req.body.imageUrl;

  const coverFile = getCoverFile(req);
  if (coverFile) {
    await deleteUrls(coverUrls(project));
    req.body.coverImageUrl = await uploadOneImage(coverFile, req);
    req.body.imageUrl = null;
  }

  const galleryFiles = getGalleryFiles(req);
  if (galleryFiles.length > 0) {
    await deleteUrls(galleryUrls(project));
    const urls = [];
    for (const file of galleryFiles) {
      urls.push(await uploadOneImage(file, req));
    }
    req.body.images = urls.map((url) => ({ url }));
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

  await deleteUrls(allImageUrls(project));
  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: null,
  });
});
