const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_HOST) {
    console.warn('EMAIL_HOST not configured — skipping email send');
    return;
  }
  try {
    const from = process.env.EMAIL_FROM || 'Fynexo <noreply@fynexo.com>';
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = sendEmail;
