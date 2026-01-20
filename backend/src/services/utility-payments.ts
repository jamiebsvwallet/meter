/**
 * Utility Bill Payment System
 * Pay water and electricity bills with BSV + Earn rewards
 * 
 * Copyright © 2026 - All Rights Reserved
 * Created: January 20, 2026
 */

import crypto from 'crypto';

/**
 * Utility Types
 */
export enum UtilityType {
  WATER = 'water',
  ELECTRICITY = 'electricity',
  GAS = 'gas',
  COMBINED = 'combined'
}

/**
 * Payment Method
 */
export enum PaymentMethod {
  BSV = 'bsv',              // BSV cryptocurrency
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  WATER_CREDITS = 'water_credits' // Pay with earned credits!
}

/**
 * Bill Status
 */
export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  DISPUTED = 'disputed'
}

/**
 * Utility Bill
 */
interface UtilityBill {
  billId: string;
  userId: string;
  propertyId: string;
  utilityType: UtilityType;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  
  // Usage details
  consumption: {
    amount: number;           // liters or kWh
    unit: string;
    meterReading: {
      previous: number;
      current: number;
    };
  };
  
  // Cost breakdown
  charges: {
    baseCharge: number;       // Standing charge (£)
    usageCharge: number;      // Consumption charge (£)
    taxes: number;
    discounts: number;        // Conservation rewards!
    total: number;
  };
  
  dueDate: Date;
  status: BillStatus;
  paidDate?: Date;
  paymentMethod?: PaymentMethod;
  bsvTxId?: string;
}

/**
 * Payment Transaction
 */
interface PaymentTransaction {
  txId: string;
  billId: string;
  userId: string;
  amount: number;             // £
  amountSatoshis?: number;    // If paid with BSV
  paymentMethod: PaymentMethod;
  timestamp: Date;
  bsvTxId?: string;
  status: 'pending' | 'completed' | 'failed';
  rewardsEarned?: number;     // Bonus for paying with BSV
}

/**
 * Auto-Pay Configuration
 */
interface AutoPayConfig {
  userId: string;
  propertyId: string;
  enabled: boolean;
  preferredMethod: PaymentMethod;
  maxAmount: number;          // Safety limit
  payFromCreditsFirst: boolean; // Use water credits first
  bsvWalletAddress?: string;
}

/**
 * Utility Bill Payment Service
 */
export class UtilityBillPaymentService {
  private static bills: Map<string, UtilityBill> = new Map();
  private static transactions: PaymentTransaction[] = [];
  private static autoPayConfigs: Map<string, AutoPayConfig> = new Map();

