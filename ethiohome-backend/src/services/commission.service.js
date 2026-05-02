/**
 * @file commission.service.js
 * @description Calculation and distribution of agent/platform fees
 */

const Commission = require('../models/commission.model');

class CommissionService {
  constructor() {
    this.defaultRate = 0.05; // 5% default
  }

  /**
   * Calculate and record commission for a transaction
   * Rent = 9%, Sale = 2%
   */
  async applyCommission(transactionId, bookingId, ownerId, agentId, amount, listingType) {
    if (!agentId) return null;

    let rate = 0.05; // Fallback
    if (listingType === 'Rent') rate = 0.09;
    if (listingType === 'Sale') rate = 0.02;

    const commissionAmount = amount * rate;

    return await Commission.create({
      transaction_id: transactionId,
      booking_id: bookingId,
      owner_id: ownerId,
      agent_id: agentId,
      amount: commissionAmount,
      commission_status: 'Pending'
    });
  }

  async getAgentCommissions(agentId) {
    return await Commission.findAll({ where: { agent_id: agentId } });
  }

  async updateRate(newRate) {
    this.defaultRate = newRate;
    return this.defaultRate;
  }
}

module.exports = new CommissionService();
