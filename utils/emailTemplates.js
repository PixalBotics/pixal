/**
 * Professional Email Templates for Pixal Botics
 */

const APP_URL = process.env.APP_URL || 'https://www.pixalbotic.com';
const APP_NAME = process.env.APP_NAME || 'Pixal Botics';
const CONTACT_EMAIL = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'info@pixalbotic.com';

// Social Media Links
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61578070144872';
const INSTAGRAM_URL = 'https://www.instagram.com/pixal_botics/';
const LINKEDIN_URL = 'https://www.linkedin.com/company/pixalbotics';
const WHATSAPP_NUMBER = '03431743916';
const WHATSAPP_URL = `https://wa.me/92${WHATSAPP_NUMBER.substring(1)}`; // Convert to international format

// Logo URL - the real brand logo, hosted on the live website (public/ folder),
// not the old mis-named/incorrect file that used to be served from backend uploads.
const LOGO_URL = process.env.LOGO_URL || 'https://www.pixalbotic.com/pixalbotics-logo.png';

// Brand palette (matches the logo's blue)
const BRAND_PRIMARY = '#1d4ed8';
const BRAND_PRIMARY_DARK = '#1e3a8a';
const BRAND_ACCENT = '#2563eb';

// Base template wrapper with logo and social media
const emailWrapper = (content, preheader = '') => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>${APP_NAME}</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
        }
        .preheader {
            display: none;
            max-height: 0;
            overflow: hidden;
            font-size: 1px;
            line-height: 1px;
            color: #f1f5f9;
        }
        .container {
            max-width: 600px;
            margin: 24px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
            overflow: hidden;
        }
        .header {
            background: ${BRAND_PRIMARY_DARK};
            color: #ffffff;
            padding: 32px 30px 24px;
            text-align: center;
        }
        .header img {
            max-width: 168px;
            height: auto;
            margin-bottom: 4px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .header .tagline {
            margin: 6px 0 0 0;
            font-size: 13px;
            letter-spacing: 0.4px;
            color: #cbd5e1;
            text-transform: uppercase;
        }
        .content {
            padding: 36px 32px;
        }
        .content h2 {
            color: #0f172a;
            margin-top: 0;
            font-size: 20px;
        }
        .content p {
            font-size: 15px;
            color: #334155;
        }
        .button {
            display: inline-block;
            padding: 13px 28px;
            background: ${BRAND_PRIMARY};
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 14px;
        }
        .credentials-box {
            background: #f8fafc;
            border-left: 4px solid ${BRAND_PRIMARY};
            padding: 18px 20px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .credentials-box h3 {
            margin-top: 0;
            font-size: 14px;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .credentials-box p {
            margin: 8px 0;
            font-size: 14px;
        }
        .credentials-box strong {
            color: ${BRAND_PRIMARY_DARK};
        }
        .footer {
            background: #0f172a;
            padding: 28px 30px;
            text-align: center;
            color: #cbd5e1;
        }
        .footer a {
            color: #93c5fd;
            text-decoration: none;
        }
        .social-links {
            margin: 16px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 4px 6px;
            padding: 9px 16px;
            background: rgba(255,255,255,0.08);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-size: 13px;
        }
        .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 28px 0;
        }
        .info-box {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 14px 18px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        .info-box p {
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <span class="preheader">${preheader}</span>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="${APP_NAME}" />
            <p class="tagline">Software &amp; AI Solutions</p>
        </div>
        ${content}
        <div class="footer">
            <div class="social-links">
                <a href="${FACEBOOK_URL}" target="_blank">Facebook</a>
                <a href="${INSTAGRAM_URL}" target="_blank">Instagram</a>
                <a href="${LINKEDIN_URL}" target="_blank">LinkedIn</a>
                <a href="${WHATSAPP_URL}" target="_blank">WhatsApp</a>
            </div>
            <p style="margin: 14px 0 6px 0; font-size: 13px;">
                WhatsApp: <a href="${WHATSAPP_URL}">${WHATSAPP_NUMBER}</a>
            </p>
            <p style="margin: 6px 0; font-size: 13px;">
                Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
            </p>
            <p style="margin: 6px 0; font-size: 13px;">
                Website: <a href="${APP_URL}">${APP_URL.replace('https://', '').replace('http://', '')}</a>
            </p>
            <div class="divider" style="background: #334155;"></div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
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
        <h2>Welcome to ${APP_NAME}</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been created by our administrator. We're glad to have you on board.</p>

        <div class="credentials-box">
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; border: 1px solid #e2e8f0;">${password}</code></p>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>

        <div class="info-box">
            <p><strong>Important:</strong> Please change your password after your first login for security.</p>
        </div>

        <a href="${APP_URL}/admin/login" class="button">Log In to Your Account</a>

        <div class="divider"></div>

        <p><strong>Next steps</strong></p>
        <p>Log in with the credentials above, change your password, and explore the admin dashboard.</p>

        <p>If you have any questions, our team is happy to help.</p>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, `Your ${APP_NAME} admin account is ready.`);
};

/**
 * Password reset request email
 */
const forgotPasswordEmail = (name, resetToken) => {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const content = `
    <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>

        <a href="${resetUrl}" class="button">Reset Password</a>

        <div class="info-box">
            <p><strong>Note:</strong> This link expires in 30 minutes for security reasons.</p>
        </div>

        <p>Or copy and paste this URL into your browser:</p>
        <p style="background: #f8fafc; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #475569;">
            ${resetUrl}
        </p>

        <div class="divider"></div>

        <p>If you didn't request this password reset, please contact our support team.</p>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, 'Reset your password.');
};

/**
 * Password reset success email
 */
const passwordResetSuccessEmail = (name) => {
  const content = `
    <div class="content">
        <h2>Password Changed Successfully</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your password has been changed successfully.</p>

        <div class="credentials-box">
            <h3>Details</h3>
            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>If you made this change, no further action is needed.</p>

        <a href="${APP_URL}/admin/login" class="button">Log In</a>

        <div class="divider"></div>

        <div class="info-box">
            <p><strong>Didn't make this change?</strong> Please contact our support team immediately.</p>
        </div>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, 'Your password was changed.');
};

/**
 * Account update notification
 */
const accountUpdateEmail = (name, changes) => {
  const content = `
    <div class="content">
        <h2>Account Updated</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account information has been updated by an administrator.</p>

        <div class="credentials-box">
            <h3>Changes Made</h3>
            ${changes.map(change => `<p><strong>${change.field}:</strong> ${change.value}</p>`).join('')}
            <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>If you have questions about these changes, please contact the administrator.</p>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, 'Your account was updated.');
};

/**
 * Account deletion notification
 */
const accountDeletedEmail = (name, email) => {
  const content = `
    <div class="content">
        <h2>Account Deleted</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account (<strong>${email}</strong>) has been removed from ${APP_NAME}.</p>

        <div class="info-box">
            <p>This action was performed by an administrator and cannot be undone.</p>
        </div>

        <p>All associated data has been removed from our systems.</p>

        <div class="divider"></div>

        <p>If you believe this was done in error, please contact our support team immediately.</p>

        <p>Thank you for being part of ${APP_NAME}.</p>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, 'Your account has been deleted.');
};

