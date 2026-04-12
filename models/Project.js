const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: String,
  rating: { type: Number, min: 0, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const projectImageSchema = new mongoose.Schema(
  { url: { type: String, required: true } },
  { _id: false }
);

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImageUrl: { type: String },
  images: { type: [projectImageSchema], default: [] },
  imageUrl: { type: String },
  reviews: [reviewSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
