import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. Added import

const RootLayout = () => {
  const { t } = useTranslation(); // 2. Initialized 't' function

  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-primary selection:text-white">
      <Outlet />
      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50 relative z-10 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-slate-400 font-medium text-xs">
              &copy; {new Date().getFullYear()} {t('common.thome')}. {t('common.all_rights_reserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
