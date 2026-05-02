import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n/i18n';

interface LanguageState {
  language: 'en' | 'am';
  setLanguage: (language: 'en' | 'am') => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'ethiohome-language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
