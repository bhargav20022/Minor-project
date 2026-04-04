const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint" },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
