const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configure API key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, html) => {
  try {
    const sender = {
      email: process.env.EMAIL_USER,
      name: "Wanderlust"
    };

    const receivers = [
      {
        email: to
      }
    ];

    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent: html
    });

    console.log("✅ Email sent via Brevo");
  } catch (err) {
    console.log("❌ Brevo error:", err.message);
  }
};

module.exports = sendEmail;
