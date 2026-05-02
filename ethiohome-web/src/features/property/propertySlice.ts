import { create } from 'zustand';
import { Property, propertyService } from './propertyService';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,
  error: null,

  fetchProperties: async () => {
    set({ isLoading: true });
    try {
      const properties = await propertyService.getProperties();
      set({ properties, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPropertyById: async (id) => {
    set({ isLoading: true });
    try {
      const selectedProperty = await propertyService.getPropertyById(id);
      set({ selectedProperty: selectedProperty || null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
