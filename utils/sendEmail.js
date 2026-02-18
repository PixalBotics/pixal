const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// SendGrid: Set API key when using SendGrid
if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Get "from" address based on email service
 */
const getFromAddress = () => {
  const name = process.env.EMAIL_FROM_NAME || 'Pixal';
  if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_FROM) {
    return { name, email: process.env.SENDGRID_FROM };
  }
  const email = process.env.EMAIL_USER || process.env.SENDGRID_FROM || 'info@pixalbotics.com';
  return { name, email };
};

/**
 * Send email via SendGrid
 */
const sendViaSendGrid = async (options) => {
  const from = getFromAddress();
  const msg = {
    to: options.to,
    from: { email: from.email, name: from.name },
    subject: options.subject,
    html: options.html,
    text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
  };
  const [res] = await sgMail.send(msg);
  return { success: true, messageId: res.headers['x-message-id'] || res.body };
};

/**
 * Create Nodemailer transporter (Gmail or cPanel/SMTP)
 */
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email utility
 * Uses SendGrid when EMAIL_SERVICE=sendgrid, otherwise Nodemailer (Gmail/cPanel).
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email plain text content (optional)
 */
const sendEmail = async (options) => {
  try {
    if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      const result = await sendViaSendGrid(options);
      console.log('✅ Email sent successfully (SendGrid):', result.messageId);
      return result;
    }

    const transporter = createTransporter();
    const from = getFromAddress();

    const mailOptions = {
      from: `"${from.name}" <${from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    if (error.response && error.response.body) {
      const body = error.response.body;
      console.error('SendGrid response:', body);
      const fromError = body.errors && body.errors.find(e => e.field === 'from');
      if (fromError && fromError.message.includes('verified Sender Identity')) {
        console.error('💡 Fix: Verify your from address at https://app.sendgrid.com → Settings → Sender Authentication (Single Sender or Domain).');
      }
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;
