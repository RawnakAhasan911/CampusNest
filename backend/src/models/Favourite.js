const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

favouriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

const Favourite = mongoose.model('Favourite', favouriteSchema);

module.exports = { Favourite };
