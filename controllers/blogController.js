const Blog = require('../models/Blog');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


exports.createBlog = catchAsyncError(async (req, res, next) => {
  if (req.file) {
    const url = `${req.protocol}://${req.get('host')}/uploads/pdfs/${req.file.filename}`;
    req.body.pdfUrl = url;
  }
  const blog = await Blog.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Blog created successfully',
    data: { blog },
  });
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
