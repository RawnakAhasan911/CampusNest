/**
 * Housing Listing Routes
 * Handles listing creation with RSA encryption, image upload with CBC-MAC integrity checks,
 * comprehensive search & filtering, and automated match notifications.
 */

const express = require('express');
const router = express.Router();
const { Listing } = require('../models/Listing');
const { User } = require('../models/User');
const { Profile } = require('../models/Profile');
const { Notification } = require('../models/Notification');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  encryptDataRSA,
  decryptDataRSA,
  computeImageIntegrity,
} = require('../crypto/encryptionService');

/**
 * GET /api/listings
 * Search and filter active housing listings.
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      city,
      minRent,
      maxRent,
      bedrooms,
      bathrooms,
      furnished,
      propertyType,
      petAllowed,
      genderPreference,
      search,
    } = req.query;

    const query = { status: 'available' };

    if (city) {
      query.city = new RegExp(city.trim(), 'i');
    }

    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }

    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: Number(bathrooms) };
    if (furnished) query.furnished = furnished;
    if (propertyType) query.propertyType = propertyType;
    if (petAllowed !== undefined) query.petAllowed = petAllowed === 'true';
    if (genderPreference && genderPreference !== 'any') query.genderPreference = genderPreference;

    const listings = await Listing.find(query).sort({ createdAt: -1 }).limit(50);

    const decryptedListings = listings.map(l => {
      const item = l.getDecryptedListing();
      // If user provided a general search keyword, filter title/description
      if (search) {
        const s = search.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(s) ||
          item.description.toLowerCase().includes(s) ||
          item.city.toLowerCase().includes(s) ||
          item.neighborhood.toLowerCase().includes(s);
        if (!matches) return null;
      }
      return item;
    }).filter(Boolean);

    return res.json({
      success: true,
      count: decryptedListings.length,
      listings: decryptedListings,
    });
  } catch (error) {
    console.error('Search listings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to search listings' });
  }
});

/**
 * GET /api/listings/user/my-listings
 * Retrieves current user's listings (all statuses: available, rented).
 */
