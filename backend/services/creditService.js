import userModel from '../models/user-model.js';
import CreditTransaction from '../models/creditTransaction-model.js';

// Characters for referral codes — excludes visually ambiguous: 0, O, I, 1
const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 8-character referral code.
 */
function generateCode() {
  return Array.from(
    { length: 8 },
    () => REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)]
  ).join('');
}

/**
 * Generate a unique referral code for a user.
 * Retries up to 5 times if a collision is found.
 * @returns {Promise<string>} unique referral code
 * @throws {Error} if unique code cannot be generated after 5 attempts
 */
export async function generateReferralCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const existing = await userModel.findOne({ referralCode: code }).lean();
    if (!existing) return code;
  }
  throw new Error('referral_code_generation_failed');
}

/**
 * Award credits to a user atomically and record the transaction.
 * @param {ObjectId|string} userId
 * @param {number} amount - positive number of credits to add
 * @param {string} type - transaction type
 * @param {ObjectId|string|null} relatedUserId - optional related user
 * @returns {Promise<{credits: number}>} updated user credits
 */
export async function awardCredits(userId, amount, type, relatedUserId = null) {
  const updated = await userModel.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { new: true, select: 'credits' }
  );

  if (!updated) throw new Error('User not found');

  await CreditTransaction.create({
    userId,
    type,
    amount,
    balanceAfter: updated.credits,
    relatedUserId: relatedUserId || null,
  });

  return { credits: updated.credits };
}

/**
 * Deduct 1 credit from a user atomically.
 * Uses a query guard to ensure balance >= 1 (prevents negative balance).
 * @param {ObjectId|string} userId
 * @returns {Promise<{credits: number}>} updated user credits
 * @throws {Error} with message 'insufficient_credits' if balance < 1
 */
export async function deductCredit(userId) {
  const updated = await userModel.findOneAndUpdate(
    { _id: userId, credits: { $gte: 1 } },
    { $inc: { credits: -1 } },
    { new: true, select: 'credits' }
  );

  if (!updated) {
    throw new Error('insufficient_credits');
  }

  await CreditTransaction.create({
    userId,
    type: 'itinerary_generation',
    amount: -1,
    balanceAfter: updated.credits,
    relatedUserId: null,
  });

  return { credits: updated.credits };
}

/**
 * Refund 1 credit to a user (used when AI generation fails).
 * @param {ObjectId|string} userId
 * @returns {Promise<{credits: number}>} updated user credits
 */
export async function refundCredit(userId) {
  const updated = await userModel.findByIdAndUpdate(
    userId,
    { $inc: { credits: 1 } },
    { new: true, select: 'credits' }
  );

  if (!updated) throw new Error('User not found');

  await CreditTransaction.create({
    userId,
    type: 'refund',
    amount: 1,
    balanceAfter: updated.credits,
    relatedUserId: null,
  });

  return { credits: updated.credits };
}
