export const paymentService = {
  processPayment: async (data: any): Promise<{ success: boolean; transactionId: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'TX-' + Math.random().toString(36).toUpperCase().substr(2, 9)
        });
      }, 2000);
    });
  },

  verifyPayment: async (txId: string): Promise<boolean> => {
    return Promise.resolve(true);
  }
};
