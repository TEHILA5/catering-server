const nodemailer = require('nodemailer');

const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Email configuration error:', error.message);
  } else {
    console.log('✓ Email service ready');
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('✗ Email sending failed:', error.message);
    throw error;
  }
};

module.exports = {
  transporter,
  sendEmail,
  emailConfig,
};
