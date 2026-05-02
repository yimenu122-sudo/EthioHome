import { create } from 'zustand';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  type: 'rent' | 'sale';
  beds: number;
  baths: number;
  area: number;
  featured?: boolean;
}

interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: 'rent' | 'sale';
  beds?: number;
}

interface PropertyState {
  listings: Property[];
  featuredListings: Property[];
  filters: PropertyFilters;
  setListings: (listings: Property[]) => void;
  setFilters: (filters: PropertyFilters) => void;
  resetFilters: () => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  listings: [],
  featuredListings: [],
  filters: {},
  setListings: (listings) => set({ 
    listings,
    featuredListings: listings.filter(p => p.featured)
  }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  resetFilters: () => set({ filters: {} }),
}));
