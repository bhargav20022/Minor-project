const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const sendEmail = require("../utils/sendEmail");

// 👉 Payment Page
router.get("/:id", async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("listing");
  res.render("payment/pay", { booking });
});

// 👉 Payment Success
router.post("/:id/success", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("listing");

    // ✅ Update payment details
    booking.paymentId = "PAY" + Date.now();
    booking.status = "Paid";
    await booking.save();

    // 🔥 SEND EMAIL
    if (req.user && req.user.email) {
      const userName = req.user.username || "Traveller";
      const listingTitle = booking.listing?.title || "Your Destination";
      const listingLocation = booking.listing?.location
        ? `${booking.listing.location}, ${booking.listing.country}`
        : "";
      const listingImg = booking.listing?.image?.url || "";
      const checkIn = booking.checkIn
        ? new Date(booking.checkIn).toDateString()
        : "—";
      const checkOut = booking.checkOut
        ? new Date(booking.checkOut).toDateString()
        : "—";
      const guests = booking.guests || 1;
      const totalPrice = booking.totalPrice?.toLocaleString("en-IN") || "—";
      const bookingRef = "#" + booking._id.toString().slice(-8).toUpperCase();
      const paymentId = booking.paymentId;

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed – Wanderlust</title>
</head>
<body style="margin:0; padding:0; background:#f5f0e8; font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background:#1a1a2e; border-radius:18px 18px 0 0; padding: 36px 40px 28px;">
              <p style="margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#d4a843;">✦ Wanderlust</p>
              <h1 style="margin:0; font-family:Georgia,serif; font-size:28px; color:#ffffff; font-weight:700; letter-spacing:0.5px;">
                Booking Confirmed!
              </h1>
              <p style="margin:10px 0 0; font-size:14px; color:rgba(255,255,255,0.5);">
                Your journey is officially booked
              </p>
            </td>
          </tr>

          <!-- SUCCESS BADGE -->
          <tr>
            <td align="center" style="background:#1a1a2e; padding: 0 40px 32px;">
              <div style="display:inline-block; background:rgba(45,122,79,0.2); border:1.5px solid #2d7a4f; border-radius:50px; padding:10px 24px;">
                <span style="color:#4caf7d; font-size:14px; font-weight:600; letter-spacing:0.5px;">
                  ✓ &nbsp;Payment Successful
                </span>
              </div>
            </td>
          </tr>

          <!-- LISTING IMAGE (if available) -->
          ${listingImg ? `
          <tr>
            <td style="padding: 0;">
              <img src="${listingImg}" alt="${listingTitle}"
                style="width:100%; height:220px; object-fit:cover; display:block;"/>
            </td>
          </tr>
          ` : ""}

          <!-- MAIN BODY -->
          <tr>
            <td style="background:#ffffff; padding: 40px 40px 32px;">

              <p style="margin:0 0 6px; font-size:16px; color:#1a1a2e;">
                Hello, <strong>${userName}</strong> 👋
              </p>
              <p style="margin:0 0 32px; font-size:14px; color:#6b6b7b; line-height:1.7;">
                Your booking is confirmed and your adventure is all set. Here's a summary of your trip details below.
              </p>

              <!-- Destination -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#faf7f2; border-radius:12px; padding:20px 24px; margin-bottom:24px; border:1px solid #e0d8cc;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#c9783a; font-weight:600;">
                      Destination
                    </p>
                    <p style="margin:0; font-family:Georgia,serif; font-size:22px; color:#1a1a2e; font-weight:700;">
                      ${listingTitle}
                    </p>
                    ${listingLocation ? `<p style="margin:4px 0 0; font-size:13px; color:#6b6b7b;">📍 ${listingLocation}</p>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Trip Details Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="background:#faf7f2; border-radius:10px; padding:16px 18px; border:1px solid #e0d8cc; vertical-align:top;">
                    <p style="margin:0 0 4px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#6b6b7b;">Check-in</p>
                    <p style="margin:0; font-size:15px; font-weight:600; color:#1a1a2e;">📅 ${checkIn}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#faf7f2; border-radius:10px; padding:16px 18px; border:1px solid #e0d8cc; vertical-align:top;">
                    <p style="margin:0 0 4px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#6b6b7b;">Check-out</p>
                    <p style="margin:0; font-size:15px; font-weight:600; color:#1a1a2e;">📅 ${checkOut}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="48%" style="background:#faf7f2; border-radius:10px; padding:16px 18px; border:1px solid #e0d8cc; vertical-align:top;">
                    <p style="margin:0 0 4px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#6b6b7b;">Guests</p>
                    <p style="margin:0; font-size:15px; font-weight:600; color:#1a1a2e;">👤 ${guests} Guest${guests > 1 ? "s" : ""}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#faf7f2; border-radius:10px; padding:16px 18px; border:1px solid #e0d8cc; vertical-align:top;">
                    <p style="margin:0 0 4px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#6b6b7b;">Booking Ref</p>
                    <p style="margin:0; font-size:15px; font-weight:600; color:#1a1a2e;">${bookingRef}</p>
                  </td>
                </tr>
              </table>

              <!-- Amount -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#1a1a2e; border-radius:12px; padding:20px 24px; margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0; font-size:12px; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,0.45);">
                      Total Amount Paid
                    </p>
                    <p style="margin:6px 0 0; font-family:Georgia,serif; font-size:32px; font-weight:700; color:#d4a843;">
                      ₹${totalPrice}
                    </p>
                    <p style="margin:4px 0 0; font-size:11px; color:rgba(255,255,255,0.35);">
                      Payment ID: ${paymentId}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:13px; color:#6b6b7b; line-height:1.8; border-top:1px solid #e0d8cc; padding-top:24px;">
                If you have any questions or need assistance, feel free to reply to this email.
                We're here to make your journey unforgettable. 🌍
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center"
              style="background:#1a1a2e; border-radius:0 0 18px 18px; padding:28px 40px;">
              <p style="margin:0 0 6px; font-family:Georgia,serif; font-size:18px; color:#d4a843; letter-spacing:2px;">
                WANDERLUST
              </p>
              <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:0.5px;">
                Curated Journeys &nbsp;·&nbsp; Extraordinary Experiences
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `;

      await sendEmail(req.user.email, `Booking Confirmed 🎉 – ${listingTitle}`, htmlContent);
    }

    req.flash("success", "Payment successful! Confirmation email sent ✅");

    // ✅ Render success view — NO redirect, stays in your flow
    res.render("payment/success", { booking, user: req.user });

  } catch (err) {
    console.log(err);
    req.flash("error", "Payment failed ❌");
    res.redirect("/listings");
  }
});

module.exports = router;
