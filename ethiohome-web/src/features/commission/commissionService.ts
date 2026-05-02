export const commissionService = {
  calculateCommission: (price: number, role: 'agent' | 'admin'): number => {
    const rate = role === 'agent' ? 0.02 : 0.05; // 2% for agents, 5% system fee
    return price * rate;
  },

  getCommissionHistory: async (userId: string): Promise<any[]> => {
    return Promise.resolve([]);
  }
};
