/**
 * Roommate Matching Algorithm & Recommendations
 * Computes multi-attribute compatibility scores based on shared lifestyle preferences,
 * budget overlap, and habits, returning ranked suggestions.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Profile } = require('../models/Profile');
const { authenticate } = require('../middleware/auth');

/**
 * Computes the compatibility percentage between two lifestyle preference profiles.
 *
 * @param {object} p1 Lifestyle object 1
 * @param {object} p2 Lifestyle object 2
 * @returns {{ score: number, matchedFactors: string[], differingFactors: string[] }}
 */
function calculateCompatibility(p1, p2) {
  if (!p1 || !p2) return { score: 50, matchedFactors: [], differingFactors: [] };

  let totalScore = 0;
  const matchedFactors = [];
  const differingFactors = [];

  // 1. Smoking (20% weight)
  if (p1.smoking === p2.smoking) {
    totalScore += 20;
    matchedFactors.push(`Both are ${p1.smoking}s`);
  } else if (
    (p1.smoking === 'non-smoker' && p2.smoking === 'outside-only') ||
    (p1.smoking === 'outside-only' && p2.smoking === 'non-smoker')
  ) {
    totalScore += 12;
    matchedFactors.push('Compatible smoking policy (outdoor only)');
  } else {
    differingFactors.push(`Smoking preference mismatch (${p1.smoking} vs ${p2.smoking})`);
  }

  // 2. Cleanliness (20% weight)
  if (p1.cleanliness === p2.cleanliness) {
    totalScore += 20;
    matchedFactors.push(`Shared cleanliness standard (${p1.cleanliness})`);
  } else if (
    (p1.cleanliness === 'very-clean' && p2.cleanliness === 'average') ||
    (p1.cleanliness === 'average' && p2.cleanliness === 'very-clean') ||
    (p1.cleanliness === 'average' && p2.cleanliness === 'relaxed') ||
    (p1.cleanliness === 'relaxed' && p2.cleanliness === 'average')
  ) {
    totalScore += 12;
    matchedFactors.push('Moderate cleanliness compatibility');
  } else {
    differingFactors.push(`Cleanliness expectation gap (${p1.cleanliness} vs ${p2.cleanliness})`);
  }

  // 3. Sleep Schedule (15% weight)
  if (p1.sleepSchedule === p2.sleepSchedule) {
    totalScore += 15;
    matchedFactors.push(`Harmonious sleeping hours (${p1.sleepSchedule})`);
  } else if (p1.sleepSchedule === 'flexible' || p2.sleepSchedule === 'flexible') {
    totalScore += 12;
    matchedFactors.push('Flexible sleeping schedule accommodation');
  } else {
    totalScore += 4;
    differingFactors.push(`Opposite sleep schedules (${p1.sleepSchedule} vs ${p2.sleepSchedule})`);
  }

  // 4. Noise Preference (15% weight)
  if (p1.noisePreference === p2.noisePreference) {
    totalScore += 15;
    matchedFactors.push(`Matching noise tolerance (${p1.noisePreference})`);
  } else if (
    (p1.noisePreference === 'quiet' && p2.noisePreference === 'moderate') ||
    (p1.noisePreference === 'moderate' && p2.noisePreference === 'quiet') ||
    (p1.noisePreference === 'moderate' && p2.noisePreference === 'lively') ||
    (p1.noisePreference === 'lively' && p2.noisePreference === 'moderate')
  ) {
    totalScore += 10;
    matchedFactors.push('Acceptable sound environment match');
  } else {
    differingFactors.push(`Noise contrast (${p1.noisePreference} vs ${p2.noisePreference})`);
  }

  // 5. Pets (15% weight)
  if (p1.pets === p2.pets) {
    totalScore += 15;
    matchedFactors.push(p1.pets === 'no-pets' ? 'Both prefer no pets' : `Pet friendly (${p1.pets})`);
  } else if (p1.pets !== 'no-pets' && p2.pets !== 'no-pets') {
    totalScore += 10;
    matchedFactors.push('Both are open to pets');
  } else {
    differingFactors.push(`Pet policy contrast (${p1.pets} vs ${p2.pets})`);
  }

  // 6. Study Habits (8% weight)
  if (p1.studyHabits === p2.studyHabits) {
    totalScore += 8;
    matchedFactors.push(`Complimentary study environment (${p1.studyHabits})`);
  } else {
    totalScore += 4;
  }

  // 7. Cooking Habits (7% weight)
  if (p1.cookingHabits === p2.cookingHabits) {
    totalScore += 7;
    matchedFactors.push(`Shared kitchen schedule (${p1.cookingHabits})`);
  } else {
    totalScore += 3;
  }

  return {
    score: Math.min(100, Math.round(totalScore)),
    matchedFactors,
    differingFactors,
  };
}

