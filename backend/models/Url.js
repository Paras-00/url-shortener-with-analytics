const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL: delete when expiresAt is reached (docs with expiresAt null are not removed)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Url', urlSchema);
