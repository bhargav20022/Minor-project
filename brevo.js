const Brevo = require("@getbrevo/brevo");

async function sendEmail({ toEmail, toName, subject, htmlContent, replyTo }) {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY.trim()
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME?.trim(),
    email: process.env.BREVO_SENDER_EMAIL?.trim(),
  };
  sendSmtpEmail.to = [{ email: toEmail, name: toName }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  // ✅ replyTo so owner replies go directly to guest
  if (replyTo) {
    sendSmtpEmail.replyTo = replyTo;
  }

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent:", result.body.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email error:", JSON.stringify(error?.response?.body || error.message));
    return { success: false, error: error?.response?.body || error.message };
  }
}

module.exports = { sendEmail };