  /**
   * Generate utility bill based on usage
   */
  static generateBill(
    userId: string,
    propertyId: string,
    utilityType: UtilityType,
    consumption: number,
    billingPeriod: { startDate: Date; endDate: Date },
    previousReading: number,
    currentReading: number
  ): UtilityBill {
    const billId = `bill_${utilityType}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Calculate charges based on utility type
    let baseCharge = 0;
    let ratePerUnit = 0;
    let unit = '';

    if (utilityType === UtilityType.WATER) {
      baseCharge = 15.50;      // £15.50/month standing charge
      ratePerUnit = 0.0015;    // £0.0015 per liter (£1.50 per m³)
      unit = 'liters';
    } else if (utilityType === UtilityType.ELECTRICITY) {
      baseCharge = 25.00;      // £25/month standing charge
      ratePerUnit = 0.24;      // £0.24 per kWh
      unit = 'kWh';
    }

    const usageCharge = consumption * ratePerUnit;
    const taxes = (baseCharge + usageCharge) * 0.05; // 5% VAT
    
    // Apply conservation discount (from rewards program)
    const discount = this.calculateConservationDiscount(userId, utilityType, consumption);
    
    const total = baseCharge + usageCharge + taxes - discount;

    const bill: UtilityBill = {
      billId,
      userId,
      propertyId,
      utilityType,
      billingPeriod,
      consumption: {
        amount: consumption,
        unit,
        meterReading: {
          previous: previousReading,
          current: currentReading
        }
      },
      charges: {
        baseCharge,
        usageCharge: Math.round(usageCharge * 100) / 100,
        taxes: Math.round(taxes * 100) / 100,
        discounts: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100
      },
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: BillStatus.PENDING
    };

    this.bills.set(billId, bill);
    return bill;
  }

  /**
   * Pay utility bill
   */
  static async payBill(
    billId: string,
    paymentMethod: PaymentMethod,
    paymentDetails: {
      bsvWalletAddress?: string;
      cardToken?: string;
      useCreditsAmount?: number; // Pay with water credits
    }
  ): Promise<PaymentTransaction> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (bill.status === BillStatus.PAID) {
      throw new Error('Bill already paid');
    }

    let amountToPay = bill.charges.total;
    let amountSatoshis: number | undefined;
    let bsvTxId: string | undefined;
    let rewardsEarned = 0;

    // Option 1: Pay with water credits (convert credits to £)
    if (paymentMethod === PaymentMethod.WATER_CREDITS && paymentDetails.useCreditsAmount) {
      const creditValue = paymentDetails.useCreditsAmount * 0.05; // £0.05 per credit
      if (creditValue >= amountToPay) {
        amountToPay = 0;
        // Deduct credits from user's account
        console.log(`✓ Bill paid with ${paymentDetails.useCreditsAmount} water credits`);
      } else {
        throw new Error('Insufficient water credits');
      }
    }

    // Option 2: Pay with BSV (get 2% rewards!)
    else if (paymentMethod === PaymentMethod.BSV) {
      const bsvPrice = 50; // £50 per BSV (get from exchange API)
      const bsvAmount = amountToPay / bsvPrice;
      amountSatoshis = Math.round(bsvAmount * 100000000);

      // Process BSV payment
      bsvTxId = await this.processBSVPayment(
        paymentDetails.bsvWalletAddress!,
        amountSatoshis
      );

      // Bonus: Earn 2% back in water credits for paying with BSV
      rewardsEarned = amountToPay * 0.02;
      console.log(`💰 Earned £${rewardsEarned} in water credits for paying with BSV!`);
    }

    // Option 3: Traditional payment (card, bank transfer)
    else {
      // Process traditional payment
      console.log(`Processing ${paymentMethod} payment of £${amountToPay}`);
    }

    // Create transaction record
    const transaction: PaymentTransaction = {
      txId: `tx_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      billId,
      userId: bill.userId,
      amount: bill.charges.total,
      amountSatoshis,
      paymentMethod,
      timestamp: new Date(),
      bsvTxId,
      status: 'completed',
      rewardsEarned
    };

    this.transactions.push(transaction);

    // Update bill status
    bill.status = BillStatus.PAID;
    bill.paidDate = new Date();
    bill.paymentMethod = paymentMethod;
    bill.bsvTxId = bsvTxId;

