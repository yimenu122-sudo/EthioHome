import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-background border border-border transition-colors text-sm font-semibold"
    >
      <Globe size={16} className="text-primary" />
      <span>{i18n.language === 'en' ? 'አማርኛ' : 'English'}</span>
    </button>
  );
};
