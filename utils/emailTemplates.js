/**
 * Professional Email Templates for Pixal Botics
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'Pixal Botics';

// Social Media Links
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61578070144872';
const INSTAGRAM_URL = 'https://www.instagram.com/pixal_botics/';
const LINKEDIN_URL = 'https://www.linkedin.com/company/pixalbotics';
const WHATSAPP_NUMBER = '03431743916';
const WHATSAPP_URL = `https://wa.me/92${WHATSAPP_NUMBER.substring(1)}`; // Convert to international format

// Logo URL (served from static uploads folder)
const LOGO_URL = `${APP_URL}/uploads/logo/Pexil%20Beaudry%20weblogo.png`;

// Base template wrapper with logo and social media
const emailWrapper = (content) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header img {
            max-width: 200px;
            height: auto;
            margin-bottom: 15px;
        }
        .header h1 {
            margin: 10px 0 0 0;
            font-size: 28px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #667eea;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .credentials-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .credentials-box p {
            margin: 10px 0;
        }
        .credentials-box strong {
            color: #667eea;
        }
        .footer {
            background: #2c3e50;
            padding: 30px;
            text-align: center;
            color: #ecf0f1;
        }
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            padding: 10px 20px;
            background: #3498db;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
        }
        .social-links a:hover {
            background: #2980b9;
        }
        .whatsapp-link {
            background: #25D366 !important;
        }
        .facebook-link {
            background: #1877F2 !important;
        }
        .instagram-link {
            background: #E4405F !important;
        }
        .linkedin-link {
            background: #0A66C2 !important;
        }
        .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 30px 0;
        }
        .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" />
            <h1>${APP_NAME}</h1>
        </div>
        ${content}
        <div class="footer">
            <h3 style="color: #ecf0f1; margin-top: 0;">Connect With Us</h3>
            <div class="social-links">
                <a href="${FACEBOOK_URL}" class="facebook-link" target="_blank">📘 Facebook</a>
                <a href="${INSTAGRAM_URL}" class="instagram-link" target="_blank">📸 Instagram</a>
                <a href="${LINKEDIN_URL}" class="linkedin-link" target="_blank">💼 LinkedIn</a>
                <a href="${WHATSAPP_URL}" class="whatsapp-link" target="_blank">💬 WhatsApp</a>
            </div>
            <p style="margin: 20px 0 10px 0;">
                📞 WhatsApp: <a href="${WHATSAPP_URL}" style="color: #25D366;">${WHATSAPP_NUMBER}</a>
            </p>
            <p style="margin: 10px 0;">
                📧 Email: <a href="mailto:${process.env.EMAIL_USER || 'info@pixalbotics.com'}">${process.env.EMAIL_USER || 'info@pixalbotics.com'}</a>
            </p>
            <p style="margin: 10px 0;">
                🌐 Website: <a href="${APP_URL}">${APP_URL.replace('https://', '').replace('http://', '')}</a>
            </p>
            <div class="divider" style="background: #7f8c8d;"></div>
            <p style="font-size: 12px; color: #95a5a6;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Welcome email template (when admin creates user)
 */
