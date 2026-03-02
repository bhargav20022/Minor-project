const express = require("express");

const router = express.Router();

const Booking = require("../models/booking");

router.get("/:id", async (req, res) => {

const booking = await Booking.findById(req.params.id).populate("listing");

res.render("payment/pay", { booking });

});

router.post("/:id/success", async (req, res) => {

const booking = await Booking.findById(req.params.id).populate("listing");

booking.paymentId = "PAY" + Date.now();

booking.status = "Paid";

await booking.save();

res.render("payment/success", { booking });

});
module.exports = router;