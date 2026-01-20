/**
 * Consumer Rewards API Routes
 * Rewards program for water conservation
 * 
 * Copyright © 2026 - All Rights Reserved
 * Created: January 20, 2026
 */

import { Router, Request, Response } from 'express';
import { ConsumerRewardsService } from '../services/consumer-rewards.js';

const router = Router();

// ==================== Consumer Registration ====================

/**
 * POST /api/rewards/register
 * Register consumer for rewards program
 */
router.post('/register', (req: Request, res: Response) => {
  try {
    const { userId, propertyId, bsvWalletAddress, baselineUsage } = req.body;
    
    const account = ConsumerRewardsService.registerConsumer(
      userId,
      propertyId,
      bsvWalletAddress,
      baselineUsage
    );
    
    res.json({
      success: true,
      account,
      message: 'Welcome to the Water Rewards Program! Start saving water to earn credits and cash.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Daily Usage Processing ====================

/**
 * POST /api/rewards/process-usage
 * Process daily water usage and calculate rewards
 */
router.post('/process-usage', (req: Request, res: Response) => {
  try {
    const { userId, dailyUsageLiters } = req.body;
    
    const result = ConsumerRewardsService.processDailyUsage(userId, dailyUsageLiters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Consumer Dashboard ====================

/**
 * GET /api/rewards/stats/:userId
 * Get consumer dashboard stats
 */
router.get('/stats/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const stats = ConsumerRewardsService.getConsumerStats(userId);
    const carbon = ConsumerRewardsService.getCarbonOffset(userId);
    
    res.json({
      ...stats,
      environmentalImpact: carbon
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Payouts ====================

/**
 * POST /api/rewards/payout/:userId
 * Process monthly payout
 */
router.post('/payout/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const payout = await ConsumerRewardsService.processMonthlyPayout(userId);
    
    res.json({
      success: true,
      payout,
      message: `Payment of £${payout.amount} sent to your BSV wallet!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Credit Trading ====================

/**
 * POST /api/rewards/sell-credits
 * Sell water credits to marketplace
 */
router.post('/sell-credits', (req: Request, res: Response) => {
  try {
    const { userId, creditsToSell } = req.body;
    
    const result = ConsumerRewardsService.sellCreditsToMarketplace(userId, creditsToSell);
    
    res.json({
      success: true,
      ...result,
      message: `Sold ${result.creditsSold} credits for £${result.saleValue}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Conservation Challenges ====================

/**
 * POST /api/rewards/challenge/create
 * Create conservation challenge
 */
router.post('/challenge/create', (req: Request, res: Response) => {
  try {
    const { name, targetSavings, durationDays, rewardAmount } = req.body;
    
    const challenge = ConsumerRewardsService.createChallenge(
      name,
      targetSavings,
      durationDays,
      rewardAmount
    );
    
    res.json({
      success: true,
      challenge
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
