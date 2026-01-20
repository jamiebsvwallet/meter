/**
 * Consumer Water Conservation Rewards System
 * Direct payments to homeowners for saving water
 * Connects water credits to marketplace buyers
 * 
 * Copyright © 2026 - All Rights Reserved
 * Created: January 20, 2026
 */

import { WaterCreditsTrading, CreditType } from './water-credits.js';
import { WaterDataMarketplace } from './water-data-marketplace.js';

/**
 * Reward Tier based on conservation level
 */
export enum RewardTier {
  BRONZE = 'bronze',     // 5-10% savings
  SILVER = 'silver',     // 10-20% savings
  GOLD = 'gold',         // 20-30% savings
  PLATINUM = 'platinum'  // 30%+ savings
}

/**
 * Consumer Reward Account
 */
interface ConsumerRewardAccount {
  userId: string;
  propertyId: string;
  bsvWalletAddress: string;      // HandCash paymail or BSV address
  
  // Water savings
  baselineUsage: number;          // Liters/day baseline (first 30 days)
  currentUsage: number;           // Current liters/day
  percentageSaved: number;        // % reduction
  
  // Credits earned
  waterCreditsBalance: number;    // Gallons saved = credits
  creditValue: number;            // Current market value in £
  
  // Rewards earned
  totalRewardsEarned: number;     // £ total
  lastPayoutDate: Date;
  nextPayoutDate: Date;
  
  // Tier benefits
  rewardTier: RewardTier;
  monthlyBonus: number;           // Tier-based bonus payment
  
  // Payment preferences
  paymentMethod: 'bsv_instant' | 'bsv_monthly' | 'bill_credit' | 'charity';
  autoSellCredits: boolean;       // Auto-sell credits to marketplace
}

/**
 * Reward Payout
 */
interface RewardPayout {
  payoutId: string;
  userId: string;
  amount: number;                 // £ or BSV satoshis
  source: 'conservation_bonus' | 'credit_sale' | 'tier_bonus' | 'challenge_reward';
  bsvTxId: string;
  timestamp: Date;
}

/**
 * Conservation Challenge
 */
interface ConservationChallenge {
  challengeId: string;
  name: string;
  description: string;
  targetSavings: number;          // % to save
  durationDays: number;
  rewardAmount: number;           // £ bonus for completion
  participants: number;
  endDate: Date;
}

/**
 * Consumer Rewards Service
 */
export class ConsumerRewardsService {
  private static accounts: Map<string, ConsumerRewardAccount> = new Map();
  private static payouts: RewardPayout[] = [];
  private static challenges: ConservationChallenge[] = [];

  /**
   * Register consumer for rewards program
   */
  static registerConsumer(
    userId: string,
    propertyId: string,
    bsvWalletAddress: string,
    baselineUsage: number
  ): ConsumerRewardAccount {
    const account: ConsumerRewardAccount = {
      userId,
      propertyId,
      bsvWalletAddress,
      baselineUsage,
      currentUsage: baselineUsage,
      percentageSaved: 0,
      waterCreditsBalance: 0,
      creditValue: 0,
      totalRewardsEarned: 0,
      lastPayoutDate: new Date(),
      nextPayoutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      rewardTier: RewardTier.BRONZE,
      monthlyBonus: 0,
      paymentMethod: 'bsv_monthly',
      autoSellCredits: false
    };

    this.accounts.set(userId, account);
    return account;
  }

  /**
   * Process daily water usage and calculate rewards
   */
  static processDailyUsage(
    userId: string,
    dailyUsageLiters: number
  ): {
    waterSaved: number;
    creditsEarned: number;
    rewardAmount: number;
    newTier: RewardTier;
    message: string;
  } {
    const account = this.accounts.get(userId);
    if (!account) {
      throw new Error('Consumer not registered for rewards');
    }

    // Calculate savings
    const previousUsage = account.currentUsage;
    account.currentUsage = dailyUsageLiters;
    
    const waterSaved = Math.max(0, account.baselineUsage - dailyUsageLiters);
    const percentageSaved = (waterSaved / account.baselineUsage) * 100;
    account.percentageSaved = Math.round(percentageSaved * 10) / 10;

    // Convert to gallons (1 gallon ≈ 3.785 liters)
    const gallonsSaved = waterSaved / 3.785;

    // Issue water credits if savings > 5%
    let creditsEarned = 0;
    if (percentageSaved >= 5) {
      const creditResult = WaterCreditsTrading.issueCredits(
        userId,
        account.propertyId,
        CreditType.CONSERVATION,
        gallonsSaved,
        {
          baseline: account.baselineUsage,
          current: dailyUsageLiters,
          verified: true
        }
      );
      
      creditsEarned = creditResult.gallonsSaved;
      account.waterCreditsBalance += creditsEarned;
      account.creditValue = creditResult.estimatedValue;
    }

    // Calculate tier and bonus
    const previousTier = account.rewardTier;
    const newTier = this.calculateRewardTier(percentageSaved);
    account.rewardTier = newTier;

    // Daily reward amount (£)
    let rewardAmount = 0;
    if (percentageSaved >= 5) {
      rewardAmount = this.calculateDailyReward(percentageSaved, newTier);
      account.totalRewardsEarned += rewardAmount;
    }

    // Auto-sell credits if enabled
    if (account.autoSellCredits && creditsEarned > 0) {
      this.sellCreditsToMarketplace(userId, creditsEarned);
    }

    // Generate message
    let message = `Saved ${Math.round(waterSaved)} liters (${percentageSaved}% reduction)`;
    if (newTier !== previousTier) {
      message += ` 🎉 TIER UP! Now ${newTier.toUpperCase()}!`;
    }
    if (creditsEarned > 0) {
      message += ` Earned ${Math.round(creditsEarned)} water credits worth £${account.creditValue}`;
    }

    return {
      waterSaved,
      creditsEarned,
      rewardAmount,
      newTier,
      message
    };
  }

