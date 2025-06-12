const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  interval: { type: Number, required: true },
  duration: { type: Number, required: true },
  taken: { type: Number, default: 0 },
  lastTaken: { type: Date, default: Date.now },
  description: { type: String, default: "" }, 
  currentCode: { type: String, default: null },
});

module.exports = mongoose.model("Medication", medicationSchema);