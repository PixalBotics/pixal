/**
 * One-time script: create (or update) an admin user directly in MongoDB.
 *
 * Why this script exists instead of calling the API:
 * - POST /api/users/register now requires an existing admin token (see the
 *   security fix in routes/userRoutes.js), so it can no longer bootstrap
 *   the very first admin.
 * - POST /api/users/create also requires an existing admin token.
 * This script bypasses the API entirely and talks to the database directly,
 * which is the standard way to create the first admin account.
 *
 * Run this ON THE SERVER (or anywhere with network access to the real
 * MONGO_URI and, ideally, the same .env used in production) with:
 *
 *   node scripts/createAdmin.js
 *
 * It reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env if present,
 * otherwise falls back to the defaults below. If a user with that email
 * already exists, it updates their password + role instead of failing.
 *
 * After creating the user, it tries to email the credentials using the
 * same sendEmail utility the rest of the app already uses (so it reuses
 * whatever EMAIL_* / SENDGRID_* config is already in .env - no new
 * credentials needed). If email sending fails, the credentials are still
 * printed to the console so nothing is lost.
 */

require('dotenv').config();
const crypto = require('crypto');
const connectDB = require('../config/db');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail } = require('../utils/emailTemplates');

/**
 * Generate a strong random password: 16 chars, mixed case + digits + symbols.
 */
function generateStrongPassword(length = 16) {
  const charset =
    'ABCDEFGHJKLMNPQRSTUVWXYZ' + // no I/O to avoid ambiguity
    'abcdefghijkmnpqrstuvwxyz' +
    '23456789' +
    '!@#$%^&*';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

async function main() {
  const name = process.env.ADMIN_NAME || 'Pixal Admin';
  const email = (process.env.ADMIN_EMAIL || 'info@pixalbotic.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || generateStrongPassword();
  const role = 'admin';

  await connectDB();

  let user = await User.findOne({ email });
  let isNew = false;

  if (user) {
    user.password = password; // pre-save hook hashes this automatically
    user.role = role;
    user.name = name;
    await user.save();
    console.log(`Existing user updated: ${email}`);
  } else {
    user = await User.create({ name, email, password, role });
    isNew = true;
    console.log(`New admin user created: ${email}`);
  }

  console.log('---------------------------------------------');
  console.log('ADMIN CREDENTIALS (save these somewhere safe):');
  console.log('  Name:     ', name);
  console.log('  Email:    ', email);
  console.log('  Password: ', password);
  console.log('  Role:     ', role);
  console.log('---------------------------------------------');

  try {
    await sendEmail({
      to: email,
      subject: `Your Admin Account - ${process.env.APP_NAME || 'Pixal Botics'}`,
      html: welcomeEmail(name, email, password, role),
    });
    console.log(`Credentials emailed to ${email}`);
  } catch (err) {
    console.error('Could not send credentials email (printed above instead):', err.message);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});
