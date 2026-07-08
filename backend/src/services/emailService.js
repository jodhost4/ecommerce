const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@commerce.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
}

async function sendWelcomeEmail(email, name) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Commerce Platform',
    html: `<h1>Welcome, ${name}!</h1><p>Your account has been created successfully.</p>`,
  });
}

async function sendVerificationEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `<h1>Email Verification</h1><p>Click <a href="${url}">here</a> to verify your email.</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<h1>Password Reset</h1><p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
