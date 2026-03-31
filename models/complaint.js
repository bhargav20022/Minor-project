const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const complaintSchema = new Schema({
  listing:     { type: Schema.Types.ObjectId, ref: "Listing" },
  submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  subject:     { type: String, required: true },
  message:     { type: String, required: true },
  status: {
    type:    String,
    enum:    ["open", "reviewed", "resolved"],
    default: "open",
  },
  adminNote:   { type: String, default: "" },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", complaintSchema);
