const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String },
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blog', blogSchema);