/**
 * Thank you email for contact form submission
 */
const thankYouEmail = (name) => {
  const content = `
    <div class="content">
        <h2>Thank You for Contacting Us</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for reaching out to <strong>${APP_NAME}</strong>. We've received your message and appreciate you taking the time to contact us.</p>

        <div class="credentials-box">
            <h3>What Happens Next</h3>
            <p>Your message has been received and logged.</p>
            <p>Our team will review it carefully.</p>
            <p>We'll respond within 24&ndash;48 hours.</p>
        </div>

        <p>In the meantime, feel free to explore our services and follow us on social media.</p>

        <a href="${APP_URL}" class="button">Visit Our Website</a>

        <div class="divider"></div>

        <p><strong>Need immediate assistance?</strong></p>
        <p>WhatsApp: <a href="${WHATSAPP_URL}">${WHATSAPP_NUMBER}</a></p>
        <p>Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>

        <p>We look forward to working with you.</p>

        <p>Best regards,<br><strong>The ${APP_NAME} Team</strong></p>
    </div>
  `;
  return emailWrapper(content, 'We received your message.');
};

/**
 * Contact notification email for admin
 */
const contactNotificationEmail = (contact) => {
  const content = `
    <div class="content">
        <h2>New Contact Form Submission</h2>
        <p>You've received a new message through your website contact form.</p>

        <div class="credentials-box">
            <h3>Contact Details</h3>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
            ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${contact.subject || 'No subject'}</p>
            <p><strong>Date:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
        </div>

        <div class="credentials-box">
            <h3>Message</h3>
            <p style="white-space: pre-wrap;">${contact.message}</p>
        </div>

        <a href="mailto:${contact.email}" class="button">Reply to ${contact.name}</a>

        <div class="divider"></div>

        <p style="font-size: 13px; color: #64748b;">This is an automated notification from your ${APP_NAME} website contact form.</p>
    </div>
  `;
  return emailWrapper(content, `New message from ${contact.name}`);
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
