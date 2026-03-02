const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

listing: {

type: mongoose.Schema.Types.ObjectId,

ref: "Listing"

},

user: {

type: mongoose.Schema.Types.ObjectId,

ref: "User"

},

totalPrice: Number,

paymentId: String,

orderId: String,

status: {

type: String,

default: "Pending"

}

});

module.exports = mongoose.model("Booking", bookingSchema);