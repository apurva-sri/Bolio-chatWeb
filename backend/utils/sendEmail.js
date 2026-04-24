const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email successfully sent to ${options.email}`);
  } catch (error) {
    logger.error(`Email sending failed for ${options.email}: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
