const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: String,
  rating: { type: Number, min: 0, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  reviews: [reviewSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
