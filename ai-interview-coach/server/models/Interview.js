const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  role: String,
  scores: [Number],
  averageScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Interview", interviewSchema);