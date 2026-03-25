// utils/sendEmail.js
const { sendEmail: brevoSend } = require("../brevo");

const sendEmail = async (toEmail, subject, htmlContent) => {
  return await brevoSend({
    toEmail,
    toName: toEmail,
    subject,
    htmlContent,
  });
};

module.exports = sendEmail;
