/**
 * Housing Listing Model
 * Titles, descriptions, and street addresses are encrypted with RSA.
 * Images contain custom CBC-MAC integrity verification tags to prevent tampering.
 */

const mongoose = require('mongoose');
const { encryptDataRSA, decryptDataRSA, computeImageIntegrity, verifyImageIntegrity } = require('../crypto/encryptionService');

const listingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Encrypted text fields (RSA + HMAC)
  encryptedTitle: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedDescription: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedAddress: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },

  // Search & Filter Index Fields
  city: {
    type: String,
    required: true,
    index: true,
  },
  neighborhood: {
    type: String,
    default: '',
  },
  rent: {
    type: Number,
    required: true,
    index: true,
  },
  bedrooms: {
    type: Number,
    required: true,
    default: 1,
  },
  bathrooms: {
    type: Number,
    required: true,
    default: 1,
  },
  availableRooms: {
    type: Number,
    required: true,
    default: 1,
  },
  moveInDate: {
    type: String,
    default: '',
  },
  utilitiesIncluded: {
    type: Boolean,
    default: false,
  },
  furnished: {
    type: String,
    enum: ['furnished', 'unfurnished', 'semi-furnished'],
    default: 'furnished',
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'studio', 'shared-room', 'dorm'],
    default: 'apartment',
  },
  petAllowed: {
    type: Boolean,
    default: false,
  },
  genderPreference: {
    type: String,
    enum: ['any', 'female-only', 'male-only'],
    default: 'any',
  },
  amenities: [{
    type: String,
  }],

  // Property Images with CBC-MAC Integrity verification
  images: [{
    url: String,
    data: String, // Base64 data
    imageMac: String, // CBC-MAC tag
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Status: 'available' (active search), 'rented' (unavailable), 'removed'
  status: {
    type: String,
    enum: ['available', 'rented', 'removed'],
    default: 'available',
    index: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Decrypts listing content and verifies all image MAC tags.
 */
listingSchema.methods.getDecryptedListing = function () {
  const title = this.encryptedTitle ? decryptDataRSA(this.encryptedTitle) : 'Untitled';
  const description = this.encryptedDescription ? decryptDataRSA(this.encryptedDescription) : '';
  const address = this.encryptedAddress ? decryptDataRSA(this.encryptedAddress) : '';

  // Verify image CBC-MAC integrity
  const verifiedImages = (this.images || []).map(img => {
    const isIntegrityValid = verifyImageIntegrity(img.data || img.url, { uploadedAt: img.uploadedAt }, img.imageMac);
    return {
      url: img.url,
      data: img.data,
      imageMac: img.imageMac,
      integrityVerified: isIntegrityValid,
      uploadedAt: img.uploadedAt,
    };
  });

  return {
    _id: this._id,
    ownerId: this.ownerId,
    title,
    description,
    address,
    city: this.city,
    neighborhood: this.neighborhood,
    rent: this.rent,
    bedrooms: this.bedrooms,
    bathrooms: this.bathrooms,
    availableRooms: this.availableRooms,
    moveInDate: this.moveInDate,
    utilitiesIncluded: this.utilitiesIncluded,
    furnished: this.furnished,
    propertyType: this.propertyType,
    petAllowed: this.petAllowed,
    genderPreference: this.genderPreference,
    amenities: this.amenities,
    images: verifiedImages,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Listing = mongoose.model('Listing', listingSchema);

module.exports = { Listing };
