const Testimonial = require('../models/Testimonial');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { paginate } = require('../utils/pagination');


exports.createTestimonial = catchAsyncError(async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: { testimonial },
    });
  } catch (error) {
    // If it's a validation error, pass it to error handler
    if (error.name === 'ValidationError') {
      return next(error);
    }
    // For other errors, also pass to error handler
    return next(error);
  }
});

exports.getTestimonials = catchAsyncError(async (req, res, next) => {
  // Use pagination utility with search on 'clientName' and 'reviewText' fields
  const result = await paginate(Testimonial, req, ['clientName', 'reviewText']);
  
  res.status(200).json({
    success: true,
    message: 'Testimonials fetched successfully',
    data: { testimonials: result.data },
    pagination: result.pagination,
  });
});


exports.getTestimonial = catchAsyncError(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) return next(new ErrorHandler('Testimonial not found', 404));
  
  res.status(200).json({
    success: true,
    message: 'Testimonial fetched successfully',
    data: { testimonial },
  });
});


exports.updateTestimonial = catchAsyncError(async (req, res, next) => {
  let testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) return next(new ErrorHandler('Testimonial not found', 404));

  testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Testimonial updated successfully',
    data: { testimonial },
  });
});


exports.deleteTestimonial = catchAsyncError(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) return next(new ErrorHandler('Testimonial not found', 404));

  await Testimonial.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Testimonial deleted successfully',
    data: null,
  });
});
