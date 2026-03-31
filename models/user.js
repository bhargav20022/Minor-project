const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // ── Forgot Password OTP fields ──
  resetOtp: {
    type: String,
    default: null,
  },
  resetOtpExpiry: {
    type: Date,
    default: null,
  },
});

userSchema.plugin(passportLocalMongoose);
console.log(typeof passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
