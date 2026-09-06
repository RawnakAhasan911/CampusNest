/**
 * Favourite / Saved Listings Routes
 */

const express = require('express');
const router = express.Router();
const { Favourite } = require('../models/Favourite');
const { Listing } = require('../models/Listing');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/favourites/:listingId
 * Save listing to favourites.
 */
router.post('/:listingId', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const existing = await Favourite.findOne({ userId: req.user._id, listingId: listing._id });
    if (existing) {
      return res.json({ success: true, message: 'Listing already in favourites', isFavourite: true });
    }

    const fav = new Favourite({
      userId: req.user._id,
      listingId: listing._id,
    });
    await fav.save();

    return res.status(201).json({ success: true, message: 'Listing saved to favourites!', isFavourite: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save favourite' });
  }
});

/**
 * DELETE /api/favourites/:listingId
 * Remove listing from favourites.
 */
router.delete('/:listingId', authenticate, async (req, res) => {
  try {
    await Favourite.findOneAndDelete({ userId: req.user._id, listingId: req.params.listingId });
    return res.json({ success: true, message: 'Removed from favourites', isFavourite: false });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove favourite' });
  }
});

/**
 * GET /api/favourites
 * View all saved listings on dashboard.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const favourites = await Favourite.find({ userId: req.user._id }).populate('listingId').sort({ createdAt: -1 });

    const listings = favourites
      .filter(f => f.listingId && f.listingId.status !== 'removed')
      .map(f => ({
        favouriteId: f._id,
        savedAt: f.createdAt,
        listing: f.listingId.getDecryptedListing(),
      }));

    return res.json({ success: true, count: listings.length, listings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load favourites' });
  }
});

/**
 * GET /api/favourites/check/:listingId
 * Check if a listing is saved.
 */
router.get('/check/:listingId', authenticate, async (req, res) => {
  try {
    const fav = await Favourite.findOne({ userId: req.user._id, listingId: req.params.listingId });
    return res.json({ success: true, isFavourite: Boolean(fav) });
  } catch (error) {
    return res.status(500).json({ success: false, isFavourite: false });
  }
});

module.exports = router;