/**
 * GET /api/matching/suggestions
 * Returns suggested roommates ranked by compatibility score with lifestyle filters.
 */
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    const currentProfile = await Profile.findOne({ userId: req.user._id });
    if (!currentProfile) {
      return res.status(400).json({ success: false, message: 'Please create your student profile first' });
    }

    const {
      department,
      yearOfStudy,
      minRent,
      maxRent,
      smoking,
      pets,
      sleepSchedule,
      cleanliness,
    } = req.query;

    // Exclude current user and any blocked users
    const excludedUserIds = [req.user._id, ...(req.user.blockedUsers || [])];

    // Find verified, active student users
    const candidateUsers = await User.find({
      _id: { $nin: excludedUserIds },
      status: 'active',
      isVerified: true,
      role: 'student',
    });

    const suggestions = [];

    for (const candidate of candidateUsers) {
      // Check candidate profile
      const candidateProfile = await Profile.findOne({ userId: candidate._id });
      if (!candidateProfile) continue;

      const candDecryptedUser = candidate.getDecryptedData();
      const candDecryptedProfile = candidateProfile.getDecryptedProfile(false);

      // Filters
      if (department && candDecryptedUser.department.toLowerCase() !== department.toLowerCase()) {
        continue;
      }
      if (yearOfStudy && candDecryptedUser.yearOfStudy.toLowerCase() !== yearOfStudy.toLowerCase()) {
        continue;
      }
      if (smoking && candidateProfile.lifestyle.smoking !== smoking) {
        continue;
      }
      if (pets && candidateProfile.lifestyle.pets !== pets) {
        continue;
      }
      if (sleepSchedule && candidateProfile.lifestyle.sleepSchedule !== sleepSchedule) {
        continue;
      }
      if (cleanliness && candidateProfile.lifestyle.cleanliness !== cleanliness) {
        continue;
      }
      if (minRent && candidateProfile.preferredRentMax < Number(minRent)) {
        continue;
      }
      if (maxRent && candidateProfile.preferredRentMin > Number(maxRent)) {
        continue;
      }

      // Calculate compatibility score
      const match = calculateCompatibility(currentProfile.lifestyle, candidateProfile.lifestyle);

      suggestions.push({
        user: {
          _id: candDecryptedUser._id,
          name: candDecryptedUser.name,
          department: candDecryptedUser.department,
          yearOfStudy: candDecryptedUser.yearOfStudy,
          eccPublicKey: candDecryptedUser.eccPublicKey,
          phone: candDecryptedProfile.privacy.showPhone ? candDecryptedUser.phone : null,
          email: candDecryptedProfile.privacy.showEmail ? candDecryptedUser.email : null,
        },
        profile: candDecryptedProfile,
        compatibilityScore: match.score,
        matchedFactors: match.matchedFactors,
        differingFactors: match.differingFactors,
      });
    }

    // Sort by highest compatibility score first
    suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error('Roommate matching error:', error);
    return res.status(500).json({ success: false, message: 'Matching calculation failed' });
  }
});

module.exports = router;