  /**
   * Calculate reward tier based on savings percentage
   */
  private static calculateRewardTier(percentageSaved: number): RewardTier {
    if (percentageSaved >= 30) return RewardTier.PLATINUM;
    if (percentageSaved >= 20) return RewardTier.GOLD;
    if (percentageSaved >= 10) return RewardTier.SILVER;
    return RewardTier.BRONZE;
  }

  /**
   * Calculate daily reward amount
   */
  private static calculateDailyReward(percentageSaved: number, tier: RewardTier): number {
    // Base reward: £0.10 per day for every 5% saved
    let baseReward = (percentageSaved / 5) * 0.10;

    // Tier multiplier
    const tierMultipliers = {
      [RewardTier.BRONZE]: 1.0,
      [RewardTier.SILVER]: 1.25,
      [RewardTier.GOLD]: 1.5,
      [RewardTier.PLATINUM]: 2.0
    };

    return Math.round(baseReward * tierMultipliers[tier] * 100) / 100;
  }

  /**
   * Process monthly payout
   */
  static async processMonthlyPayout(userId: string): Promise<RewardPayout> {
    const account = this.accounts.get(userId);
    if (!account) {
      throw new Error('Consumer not registered');
    }

    // Calculate monthly total
    const monthlyReward = account.totalRewardsEarned;
    
    // Add tier bonus
    const tierBonuses = {
      [RewardTier.BRONZE]: 5,
      [RewardTier.SILVER]: 15,
      [RewardTier.GOLD]: 30,
      [RewardTier.PLATINUM]: 60
    };
    const tierBonus = tierBonuses[account.rewardTier];
    const totalPayout = monthlyReward + tierBonus;

    // Process BSV payment
    const bsvTxId = await this.sendBSVPayment(
      account.bsvWalletAddress,
      totalPayout
    );

    const payout: RewardPayout = {
      payoutId: `payout_${Date.now()}_${userId}`,
      userId,
      amount: totalPayout,
      source: 'conservation_bonus',
      bsvTxId,
      timestamp: new Date()
    };

    this.payouts.push(payout);

    // Reset for next month
    account.totalRewardsEarned = 0;
    account.lastPayoutDate = new Date();
    account.nextPayoutDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return payout;
  }

  /**
   * Sell water credits to marketplace buyers
   */
  static sellCreditsToMarketplace(
    userId: string,
    creditsToSell: number
  ): {
    creditsSold: number;
    saleValue: number;
    bsvTxId: string;
  } {
    const account = this.accounts.get(userId);
    if (!account) {
      throw new Error('Consumer not registered');
    }

    if (creditsToSell > account.waterCreditsBalance) {
      throw new Error('Insufficient credits');
    }

    // Market price per credit (fluctuates)
    const marketPrice = 0.05; // £0.05 per credit
    const saleValue = creditsToSell * marketPrice;

    // Execute sale (match with B2B buyers from marketplace)
    const buyer = this.findMarketplaceBuyer(creditsToSell);
    if (!buyer) {
      throw new Error('No buyers available');
    }

    // Process payment
    const bsvTxId = `sale_tx_${Date.now()}`;

    // Update account
    account.waterCreditsBalance -= creditsToSell;
    account.totalRewardsEarned += saleValue;

    return {
      creditsSold: creditsToSell,
      saleValue,
      bsvTxId
    };
  }

