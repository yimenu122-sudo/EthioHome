export const adminService = {
  getSystemStats: async (): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: 1250,
          activeListings: 450,
          pendingVerifications: 12,
          totalRevenue: 850000,
        });
      }, 500);
    });
  },

  toggleUserStatus: async (userId: string, active: boolean): Promise<void> => {
    return Promise.resolve();
  },

  deleteListing: async (propertyId: string): Promise<void> => {
    return Promise.resolve();
  }
};
