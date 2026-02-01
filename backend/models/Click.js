const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    region: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    device: {
      type: String,
      default: null,
    },
    browser: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    referer: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

clickSchema.index({ shortCode: 1, createdAt: -1 });
clickSchema.index({ urlId: 1, createdAt: -1 });

module.exports = mongoose.model('Click', clickSchema);