router.get('/user/my-listings', authenticate, async (req, res) => {
  try {
    const listings = await Listing.find({
      ownerId: req.user._id,
      status: { $ne: 'removed' },
    }).sort({ createdAt: -1 });

    const decrypted = listings.map(l => l.getDecryptedListing());
    return res.json({ success: true, listings: decrypted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving user listings' });
  }
});

/**
 * GET /api/listings/:id
 * Retrieves full listing details and owner information.
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const decryptedListing = listing.getDecryptedListing();

    // Fetch owner contact information
    const owner = await User.findById(listing.ownerId);
    let ownerInfo = null;
    if (owner) {
      const ownerProfile = await Profile.findOne({ userId: owner._id });
      const ownerDecrypted = owner.getDecryptedData();
      ownerInfo = {
        _id: ownerDecrypted._id,
        name: ownerDecrypted.name,
        department: ownerDecrypted.department,
        yearOfStudy: ownerDecrypted.yearOfStudy,
        eccPublicKey: ownerDecrypted.eccPublicKey,
        phone: (ownerProfile && ownerProfile.privacy && ownerProfile.privacy.showPhone) ? ownerDecrypted.phone : null,
        email: (ownerProfile && ownerProfile.privacy && ownerProfile.privacy.showEmail) ? ownerDecrypted.email : null,
      };
    }

    return res.json({
      success: true,
      listing: decryptedListing,
      owner: ownerInfo,
    });
  } catch (error) {
    console.error('Get listing details error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving listing' });
  }
});

/**
 * POST /api/listings
 * Creates a new housing listing with RSA encrypted fields & CBC-MAC on images.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      neighborhood,
      rent,
      bedrooms,
      bathrooms,
      availableRooms,
      moveInDate,
      utilitiesIncluded,
      furnished,
      propertyType,
      petAllowed,
      genderPreference,
      amenities,
      images, // array of { url, data }
    } = req.body;

    if (!title || !city || !rent) {
      return res.status(400).json({ success: false, message: 'Title, city, and rent are required' });
    }

    // 1. Encrypt sensitive text fields with RSA
    const encryptedTitle = encryptDataRSA(title.trim());
    const encryptedDescription = encryptDataRSA((description || '').trim());
    const encryptedAddress = encryptDataRSA((address || '').trim());

    // 2. Process images with CBC-MAC integrity tags
    const processedImages = (images || []).map(img => {
      const uploadTime = new Date();
      const imagePayload = img.data || img.url || '';
      const mac = computeImageIntegrity(imagePayload, { uploadedAt: uploadTime });
      return {
        url: img.url || '',
        data: img.data || '',
        imageMac: mac,
        uploadedAt: uploadTime,
      };
    });

    const listing = new Listing({
      ownerId: req.user._id,
      encryptedTitle,
      encryptedDescription,
      encryptedAddress,
      city: city.trim(),
      neighborhood: (neighborhood || '').trim(),
      rent: Number(rent),
      bedrooms: Number(bedrooms || 1),
      bathrooms: Number(bathrooms || 1),
      availableRooms: Number(availableRooms || 1),
      moveInDate: moveInDate || '',
      utilitiesIncluded: Boolean(utilitiesIncluded),
      furnished: furnished || 'furnished',
      propertyType: propertyType || 'apartment',
      petAllowed: Boolean(petAllowed),
      genderPreference: genderPreference || 'any',
      amenities: Array.isArray(amenities) ? amenities : [],
      images: processedImages,
      status: 'available',
    });

    await listing.save();

    // 3. Notify students whose preferences match this listing (Requirement 10.4)
    try {
      const matchingProfiles = await Profile.find({
        userId: { $ne: req.user._id },
        preferredRentMax: { $gte: Number(rent) },
      });

      for (const p of matchingProfiles) {
        const notifMsg = `A new housing listing "${title.trim()}" in ${city} for $${rent}/month matches your budget preference!`;
        const notif = new Notification({
          userId: p.userId,
          type: 'HOUSING_MATCH',
          title: 'New Housing Match Found!',
          encryptedMessage: encryptDataRSA(notifMsg),
          metadata: { listingId: listing._id },
        });
        await notif.save();
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch match notifications:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Housing listing created successfully and protected with RSA & CBC-MAC!',
      listing: listing.getDecryptedListing(),
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create listing: ' + error.message });
  }
});

/**
 * PUT /api/listings/:id
 * Edit listing (Owner or Admin only).
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const isOwner = listing.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the listing owner or an admin can edit this post.' });
    }

    const {
      title,
      description,
      address,
      city,
      neighborhood,
      rent,
      bedrooms,
      bathrooms,
      availableRooms,
      moveInDate,
      utilitiesIncluded,
      furnished,
      propertyType,
      petAllowed,
      genderPreference,
      amenities,
      images,
    } = req.body;

    if (title) listing.encryptedTitle = encryptDataRSA(title.trim());
    if (description !== undefined) listing.encryptedDescription = encryptDataRSA(description.trim());
    if (address !== undefined) listing.encryptedAddress = encryptDataRSA(address.trim());
    if (city) listing.city = city.trim();
    if (neighborhood !== undefined) listing.neighborhood = neighborhood.trim();
    if (rent) listing.rent = Number(rent);
    if (bedrooms) listing.bedrooms = Number(bedrooms);
    if (bathrooms) listing.bathrooms = Number(bathrooms);
    if (availableRooms) listing.availableRooms = Number(availableRooms);
    if (moveInDate !== undefined) listing.moveInDate = moveInDate;
    if (utilitiesIncluded !== undefined) listing.utilitiesIncluded = Boolean(utilitiesIncluded);
    if (furnished) listing.furnished = furnished;
    if (propertyType) listing.propertyType = propertyType;
    if (petAllowed !== undefined) listing.petAllowed = Boolean(petAllowed);
    if (genderPreference) listing.genderPreference = genderPreference;
    if (amenities) listing.amenities = amenities;

    if (images && Array.isArray(images)) {
      listing.images = images.map(img => {
        const uploadTime = new Date();
        const imagePayload = img.data || img.url || '';
        const mac = computeImageIntegrity(imagePayload, { uploadedAt: uploadTime });
        return {
          url: img.url || '',
          data: img.data || '',
          imageMac: mac,
          uploadedAt: uploadTime,
        };
      });
    }

    listing.updatedAt = new Date();
    await listing.save();

    return res.json({
      success: true,
      message: 'Listing successfully updated and re-encrypted!',
      listing: listing.getDecryptedListing(),
    });
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update listing' });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Mark listing as rented/unavailable or available (Owner or Admin only).
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const isOwner = listing.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['available', 'rented', 'removed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    listing.status = status;
    listing.updatedAt = new Date();
    await listing.save();

    return res.json({
      success: true,
      message: `Listing status updated to ${status}.`,
      listing: listing.getDecryptedListing(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update listing status' });
  }
});

/**
 * DELETE /api/listings/:id
 * Delete listing (Owner or Admin only).
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const isOwner = listing.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    listing.status = 'removed';
    listing.updatedAt = new Date();
    await listing.save();

    return res.json({ success: true, message: 'Listing successfully removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
});

module.exports = router;
