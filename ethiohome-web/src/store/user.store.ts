import { create } from 'zustand';

interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
}

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updatedProfile) => 
    set((state) => ({ 
      profile: state.profile ? { ...state.profile, ...updatedProfile } : null 
    })),
  clearProfile: () => set({ profile: null }),
}));
