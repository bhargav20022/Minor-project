const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

// ─────────────────────────────────────────────
// IMPORTANT: specific GET routes MUST come
// BEFORE the wildcard POST /:id route
// ─────────────────────────────────────────────

// ── MY BOOKINGS (guest view) ──
router.get("/my-bookings", isLoggedIn, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ checkIn: -1 });
    res.render("bookings/my-bookings", { bookings });
  } catch (err) {
    req.flash("error", "Could not load bookings.");
    res.redirect("/listings");
  }
});

// ── HOST DASHBOARD ──
router.get("/host-dashboard", isLoggedIn, async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id });
    const listingIds = listings.map((l) => l._id);

    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing")
      .populate("user")
      .sort({ checkIn: -1 });

    const totalRevenue = bookings
      .filter((b) => b.status !== "Cancelled")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const totalBookings  = bookings.length;
    const activeBookings = bookings.filter(
      (b) => b.status !== "Cancelled" && new Date(b.checkOut) >= new Date()
    ).length;
    const totalListings = listings.length;

    res.render("bookings/host-dashboard", {
      listings,
      bookings,
      totalRevenue,
      totalBookings,
      activeBookings,
      totalListings,
    });
  } catch (err) {
    req.flash("error", "Could not load dashboard.");
    res.redirect("/listings");
  }
});

// ── CANCEL BOOKING ──
router.post("/:bookingId/cancel", isLoggedIn, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/booking/my-bookings");
    }
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "Not authorised.");
      return res.redirect("/booking/my-bookings");
    }
    booking.status = "Cancelled";
    await booking.save();
    res.render("bookings/cancelled");
  } catch (err) {
    req.flash("error", "Could not cancel booking.");
    res.redirect("/booking/my-bookings");
  }
});

// ── CREATE BOOKING (POST) — keep last ──
router.post("/:id", isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut, guests } = req.body;
    const nights = Math.round(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = listing.price * (nights > 0 ? nights : 1);
    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: Number(guests),
      totalPrice,
    });
    await booking.save();
    res.redirect("/payment/" + booking._id);
  } catch (err) {
    req.flash("error", "Could not create booking.");
    res.redirect("/listings");
  }
});

module.exports = router;
