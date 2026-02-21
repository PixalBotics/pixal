const Blog = require('../models/Blog');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');
const { isConfigured: cloudinaryConfigured, uploadImage: uploadImageToCloudinary, uploadRaw: uploadRawToCloudinary, deleteByUrl: deleteFromCloudinary } = require('../utils/cloudinary');


exports.createBlog = catchAsyncError(async (req, res, next) => {
  // Direct validation check (works with multipart/form-data)
  const errors = [];
  if (!req.body.name || !req.body.name.trim()) {
    errors.push({ field: 'name', message: 'Blog name is required' });
  } else if (req.body.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Blog name must be at least 3 characters' });
  } else if (req.body.name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Blog name must not exceed 200 characters' });
  }

  // Content from Summernote is HTML; allow larger limit for rich content
  const CONTENT_MAX_LENGTH = 500000;
  if (req.body.content && req.body.content.length > CONTENT_MAX_LENGTH) {
    errors.push({ field: 'content', message: `Content must not exceed ${CONTENT_MAX_LENGTH.toLocaleString()} characters` });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        if (cloudinaryConfigured() && file.buffer) {
          req.body.imageUrl = await uploadImageToCloudinary(file.buffer, file.mimetype, 'pixal/blog');
        } else {
          req.body.imageUrl = `${baseUrl}/uploads/images/${file.filename}`;
        }
      }
      if (req.files.pdf && req.files.pdf[0]) {
        const file = req.files.pdf[0];
        if (cloudinaryConfigured() && file.buffer) {
          req.body.pdfUrl = await uploadRawToCloudinary(file.buffer, 'pixal/blog/pdfs');
        } else {
          req.body.pdfUrl = `${baseUrl}/uploads/pdfs/${file.filename}`;
        }
      }
    }
    const blog = await Blog.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: { blog },
    });
  } catch (error) {
    return next(error);
  }
});


exports.getBlogs = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'name' and 'content' fields
  const result = await paginate(Blog, req, ['name', 'content']);
  
  res.status(200).json({
    success: true,
    message: 'Blogs fetched successfully',
    data: { blogs: result.data },
    pagination: result.pagination,
  });
});


exports.getBlog = catchAsyncError(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new ErrorHandler('Blog not found', 404));
  res.status(200).json({
    success: true,
    message: 'Blog fetched successfully',
    data: { blog },
  });
});


exports.updateBlog = catchAsyncError(async (req, res, next) => {
  let blog = await Blog.findById(req.params.id);
  if (!blog) return next(new ErrorHandler('Blog not found', 404));

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (req.files) {
    if (req.files.image && req.files.image[0]) {
      if (blog.imageUrl) await deleteFromCloudinary(blog.imageUrl).catch(() => {});
      const file = req.files.image[0];
      if (cloudinaryConfigured() && file.buffer) {
        req.body.imageUrl = await uploadImageToCloudinary(file.buffer, file.mimetype, 'pixal/blog');
      } else {
        req.body.imageUrl = `${baseUrl}/uploads/images/${file.filename}`;
      }
    }
    if (req.files.pdf && req.files.pdf[0]) {
      if (blog.pdfUrl) await deleteFromCloudinary(blog.pdfUrl).catch(() => {});
      const file = req.files.pdf[0];
      if (cloudinaryConfigured() && file.buffer) {
        req.body.pdfUrl = await uploadRawToCloudinary(file.buffer, 'pixal/blog/pdfs');
      } else {
        req.body.pdfUrl = `${baseUrl}/uploads/pdfs/${file.filename}`;
      }
    }
  }

  blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Blog updated successfully',
    data: { blog },
  });
});


exports.deleteBlog = catchAsyncError(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new ErrorHandler('Blog not found', 404));

  // Delete from Cloudinary first (while we still have URLs), then DB
  const cloudinaryErr = (label) => (err) => {
    console.error(`[Blog delete] Cloudinary ${label} failed:`, err?.message || err);
  };
  if (blog.imageUrl) await deleteFromCloudinary(blog.imageUrl).catch(cloudinaryErr('image'));
  if (blog.pdfUrl) {
    console.log('[Blog delete] Deleting PDF from Cloudinary:', blog.pdfUrl?.substring(0, 80) + '...');
    await deleteFromCloudinary(blog.pdfUrl).catch(cloudinaryErr('pdf'));
  }
  await Blog.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Blog deleted successfully',
    data: null,
  });
});
