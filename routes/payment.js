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

    // ✅ Update payment
    booking.paymentId = "PAY" + Date.now();
    booking.status = "Paid";
    await booking.save();

    // 🔥 NON-BLOCKING EMAIL (FIXED)
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

      const htmlContent = `...YOUR SAME HTML CONTENT...`;

      // ✅ FIX: DO NOT USE await
      sendEmail(req.user.email, `Booking Confirmed 🎉 – ${listingTitle}`, htmlContent)
        .then(() => console.log("✅ Email sent"))
        .catch(err => console.log("❌ Email error:", err.message));
    }

    req.flash("success", "Payment successful! Confirmation email sent ✅");

    // ✅ Response immediately (no waiting)
    res.render("payment/success", { booking, user: req.user });

  } catch (err) {
    console.log(err);
    req.flash("error", "Payment failed ❌");
    res.redirect("/listings");
  }
});

module.exports = router;
