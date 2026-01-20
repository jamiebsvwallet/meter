/**
 * Utility Bill Payment API Routes
 * Pay water/electricity bills + BSV micropayments
 * 
 * Copyright © 2026 - All Rights Reserved
 * Created: January 20, 2026
 */

import { Router, Request, Response } from 'express';
import { UtilityBillPaymentService, UtilityType, PaymentMethod, BillStatus } from '../services/utility-payments.js';

const router = Router();

// ==================== Bill Generation ====================

/**
 * POST /api/bills/generate
 * Generate utility bill based on usage
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      propertyId, 
      utilityType, 
      consumption, 
      billingPeriod,
      previousReading,
      currentReading
    } = req.body;

    const bill = UtilityBillPaymentService.generateBill(
      userId,
      propertyId,
      utilityType as UtilityType,
      consumption,
      billingPeriod,
      previousReading,
      currentReading
    );

    res.json({
      success: true,
      bill,
      message: `${utilityType} bill generated: £${bill.charges.total}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Bill Payment ====================

/**
 * POST /api/bills/pay
 * Pay utility bill with multiple payment methods
 */
router.post('/pay', async (req: Request, res: Response) => {
  try {
    const { billId, paymentMethod, paymentDetails } = req.body;

    const transaction = await UtilityBillPaymentService.payBill(
      billId,
      paymentMethod as PaymentMethod,
      paymentDetails
    );

    res.json({
      success: true,
      transaction,
      message: `Bill paid successfully! ${transaction.rewardsEarned ? `Earned £${transaction.rewardsEarned} in rewards!` : ''}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bills/split-payment
 * Split payment across multiple methods
 */
router.post('/split-payment', async (req: Request, res: Response) => {
  try {
    const { billId, splits } = req.body;

    const transactions = await UtilityBillPaymentService.splitPayment(billId, splits);

    res.json({
      success: true,
      transactions,
      message: 'Bill paid with split payment methods'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Get Bills ====================

/**
 * GET /api/bills/user/:userId
 * Get user's bills
 */
router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { utilityType, status, startDate, endDate } = req.query;

    const filters: any = {};
    if (utilityType) filters.utilityType = utilityType as UtilityType;
    if (status) filters.status = status as BillStatus;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const bills = UtilityBillPaymentService.getUserBills(userId, filters);

    res.json({
      success: true,
      bills,
      total: bills.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bills/payment-history/:userId
 * Get payment history
 */
router.get('/payment-history/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const history = UtilityBillPaymentService.getPaymentHistory(userId);

    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Auto-Pay ====================

/**
 * POST /api/bills/auto-pay/setup
 * Setup auto-pay
 */
router.post('/auto-pay/setup', (req: Request, res: Response) => {
  try {
    const config = req.body;
    UtilityBillPaymentService.setupAutoPay(config);

    res.json({
      success: true,
      message: 'Auto-pay configured successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bills/auto-pay/process/:userId
 * Process auto-pay for user
 */
router.post('/auto-pay/process/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const transactions = await UtilityBillPaymentService.processAutoPay(userId);

    res.json({
      success: true,
      transactions,
      billsPaid: transactions.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Savings Stats ====================

/**
 * GET /api/bills/savings/:userId
 * Get total savings from conservation
 */
router.get('/savings/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const savings = UtilityBillPaymentService.getTotalSavings(userId);

    res.json({
      success: true,
      savings,
      message: `You've saved £${savings.combinedSavings} through conservation!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