    return transaction;
  }

  /**
   * Calculate conservation discount
   */
  private static calculateConservationDiscount(
    userId: string,
    utilityType: UtilityType,
    consumption: number
  ): number {
    // Get user's conservation tier from rewards program
    // Higher tier = bigger discount
    
    // Example: 10% savings = £5-10 discount on bill
    const baseDiscount = 5.0;
    
    // TODO: Integrate with ConsumerRewardsService
    return baseDiscount;
  }

  /**
   * Process BSV payment
   */
  private static async processBSVPayment(
    walletAddress: string,
    satoshis: number
  ): Promise<string> {
    // In production: Use HandCash/MoneyButton SDK
    // const tx = await handcash.pay(utilityProviderAddress, satoshis);
    // return tx.txid;
    
    console.log(`💳 Processing BSV payment: ${satoshis} sats to utility provider`);
    return `bsv_payment_${Date.now()}`;
  }

  /**
   * Setup auto-pay
   */
  static setupAutoPay(config: AutoPayConfig): void {
    this.autoPayConfigs.set(config.userId, config);
    console.log(`✓ Auto-pay enabled for user ${config.userId}`);
  }

  /**
   * Process auto-pay for due bills
   */
  static async processAutoPay(userId: string): Promise<PaymentTransaction[]> {
    const config = this.autoPayConfigs.get(userId);
    if (!config || !config.enabled) {
      return [];
    }

    // Find pending bills for user
    const userBills = Array.from(this.bills.values()).filter(
      bill => bill.userId === userId && bill.status === BillStatus.PENDING
    );

    const transactions: PaymentTransaction[] = [];

    for (const bill of userBills) {
      // Check due date
      if (new Date() >= new Date(bill.dueDate.getTime() - 3 * 24 * 60 * 60 * 1000)) { // 3 days before due
        
        // Safety check: Don't exceed max amount
        if (bill.charges.total > config.maxAmount) {
          console.log(`⚠️ Bill exceeds auto-pay limit: £${bill.charges.total} > £${config.maxAmount}`);
          continue;
        }

        try {
          const tx = await this.payBill(bill.billId, config.preferredMethod, {
            bsvWalletAddress: config.bsvWalletAddress,
            useCreditsAmount: config.payFromCreditsFirst ? 1000 : 0
          });
          transactions.push(tx);
          console.log(`✓ Auto-paid bill ${bill.billId}: £${bill.charges.total}`);
        } catch (error) {
          console.error(`❌ Auto-pay failed for bill ${bill.billId}:`, error);
        }
      }
    }

    return transactions;
  }

  /**
   * Get user's bills
   */
  static getUserBills(
    userId: string,
    filters?: {
      utilityType?: UtilityType;
      status?: BillStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): UtilityBill[] {
    let bills = Array.from(this.bills.values()).filter(b => b.userId === userId);

    if (filters) {
      if (filters.utilityType) {
        bills = bills.filter(b => b.utilityType === filters.utilityType);
      }
      if (filters.status) {
        bills = bills.filter(b => b.status === filters.status);
      }
      if (filters.startDate) {
        bills = bills.filter(b => b.billingPeriod.startDate >= filters.startDate!);
      }
      if (filters.endDate) {
        bills = bills.filter(b => b.billingPeriod.endDate <= filters.endDate!);
      }
    }

    return bills.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }

  /**
   * Get payment history
   */
  static getPaymentHistory(userId: string): PaymentTransaction[] {
    return this.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get total savings from conservation discounts
   */
  static getTotalSavings(userId: string): {
    totalDiscounts: number;
    totalRewards: number;
    combinedSavings: number;
  } {
    const userBills = Array.from(this.bills.values()).filter(b => b.userId === userId);
    const userTxs = this.transactions.filter(tx => tx.userId === userId);

    const totalDiscounts = userBills.reduce((sum, bill) => sum + bill.charges.discounts, 0);
    const totalRewards = userTxs.reduce((sum, tx) => sum + (tx.rewardsEarned || 0), 0);

    return {
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      totalRewards: Math.round(totalRewards * 100) / 100,
      combinedSavings: Math.round((totalDiscounts + totalRewards) * 100) / 100
    };
  }

  /**
   * Split bill payment (pay part with credits, part with BSV/card)
   */
  static async splitPayment(
    billId: string,
    splits: Array<{
      method: PaymentMethod;
      amount: number;
      details: any;
    }>
  ): Promise<PaymentTransaction[]> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - bill.charges.total) > 0.01) {
      throw new Error('Split amounts must equal bill total');
    }

    const transactions: PaymentTransaction[] = [];

    for (const split of splits) {
      // Process each payment method
      // This is simplified - in production, handle each separately
      console.log(`Processing ${split.method} payment of £${split.amount}`);
    }

    bill.status = BillStatus.PAID;
    bill.paidDate = new Date();

    return transactions;
  }
}

/**
 * Example usage scenarios
 */
export const billPaymentExamples = {
  // Scenario 1: Pay water bill with BSV (earn 2% back)
  payWithBSV: {
    billTotal: 45.50,
    paymentMethod: 'BSV',
    bsvAmount: '0.00091 BSV (91,000 sats)',
    rewardsEarned: '£0.91 in water credits',
    netCost: '£44.59'
  },

  // Scenario 2: Pay with earned water credits
  payWithCredits: {
    billTotal: 45.50,
    waterCredits: 910,
    creditValue: '£45.50',
    outOfPocket: '£0',
    message: 'Bill paid entirely with water savings!'
  },

  // Scenario 3: Split payment
  splitPayment: {
    billTotal: 75.00,
    waterCredits: 500,
    creditValue: '£25',
    bsvPayment: '£50',
    total: '£75',
    rewardsEarned: '£1 (2% back on BSV portion)'
  },

  // Scenario 4: Auto-pay with BSV
  autoPay: {
    enabled: true,
    preferredMethod: 'BSV',
    payFromCreditsFirst: true,
    maxAmount: 200,
    result: 'Bills automatically paid, credits used first, earn rewards monthly'
  }
};
