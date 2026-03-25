// brevo.js
const Brevo = require("@getbrevo/brevo");

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function sendEmail({ toEmail, toName, subject, htmlContent }) {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME,    // ✅ from .env
    email: process.env.BREVO_SENDER_EMAIL,  // ✅ from .env
  };

  sendSmtpEmail.to = [{ email: toEmail, name: toName }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent:", result.body.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email error:", error?.response?.body || error.message);
    return { success: false, error: error?.response?.body || error.message };
  }
}

module.exports = { sendEmail };
