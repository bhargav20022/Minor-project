
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, // your email
                pass: process.env.EMAIL_PASS  // app password
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
    } catch (err) {
        console.log("Error sending email:", err);
    }
};

module.exports = sendEmail;
