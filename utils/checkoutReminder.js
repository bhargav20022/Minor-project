const Brevo = require("@getbrevo/brevo");
const Booking = require("../models/booking");

// Setup Brevo client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const sendCheckoutReminders = async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      checkOut: { $gte: todayStart, $lte: todayEnd },
      status: { $nin: ["Cancelled"] },
    })
      .populate("user")
      .populate("listing");

    if (bookings.length === 0) {
      console.log("[Checkout Reminder] No checkouts today.");
      return;
    }

    for (const booking of bookings) {
      if (!booking.user?.email || !booking.listing?.title) continue;

      const sendSmtpEmail = new Brevo.SendSmtpEmail();

      sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      };

      sendSmtpEmail.to = [
        {
          email: booking.user.email,
          name: booking.user.username,
        },
      ];

      sendSmtpEmail.subject = "Checkout Reminder – Today is Your Checkout Day!";

      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                    border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

          <div style="background-color: #FF385C; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Wanderlust</h1>
          </div>

          <div style="padding: 32px;">
            <h2 style="color: #333;">Hi ${booking.user.username},</h2>
            <p style="color: #555; font-size: 16px;">
              This is a friendly reminder that <strong>today is your checkout day</strong>
              for your stay at:
            </p>

            <div style="background: #f9f9f9; border-left: 4px solid #FF385C;
                        padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">
                ${booking.listing.title}
              </p>
              <p style="margin: 8px 0 0; color: #777;">
                📅 Checkout Date: <strong>${booking.checkOut.toDateString()}</strong>
              </p>
              <p style="margin: 4px 0 0; color: #777;">
                👥 Guests: <strong>${booking.guests}</strong>
              </p>
              <p style="margin: 4px 0 0; color: #777;">
                💰 Total Paid: <strong>₹${booking.totalPrice}</strong>
              </p>
            </div>

            <p style="color: #555; font-size: 15px;">
              Please make sure to <strong>vacate the room</strong> by the designated
              checkout time and return any keys or access cards to the host.
            </p>

            <p style="color: #555; font-size: 15px;">
              We hope you had a wonderful stay! We'd love to have you back soon.
            </p>

            <div style="margin-top: 32px; text-align: center;">
              <a href="${process.env.BASE_URL}/listings"
                 style="background-color: #FF385C; color: white; padding: 12px 28px;
                        border-radius: 6px; text-decoration: none; font-size: 15px;">
                Book Your Next Stay
              </a>
            </div>
          </div>

          <div style="background: #f0f0f0; padding: 16px; text-align: center;">
            <p style="color: #999; font-size: 13px; margin: 0;">
              © 2025 Wanderlust. You're receiving this because you have an active booking.
            </p>
          </div>

        </div>
      `;

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`[Checkout Reminder] Email sent to: ${booking.user.email}`);
    }
  } catch (err) {
    console.error("[Checkout Reminder] Error:", err);
  }
};

// ── SCHEDULER (no extra package needed) ──────────────────────────
const startCheckoutReminderJob = () => {
  const now = new Date();

  const next8AM = new Date();
  next8AM.setHours(8, 0, 0, 0);

  // If 8 AM already passed today, schedule for tomorrow
  if (now >= next8AM) {
    next8AM.setDate(next8AM.getDate() + 1);
  }

  const msUntil8AM = next8AM - now;
  console.log(`[Checkout Reminder] First run at: ${next8AM.toLocaleString()}`);

  setTimeout(() => {
    sendCheckoutReminders();                          // first fire at 8 AM
    setInterval(sendCheckoutReminders, 24 * 60 * 60 * 1000); // then every 24hrs
  }, msUntil8AM);
};

module.exports = { startCheckoutReminderJob, sendCheckoutReminders };
