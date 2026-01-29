const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ["user", "admin", "systemmanager"],
    default: "user",
    lowercase: true,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  // Normalize email
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  // Normalize role
  if (this.role) {
    this.role = this.role.toLowerCase();
  }
  // Hash password only if new or changed
  if (this.isModified("password")) {
    // Only hash if not already hashed (bcrypt hash starts with $2)
    if (!this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (30 minutes)
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