const welcomeEmail = (name, email, password, role) => {
  const content = `
    <div class="content">
        <h2>👋 Welcome to ${APP_NAME}!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been created successfully by our administrator. We're excited to have you on board!</p>
        
        <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${password}</code></p>
            <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>

        <div class="info-box">
            <p>⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        </div>

        <p>Click the button below to access your account:</p>
        <a href="${APP_URL}/login" class="button">Login to Your Account</a>

        <div class="divider"></div>

        <p><strong>What's Next?</strong></p>
        <ul>
            <li>Login with your credentials</li>
            <li>Change your password</li>
            <li>Explore the dashboard</li>
            <li>Start managing content</li>
        </ul>

        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Password reset request email
 */
const forgotPasswordEmail = (name, resetToken) => {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const content = `
    <div class="content">
        <h2>🔑 Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>

        <div class="info-box">
            <p>⏰ <strong>Note:</strong> This link will expire in <strong>30 minutes</strong> for security reasons.</p>
        </div>

        <p>Or copy and paste this URL into your browser:</p>
        <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
        </p>

        <div class="divider"></div>

        <p><strong>Security Tips:</strong></p>
        <ul>
            <li>Never share your password with anyone</li>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication if available</li>
        </ul>

        <p>If you didn't request this password reset, your account may be at risk. Please contact our support team immediately.</p>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Password reset success email
 */
const passwordResetSuccessEmail = (name) => {
  const content = `
    <div class="content">
        <h2>✅ Password Changed Successfully</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your password has been successfully changed.</p>
        
        <div class="credentials-box">
            <h3>📋 Details</h3>
            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>IP Address:</strong> Hidden for security</p>
        </div>

        <p>If you made this change, you can safely ignore this email. You can now login with your new password.</p>

        <a href="${APP_URL}/login" class="button">Login Now</a>

        <div class="divider"></div>

        <div class="info-box">
            <p>⚠️ <strong>Didn't make this change?</strong></p>
            <p>If you didn't reset your password, please contact our support team immediately. Your account may have been compromised.</p>
        </div>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Account update notification
 */
const accountUpdateEmail = (name, changes) => {
  const content = `
    <div class="content">
        <h2>🔔 Account Updated</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account information has been updated by an administrator.</p>
        
        <div class="credentials-box">
            <h3>📝 Changes Made</h3>
            ${changes.map(change => `<p><strong>${change.field}:</strong> ${change.value}</p>`).join('')}
            <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>If you have any questions about these changes, please contact the administrator.</p>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Account deletion notification
 */
const accountDeletedEmail = (name, email) => {
  const content = `
    <div class="content">
        <h2>⚠️ Account Deleted</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account (<strong>${email}</strong>) has been deleted from ${APP_NAME}.</p>
        
        <div class="info-box">
            <p>This action was performed by an administrator and cannot be undone.</p>
        </div>

        <p>All your data has been removed from our systems.</p>

        <div class="divider"></div>

        <p>If you believe this was done in error, please contact our support team immediately.</p>
        
        <p>Thank you for using ${APP_NAME}.</p>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Thank you email for contact form submission
 */
const thankYouEmail = (name) => {
  const content = `
    <div class="content">
        <h2>✉️ Thank You for Contacting Us!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for reaching out to <strong>${APP_NAME}</strong>! We have received your message and truly appreciate you taking the time to contact us.</p>
        
        <div class="credentials-box">
            <h3>📋 What Happens Next?</h3>
            <p>✅ Your message has been received</p>
            <p>✅ Our team will review it carefully</p>
            <p>✅ We'll respond within 24-48 hours</p>
            <p>✅ Check your email for our reply</p>
        </div>

        <p>In the meantime, feel free to explore our services and follow us on social media to stay updated with our latest work!</p>

        <a href="${APP_URL}" class="button">Visit Our Website</a>

        <div class="divider"></div>

        <p><strong>Need Immediate Assistance?</strong></p>
        <p>📞 WhatsApp: <a href="${WHATSAPP_URL}">${WHATSAPP_NUMBER}</a></p>
        <p>📧 Email: <a href="mailto:${process.env.EMAIL_USER || 'info@pixalbotics.com'}">${process.env.EMAIL_USER || 'info@pixalbotics.com'}</a></p>

        <p>We're excited to work with you!</p>
        
        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Contact notification email for admin
 */
const contactNotificationEmail = (contact) => {
  const content = `
    <div class="content">
        <h2>📬 New Contact Form Submission</h2>
        <p>You have received a new message through your website contact form.</p>
        
        <div class="credentials-box">
            <h3>👤 Contact Details</h3>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
            ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${contact.subject || 'No subject'}</p>
            <p><strong>Date:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
        </div>

        <div class="credentials-box">
            <h3>💬 Message</h3>
            <p style="white-space: pre-wrap;">${contact.message}</p>
        </div>

        <a href="${APP_URL}/api/contact/${contact._id}" class="button">View in Dashboard</a>

        <div class="divider"></div>

        <p><strong>Quick Actions:</strong></p>
        <p>📧 Reply to: <a href="mailto:${contact.email}">${contact.email}</a></p>
        ${contact.phone ? `<p>📞 Call/WhatsApp: ${contact.phone}</p>` : ''}
        
        <p>This is an automated notification from your ${APP_NAME} contact form.</p>
    </div>
  `;
  return emailWrapper(content);
};

module.exports = {
  welcomeEmail,
  forgotPasswordEmail,
  passwordResetSuccessEmail,
  accountUpdateEmail,
  accountDeletedEmail,
  thankYouEmail,
  contactNotificationEmail,
};

