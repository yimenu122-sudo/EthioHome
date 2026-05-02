import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Key, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Globe,
  LogIn,
  Menu,
  X,
  CreditCard,
  Target,
  Zap,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import logo from '../assets/images/logo.png';

// === Navbar Component ===
const LandingNavbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  const currentLang = i18n.language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማርኛ';

  const menuItems = [
    { label: t('common.home'), path: '/' },
    { label: t('landing.view_renting'), path: '/renter/home' },
    { label: t('landing.view_selling'), path: '/buyer/home' },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-12 py-4 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl overflow-hidden p-1.5">
              <img src={logo} alt="EthioHome Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900">
              {t('common.thome')}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) => (
              <button 
                key={item.path}
                onClick={() => navigate(item.path)}
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
            >
              <Globe size={16} className="text-primary" />
              <span>{currentLang}</span>
            </button>
            {isAuthenticated ? (
               <button 
               onClick={() => logout()}
               className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all"
             >
               {t('common.logout')}
             </button>
            ) : (
              <button 
                onClick={() => navigate('/auth/login')}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                <LogIn size={18} />
                {t('common.login')}
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-900" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden p-1 text-white">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-black">{t('common.thome')}</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="flex-1 p-8 space-y-6">
              {menuItems.map((item) => (
                <button 
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left text-2xl font-black text-slate-900"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-6 border-t">
                 <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-3 text-xl font-bold text-slate-600 mb-8"
                >
                  <Globe size={24} className="text-primary" />
                  {currentLang}
                </button>
                {isAuthenticated ? (
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xl">
                    {t('common.logout')}
                  </button>
                ) : (
                  <button onClick={() => { navigate('/auth/login'); setIsMobileMenuOpen(false); }} className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl shadow-xl shadow-primary/20">
                    {t('common.login')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  const yScrollTranslate = useTransform(scrollY, [0, 800], [0, 150]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    { 
      icon: <ShieldCheck className="text-blue-500" />, 
      title: t('landing.why_choose.feature1_title'), 
      desc: t('landing.why_choose.feature1_desc'),
      items: t('landing.why_choose.feature1_items', { returnObjects: true }) as string[]
    },
    { 
      icon: <Lock className="text-emerald-500" />, 
      title: t('landing.why_choose.feature2_title'), 
      desc: t('landing.why_choose.feature2_desc'),
      items: t('landing.why_choose.feature2_items', { returnObjects: true }) as string[]
    },
    { 
      icon: <MapPin className="text-amber-500" />, 
      title: t('landing.why_choose.feature3_title'), 
      desc: t('landing.why_choose.feature3_desc'),
      cities: t('landing.why_choose.feature3_cities')
    },
    { 
      icon: <Globe className="text-indigo-500" />, 
      title: t('landing.why_choose.feature4_title'), 
      desc: t('landing.why_choose.feature4_desc'),
      items: t('landing.why_choose.feature4_items', { returnObjects: true }) as string[]
    },
    { 
      icon: <Zap className="text-rose-500" />, 
      title: t('landing.why_choose.feature5_title'), 
      desc: t('landing.why_choose.feature5_desc'),
      items: t('landing.why_choose.feature5_items', { returnObjects: true }) as string[]
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#fafbfc] selection:bg-primary selection:text-white font-sans overflow-x-hidden">
      <LandingNavbar />

      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-12 pt-16 md:pt-32 pb-20 overflow-hidden">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              
              {/* Left Side: Content */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-3xl mx-auto lg:mx-0 text-center lg:text-left"
              >
                <motion.div 
                  variants={itemVariants}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary">
                    {t('common.welcome')}
                  </span>
                </motion.div>

                <motion.h1 
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight text-slate-900"
                >
                  <Trans 
                    i18nKey="landing.hero_title"
                    components={{
                      highlight: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-secondary" />
                    }}
                  />
                </motion.h1>

                <motion.p 
                  variants={itemVariants}
                  className="text-lg md:text-xl lg:text-2xl text-slate-600 mb-10 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0"
                >
                  {t('landing.hero_subtitle')}
                </motion.p>

                <motion.div 
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start"
                >
                  <button 
                    onClick={() => navigate('/renter/home')}
                    className="group relative px-8 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02] shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Key size={22} className="text-secondary" />
                      {t('landing.view_renting')}
                      <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/buyer/home')}
                    className="group px-8 py-5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-lg text-slate-900 hover:border-primary transition-all shadow-sm hover:shadow-lg flex items-center justify-center gap-3"
                  >
                    <Building2 size={22} className="text-slate-400 group-hover:text-primary" />
                    {t('landing.view_selling')}
                  </button>
                </motion.div> 
              </motion.div>

              {/* Right Side: Visuals (Responsive) */}
              <div className="relative hidden lg:block h-[600px] w-full">
                <motion.div 
                  style={{ y: yScrollTranslate, opacity: opacityFade }}
                  className="absolute inset-0 z-10"
                >
                  <div className="relative w-full h-full">
                    {/* Main Image Card */}
                    <div className="absolute top-0 right-0 w-4/5 h-4/5 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-200 rotate-2">
                       <img 
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" 
                        className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
                        alt="Modern Villa"
                       />
                       <div className="absolute bottom-10 left-10 text-white drop-shadow-lg">
                          <div className="flex items-center gap-2 mb-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 w-max">
                            <MapPin size={14} className="text-secondary" />
                            <span className="text-[10px] font-black uppercase">Addis Ababa</span>
                          </div>
                          <div className="text-4xl font-black">Modern Luxury</div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE ETHIOHOME SECTION */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
                {t('landing.why_choose.title')}
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                {t('landing.why_choose.subtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all group ${
                    idx === 3 || idx === 4 ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 mb-6 font-medium leading-relaxed">{feature.desc}</p>
                  
                  {feature.items && (
                    <ul className="space-y-3">
                      {(feature.items as string[]).map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <ArrowRight size={12} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {feature.cities && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {feature.cities.split(',').map((city, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100 italic">
                          {city.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
