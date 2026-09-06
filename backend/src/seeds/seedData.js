/**
 * Database Seeder
 * Populates realistic demo students, an administrator, profiles with lifestyle attributes,
 * housing listings with image CBC-MAC tags, reviews, and encrypted peer messages.
 */

const { User } = require('../models/User');
const { Profile } = require('../models/Profile');
const { Listing } = require('../models/Listing');
const { RoommateRequest } = require('../models/RoommateRequest');
const { Message } = require('../models/Message');
const { Review } = require('../models/Review');
const { Category } = require('../models/Category');
const { hashPassword } = require('../crypto/kdf');
const { keyManager } = require('../crypto/keyManager');
const {
  createBlindIndex,
  encryptDataRSA,
  encryptDataECC,
  computeImageIntegrity,
} = require('../crypto/encryptionService');

async function seedDatabase() {
  console.log('[Seeder] Checking if database needs seeding...');
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`[Seeder] Database already populated with ${userCount} users. Skipping seeder.`);
    return;
  }

  console.log('[Seeder] Seeding database with initial cryptographic records...');

  // 1. Create Admin Account
  const adminEccKeys = keyManager.generateUserEccKeyPair();
  const adminUser = new User({
    emailBlindIndex: createBlindIndex('admin@university.edu'),
    encryptedName: encryptDataRSA('System Administrator'),
    encryptedEmail: encryptDataRSA('admin@university.edu'),
    encryptedPhone: encryptDataRSA('+1-555-0100'),
    encryptedDepartment: encryptDataRSA('Campus Housing Authority'),
    encryptedYearOfStudy: encryptDataRSA('Staff'),
    passwordHash: hashPassword('AdminPassword123!').formatted,
    role: 'admin',
    isVerified: true,
    eccPublicKey: adminEccKeys.publicKey,
    encryptedEccPrivateKey: encryptDataRSA(adminEccKeys.privateKey),
    status: 'active',
  });
  await adminUser.save();

  const adminProfile = new Profile({
    userId: adminUser._id,
    encryptedBio: encryptDataRSA('Official University Housing Administration & Safety Team.'),
    encryptedPreferredLocation: encryptDataRSA('Central Campus'),
    privacy: { showPhone: true, showEmail: true, showAge: true, showBudget: true },
  });
  await adminProfile.save();

  // 2. Student 1: Alex Rivera (CS Junior)
  const alexEccKeys = keyManager.generateUserEccKeyPair();
  const alexUser = new User({
    emailBlindIndex: createBlindIndex('alex@university.edu'),
    encryptedName: encryptDataRSA('Alex Rivera'),
    encryptedEmail: encryptDataRSA('alex@university.edu'),
    encryptedPhone: encryptDataRSA('+1-555-0101'),
    encryptedDepartment: encryptDataRSA('Computer Science'),
    encryptedYearOfStudy: encryptDataRSA('Junior'),
    passwordHash: hashPassword('StudentPass123!').formatted,
    role: 'student',
    isVerified: true,
    eccPublicKey: alexEccKeys.publicKey,
    encryptedEccPrivateKey: encryptDataRSA(alexEccKeys.privateKey),
    status: 'active',
  });
  await alexUser.save();

  const alexProfile = new Profile({
    userId: alexUser._id,
    encryptedBio: encryptDataRSA('Junior studying CS. Usually working on coding projects, clean, respectful, looking for a focused roommate for fall semester!'),
    encryptedPreferredLocation: encryptDataRSA('North Campus / Elm Street'),
    ageRange: '20-22',
    preferredRentMin: 600,
    preferredRentMax: 1000,
    targetMoveInDate: '2026-09-01',
    lifestyle: {
      smoking: 'non-smoker',
      pets: 'no-pets',
      sleepSchedule: 'early-bird',
      studyHabits: 'quiet-study',
      cleanliness: 'very-clean',
      noisePreference: 'quiet',
      cookingHabits: 'occasional',
      guestPreference: 'rarely',
    },
    privacy: { showPhone: false, showEmail: false, showAge: true, showBudget: true },
  });
  await alexProfile.save();

  // 3. Student 2: Brianna Chen (ME Junior - 95% Compatibility with Alex!)
  const briannaEccKeys = keyManager.generateUserEccKeyPair();
  const briannaUser = new User({
    emailBlindIndex: createBlindIndex('brianna@university.edu'),
    encryptedName: encryptDataRSA('Brianna Chen'),
    encryptedEmail: encryptDataRSA('brianna@university.edu'),
    encryptedPhone: encryptDataRSA('+1-555-0102'),
    encryptedDepartment: encryptDataRSA('Mechanical Engineering'),
    encryptedYearOfStudy: encryptDataRSA('Junior'),
    passwordHash: hashPassword('StudentPass123!').formatted,
    role: 'student',
    isVerified: true,
    eccPublicKey: briannaEccKeys.publicKey,
    encryptedEccPrivateKey: encryptDataRSA(briannaEccKeys.privateKey),
    status: 'active',
  });
  await briannaUser.save();

  const briannaProfile = new Profile({
    userId: briannaUser._id,
    encryptedBio: encryptDataRSA('Engineering student who values quiet evenings and a clean kitchen. Love baking on weekends and studying in natural light.'),
    encryptedPreferredLocation: encryptDataRSA('North Campus'),
    ageRange: '20-22',
    preferredRentMin: 700,
    preferredRentMax: 1100,
    targetMoveInDate: '2026-09-01',
    lifestyle: {
      smoking: 'non-smoker',
      pets: 'no-pets',
      sleepSchedule: 'early-bird',
      studyHabits: 'quiet-study',
      cleanliness: 'very-clean',
      noisePreference: 'quiet',
      cookingHabits: 'daily',
      guestPreference: 'weekends',
    },
    privacy: { showPhone: false, showEmail: false, showAge: true, showBudget: true },
  });
  await briannaProfile.save();

  // 4. Student 3: Marcus Vance (Business Senior - Social & Night Owl)
  const marcusEccKeys = keyManager.generateUserEccKeyPair();
  const marcusUser = new User({
    emailBlindIndex: createBlindIndex('marcus@university.edu'),
    encryptedName: encryptDataRSA('Marcus Vance'),
    encryptedEmail: encryptDataRSA('marcus@university.edu'),
    encryptedPhone: encryptDataRSA('+1-555-0103'),
    encryptedDepartment: encryptDataRSA('Business & Finance'),
    encryptedYearOfStudy: encryptDataRSA('Senior'),
    passwordHash: hashPassword('StudentPass123!').formatted,
    role: 'student',
    isVerified: true,
    eccPublicKey: marcusEccKeys.publicKey,
    encryptedEccPrivateKey: encryptDataRSA(marcusEccKeys.privateKey),
    status: 'active',
  });
  await marcusUser.save();

  const marcusProfile = new Profile({
    userId: marcusUser._id,
    encryptedBio: encryptDataRSA('Senior in Business. Friendly, love sports and music. Have a friendly golden retriever named Cooper!'),
    encryptedPreferredLocation: encryptDataRSA('South Campus / Downtown'),
    ageRange: '22-24',
    preferredRentMin: 500,
    preferredRentMax: 900,
    targetMoveInDate: '2026-08-15',
    lifestyle: {
      smoking: 'outside-only',
      pets: 'dog',
      sleepSchedule: 'night-owl',
      studyHabits: 'background-music',
      cleanliness: 'average',
      noisePreference: 'lively',
      cookingHabits: 'occasional',
      guestPreference: 'flexible',
    },
    privacy: { showPhone: false, showEmail: true, showAge: true, showBudget: true },
  });
  await marcusProfile.save();

  // 5. Student 4: Diana Patel (Biology Sophomore)
  const dianaEccKeys = keyManager.generateUserEccKeyPair();
  const dianaUser = new User({
    emailBlindIndex: createBlindIndex('diana@university.edu'),
    encryptedName: encryptDataRSA('Diana Patel'),
    encryptedEmail: encryptDataRSA('diana@university.edu'),
    encryptedPhone: encryptDataRSA('+1-555-0104'),
    encryptedDepartment: encryptDataRSA('Biology / Pre-Med'),
    encryptedYearOfStudy: encryptDataRSA('Sophomore'),
    passwordHash: hashPassword('StudentPass123!').formatted,
    role: 'student',
    isVerified: true,
    eccPublicKey: dianaEccKeys.publicKey,
    encryptedEccPrivateKey: encryptDataRSA(dianaEccKeys.privateKey),
    status: 'active',
  });
  await dianaUser.save();

  const dianaProfile = new Profile({
    userId: dianaUser._id,
    encryptedBio: encryptDataRSA('Pre-med sophomore. Spend long hours in lab and library. Quiet, clean, and have an indoor cat.'),
    encryptedPreferredLocation: encryptDataRSA('Medical Center / East Campus'),
    ageRange: '19-21',
    preferredRentMin: 800,
    preferredRentMax: 1300,
    targetMoveInDate: '2026-09-01',
    lifestyle: {
      smoking: 'non-smoker',
      pets: 'cat',
      sleepSchedule: 'flexible',
      studyHabits: 'quiet-study',
      cleanliness: 'very-clean',
      noisePreference: 'quiet',
      cookingHabits: 'strict-diet',
      guestPreference: 'rarely',
    },
    privacy: { showPhone: false, showEmail: false, showAge: true, showBudget: true },
  });
  await dianaProfile.save();

  // 6. Seed Sample Housing Listings
  const sampleImage1 = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
  const sampleImage2 = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80';
  const sampleImage3 = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';

  const t1 = new Date();
  const listing1 = new Listing({
    ownerId: alexUser._id,
    encryptedTitle: encryptDataRSA('Spacious 2BR Apartment near Engineering Quad'),
    encryptedDescription: encryptDataRSA('Sunny second-floor apartment with hardwood floors, high-speed fiber internet, in-unit laundry, and a quiet study atmosphere. Walk to campus in 7 minutes!'),
    encryptedAddress: encryptDataRSA('412 University Ave, Apt 2B'),
    city: 'Campus District',
    neighborhood: 'North Campus',
    rent: 850,
    bedrooms: 2,
    bathrooms: 1,
    availableRooms: 1,
    moveInDate: '2026-09-01',
    utilitiesIncluded: true,
    furnished: 'furnished',
    propertyType: 'apartment',
    petAllowed: false,
    genderPreference: 'any',
    amenities: ['High-Speed WiFi', 'In-Unit Washer/Dryer', 'Dishwasher', 'Bike Storage', 'Air Conditioning'],
    images: [{
      url: sampleImage1,
      imageMac: computeImageIntegrity(sampleImage1, { uploadedAt: t1 }),
      uploadedAt: t1,
    }],
    status: 'available',
  });
  await listing1.save();

  const t2 = new Date();
  const listing2 = new Listing({
    ownerId: marcusUser._id,
    encryptedTitle: encryptDataRSA('Modern Studio Walking Distance to Business School'),
    encryptedDescription: encryptDataRSA('Newly renovated private studio with balcony, gym access in building, parking spot included. Dog friendly!'),
    encryptedAddress: encryptDataRSA('88 South College St, Unit 14'),
    city: 'Downtown',
    neighborhood: 'South Campus',
    rent: 750,
    bedrooms: 1,
    bathrooms: 1,
    availableRooms: 1,
    moveInDate: '2026-08-15',
    utilitiesIncluded: false,
    furnished: 'furnished',
    propertyType: 'studio',
    petAllowed: true,
    genderPreference: 'any',
    amenities: ['Gym Access', 'Balcony', 'Parking Included', 'Elevator', 'Pet Friendly'],
    images: [{
      url: sampleImage2,
      imageMac: computeImageIntegrity(sampleImage2, { uploadedAt: t2 }),
      uploadedAt: t2,
    }],
    status: 'available',
  });
  await listing2.save();

  const t3 = new Date();
  const listing3 = new Listing({
    ownerId: dianaUser._id,
    encryptedTitle: encryptDataRSA('Private Master Bedroom in Peaceful Eastside Townhouse'),
    encryptedDescription: encryptDataRSA('Spacious master bedroom with private ensuite bathroom and walk-in closet in quiet 3-bedroom townhouse. Cat friendly, peaceful community near medical quad.'),
    encryptedAddress: encryptDataRSA('15 Oakwood Terrace'),
    city: 'Eastside',
    neighborhood: 'East Campus',
    rent: 950,
    bedrooms: 3,
    bathrooms: 2,
    availableRooms: 1,
    moveInDate: '2026-09-01',
    utilitiesIncluded: true,
    furnished: 'semi-furnished',
    propertyType: 'house',
    petAllowed: true,
    genderPreference: 'female-only',
    amenities: ['Ensuite Private Bath', 'Patio / Garden', 'Quiet Neighborhood', 'Cat Friendly'],
    images: [{
      url: sampleImage3,
      imageMac: computeImageIntegrity(sampleImage3, { uploadedAt: t3 }),
      uploadedAt: t3,
    }],
    status: 'available',
  });
  await listing3.save();

  // 7. Seed an Accepted Connection Request between Alex Rivera and Brianna Chen
  const connReq = new RoommateRequest({
    senderId: alexUser._id,
    receiverId: briannaUser._id,
    encryptedNote: encryptDataECC('Hi Brianna! I saw our 95% compatibility score and your post. I am also looking for fall housing near North Campus.', briannaUser.eccPublicKey),
    status: 'accepted',
  });
  await connReq.save();

  // 8. Seed Initial Encrypted Messages between Alex and Brianna using pure ECC
  const convId = [alexUser._id.toString(), briannaUser._id.toString()].sort().join('_');
  const msg1Text = 'Hi Brianna! Thanks for connecting. Are you still looking for a roommate for the North Campus apartment?';
  const msg1 = new Message({
    conversationId: convId,
    senderId: alexUser._id,
    receiverId: briannaUser._id,
    encryptedForRecipient: encryptDataECC(msg1Text, briannaUser.eccPublicKey),
    encryptedForSender: encryptDataECC(msg1Text, alexUser.eccPublicKey),
    read: true,
    createdAt: new Date(Date.now() - 3600 * 1000),
  });
  await msg1.save();

  const msg2Text = 'Hey Alex! Yes, absolutely! The 2BR apartment on University Ave looks ideal. Would you be free for a tour this Friday?';
  const msg2 = new Message({
    conversationId: convId,
    senderId: briannaUser._id,
    receiverId: alexUser._id,
    encryptedForRecipient: encryptDataECC(msg2Text, alexUser.eccPublicKey),
    encryptedForSender: encryptDataECC(msg2Text, briannaUser.eccPublicKey),
    read: true,
    createdAt: new Date(Date.now() - 1800 * 1000),
  });
  await msg2.save();

  // 9. Seed a verified review between connected students
  const review = new Review({
    reviewerId: briannaUser._id,
    targetUserId: alexUser._id,
    rating: 5,
    encryptedComment: encryptDataRSA('Alex was super respectful, tidy, and very communicative during our housing search. Highly recommended roommate!'),
  });
  await review.save();

  // 10. Seed Categories
  const categories = [
    { name: 'North Campus', type: 'location', description: 'Engineering & Science Quad area' },
    { name: 'South Campus', type: 'location', description: 'Business & Humanities area' },
    { name: 'Downtown', type: 'location', description: 'City center, nightlife & transit hub' },
    { name: 'Eastside', type: 'location', description: 'Medical school & hospital district' },
    { name: 'Apartment', type: 'property_type', description: 'Multi-family residential complex' },
    { name: 'Studio', type: 'property_type', description: 'Self-contained single unit' },
    { name: 'House / Townhome', type: 'property_type', description: 'Single family or townhouse' },
    { name: 'Computer Science', type: 'department', description: 'Faculty of Computing' },
    { name: 'Mechanical Engineering', type: 'department', description: 'Faculty of Engineering' },
    { name: 'Business & Finance', type: 'department', description: 'School of Management' },
  ];
  for (const c of categories) {
    await new Category(c).save();
  }

  console.log('[Seeder] Database seeding completed successfully!');
  console.log('[Seeder] Demo Accounts:');
  console.log('   - Admin:   admin@university.edu   / AdminPassword123!');
  console.log('   - Student: alex@university.edu    / StudentPass123!');
  console.log('   - Student: brianna@university.edu / StudentPass123!');
  console.log('   - Student: marcus@university.edu  / StudentPass123!');
  console.log('   - Student: diana@university.edu   / StudentPass123!');
}

module.exports = { seedDatabase };
