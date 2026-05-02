import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  Smartphone, 
  Mail, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';
import { normalizeIdentifier } from '../../utils/auth';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Form States
  const [formData, setFormData] = useState({
    identifier: '', // Phone or Email
    password: '',
    deliveryMethod: 'SMS' as 'SMS' | 'Email'
  });
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Phase 1: Credentials Verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) return;

    setIsLoading(true);
    setServerError(null);

    try {
      // Phase 1: Call login init
      const response: any = await api.post('/auth/login/init', {
        identifier: normalizeIdentifier(formData.identifier),
        password: formData.password.trim(),
        delivery_method: formData.deliveryMethod
      });

      if (response.success) {
        // Redirect to professional, dedicated Verify Page
        navigate('/auth/verify', { 
          state: { 
            identifier: normalizeIdentifier(formData.identifier),
            userId: response.data.userId, // Backend returns { data: { userId: ... } }
            type: '2fa'
          } 
        });
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      
      // Extract specific error message
      const rawMsg = (typeof error === 'string') 
        ? error 
        : (error.message || error.error || '');

      // Improve UX: Map generic backend messages to localized translations
      let finalMsg = rawMsg;
      if (rawMsg === 'Invalid credentials') {
        finalMsg = t('auth.errors.invalid_credentials');
      } else if (rawMsg === 'Network Error' || !rawMsg) {
        finalMsg = t('auth.errors.request_failed');
      }

      setServerError(finalMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 p-2 overflow-hidden">
              <img src={logo} alt="EthioHome Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
          </Link>
        </div>

        {/* Translation Switcher Mini */}
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-50 relative overflow-hidden">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">{t('auth.login_title')}</h2>
              <p className="text-slate-500 text-sm font-medium">{t('auth.login_subtitle') || 'Enter your details to access your dashboard'}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {serverError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} />
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">{t('auth.identifier_label') || 'Phone or Email'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    name="identifier"
                    placeholder={t('auth.placeholders.identifier') || '09xx xxx xxx / name@email.com'}
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('auth.password')}</label>
                  <Link to="/auth/forgot-password" className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline">
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">{t('auth.otp_delivery_method') || 'Send OTP via'}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'SMS' }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                      formData.deliveryMethod === 'SMS' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-100 bg-white text-slate-400 grayscale'
                    }`}
                  >
                    <Smartphone size={18} />
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'Email' }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                      formData.deliveryMethod === 'Email' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-100 bg-white text-slate-400 grayscale'
                    }`}
                  >
                    <Mail size={18} />
                    Email
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {t('auth.continue') || 'Continue'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-slate-500 text-sm font-medium">
              {t('auth.no_account')} {' '}
              <Link to="/auth/register" className="text-primary font-bold hover:underline">
                {t('auth.register_now') || 'Register Now'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default Login;
