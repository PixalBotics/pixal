const Blog = require('../models/Blog');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


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

  if (req.body.content && req.body.content.length > 10000) {
    errors.push({ field: 'content', message: 'Content must not exceed 10000 characters' });
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
      const url = `${req.protocol}://${req.get('host')}/uploads/pdfs/${req.file.filename}`;
      req.body.pdfUrl = url;
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

  // If new file uploaded, update pdfUrl
  if (req.file) {
    const url = `${req.protocol}://${req.get('host')}/uploads/pdfs/${req.file.filename}`;
    req.body.pdfUrl = url;
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

  await Blog.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Blog deleted successfully',
    data: null,
  });
});
