
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true
  },

  course: {
    type: String,
    required: [true, "Course is required"],
    trim: true
  },

  yearLevel: {
    type: Number,
    required: [true, "Year level is required"],
    min: [1, "Year level must be at least 1"],
    max: [4, "Year level must not exceed 4"]
  },

  section: {
    type: String,
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Student", studentSchema);
