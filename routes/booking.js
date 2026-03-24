const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Listing = require("../models/listing");

router.post("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  const { checkIn, checkOut, guests } = req.body;

  // Calculate total price based on number of nights
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

  // ✅ Opens payment page
  res.redirect("/payment/" + booking._id);
});

module.exports = router;
