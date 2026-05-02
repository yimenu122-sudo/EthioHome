export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export const bookingService = {
  createBooking: async (bookingData: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...bookingData,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending'
        });
      }, 1000);
    });
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    return Promise.resolve([]);
  }
};
