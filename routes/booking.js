const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Listing = require("../models/listing");

router.post("/:id", async (req, res) => {

const listing = await Listing.findById(req.params.id);

const booking = new Booking({

listing: listing._id,

user: req.user._id,

totalPrice: listing.price

});

await booking.save();


// ✅ THIS LINE OPENS PAYMENT PAGE

res.redirect("/payment/" + booking._id);

});

module.exports = router;