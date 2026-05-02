import { create } from 'zustand';
import { Booking, bookingService } from './bookingService';

interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  createBooking: (data: any) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  isLoading: false,

  createBooking: async (data) => {
    set({ isLoading: true });
    try {
      const newBooking = await bookingService.createBooking(data);
      set((state) => ({ 
        bookings: [...state.bookings, newBooking], 
        isLoading: false 
      }));
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