  /**
   * Find marketplace buyer for credits
   */
  private static findMarketplaceBuyer(credits: number): any {
    // Match with B2B buyers (utilities, property developers, ESG platforms)
    // In production: auction/matching engine
    return {
      buyerId: 'utility_company_123',
      maxPurchase: 100000,
      pricePerCredit: 0.05
    };
  }

  /**
   * Send BSV payment to consumer
   */
  private static async sendBSVPayment(
    walletAddress: string,
    amountGBP: number
  ): Promise<string> {
    // Convert GBP to BSV
    const bsvPrice = 50; // £50 per BSV (example)
    const bsvAmount = amountGBP / bsvPrice;
    const satoshis = Math.round(bsvAmount * 100000000);

    // In production: Use HandCash/MoneyButton SDK
    // const payment = await handcash.pay(walletAddress, satoshis);
    
    console.log(`💰 Sending ${amountGBP} GBP (${satoshis} sats) to ${walletAddress}`);
    
    return `bsv_tx_${Date.now()}`;
  }

  /**
   * Create conservation challenge
   */
  static createChallenge(
    name: string,
    targetSavings: number,
    durationDays: number,
    rewardAmount: number
  ): ConservationChallenge {
    const challenge: ConservationChallenge = {
      challengeId: `challenge_${Date.now()}`,
      name,
      description: `Save ${targetSavings}% water for ${durationDays} days and win £${rewardAmount}!`,
      targetSavings,
      durationDays,
      rewardAmount,
      participants: 0,
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    };

    this.challenges.push(challenge);
    return challenge;
  }

  /**
   * Get consumer dashboard stats
   */
  static getConsumerStats(userId: string): {
    tier: string;
    waterSaved: string;
    creditsBalance: number;
    creditValue: number;
    monthlyEarnings: number;
    nextPayout: Date;
    rankPercentile: number;
  } {
    const account = this.accounts.get(userId);
    if (!account) {
      throw new Error('Consumer not registered');
    }

    // Calculate water saved (monthly)
    const dailySavings = account.baselineUsage - account.currentUsage;
    const monthlySavings = dailySavings * 30;

    // Calculate ranking
    const allAccounts = Array.from(this.accounts.values());
    const sorted = allAccounts.sort((a, b) => b.percentageSaved - a.percentageSaved);
    const rank = sorted.findIndex(a => a.userId === userId) + 1;
    const percentile = Math.round((rank / sorted.length) * 100);

    return {
      tier: account.rewardTier.toUpperCase(),
      waterSaved: `${Math.round(monthlySavings)} liters/month (${account.percentageSaved}% reduction)`,
      creditsBalance: Math.round(account.waterCreditsBalance),
      creditValue: account.creditValue,
      monthlyEarnings: account.totalRewardsEarned,
      nextPayout: account.nextPayoutDate,
      rankPercentile: percentile
    };
  }

  /**
   * Get carbon offset equivalent
   */
  static getCarbonOffset(userId: string): {
    waterSavedGallons: number;
    carbonOffsetKg: number;
    treesEquivalent: number;
    carMilesEquivalent: number;
  } {
    const account = this.accounts.get(userId);
    if (!account) {
      throw new Error('Consumer not registered');
    }

    const dailySavingsLiters = account.baselineUsage - account.currentUsage;
    const dailySavingsGallons = dailySavingsLiters / 3.785;
    
    // Water-to-carbon conversion
    // 1 gallon water saved = 0.006 kg CO2 (pumping/treatment energy)
    const carbonOffsetKg = dailySavingsGallons * 30 * 0.006;
    
    // Equivalents
    const treesEquivalent = carbonOffsetKg / 21; // 1 tree absorbs ~21 kg/year
    const carMilesEquivalent = carbonOffsetKg / 0.404; // 1 mile = 0.404 kg CO2

    return {
      waterSavedGallons: Math.round(dailySavingsGallons * 30),
      carbonOffsetKg: Math.round(carbonOffsetKg * 100) / 100,
      treesEquivalent: Math.round(treesEquivalent * 10) / 10,
      carMilesEquivalent: Math.round(carMilesEquivalent)
    };
  }
}

/**
 * Example consumer reward tiers and earnings
 */
export const rewardTierBenefits = {
  bronze: {
    minSavings: '5%',
    multiplier: '1.0x',
    monthlyBonus: '£5',
    estimatedAnnual: '£60-120'
  },
  silver: {
    minSavings: '10%',
    multiplier: '1.25x',
    monthlyBonus: '£15',
    estimatedAnnual: '£180-300'
  },
  gold: {
    minSavings: '20%',
    multiplier: '1.5x',
    monthlyBonus: '£30',
    estimatedAnnual: '£360-600'
  },
  platinum: {
    minSavings: '30%',
    multiplier: '2.0x',
    monthlyBonus: '£60',
    estimatedAnnual: '£720-1,200'
  }
};
