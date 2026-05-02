import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Smartphone, 
  Mail, 
  Contact, 
  Lock, 
  User, 
  Globe, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';
import { normalizeIdentifier } from '../../utils/auth';

const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    national_id: '',
    preferred_language: i18n.language === 'am' ? 'Amharic' : 'English',
    password: '',
    confirm_password: ''
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time Validation State
  const [validation, setValidation] = useState({
    first_name: false,
    last_name: false,
    phone_number: false,
    email: true, // Optional
    national_id: false,
    password: {
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
      total: false
    },
    confirm_password: false
  });

  // Strength Meter
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Regex Patterns
  const nameRegex = /^[A-Za-z\u1200-\u137F ]{2,100}$/;
  const phoneRegex = /^(\+251|0)(9|7)\d{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nationalIdRegex = /^[A-Za-z0-9]{8,12}$/;
  const passRegex = {
    length: /.{8,}/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /\d/,
    special: /[@$!%*?&]/
  };

  // Sync preferred_language with i18n
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      preferred_language: i18n.language === 'am' ? 'Amharic' : 'English'
    }));
  }, [i18n.language]);

  // Handle Validation Logic
  useEffect(() => {
    const pass = formData.password;
    const vPass = {
      length: passRegex.length.test(pass),
      upper: passRegex.upper.test(pass),
      lower: passRegex.lower.test(pass),
      number: passRegex.number.test(pass),
      special: passRegex.special.test(pass),
      total: false
    };
    vPass.total = vPass.length && vPass.upper && vPass.lower && vPass.number && vPass.special;

    // Calculate Strength
    let strength = 0;
    if (vPass.length) strength += 20;
    if (vPass.upper) strength += 20;
    if (vPass.lower) strength += 20;
    if (vPass.number) strength += 20;
    if (vPass.special) strength += 20;
    setPasswordStrength(strength);

    setValidation({
      first_name: nameRegex.test(formData.first_name),
      last_name: nameRegex.test(formData.last_name),
      phone_number: phoneRegex.test(formData.phone_number.replace(/\s/g, '')),
      email: formData.email ? emailRegex.test(formData.email) : true,
      national_id: nationalIdRegex.test(formData.national_id),
      password: vPass,
      confirm_password: formData.confirm_password !== '' && formData.confirm_password === formData.password
    });
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-format phone number
    if (name === 'phone_number') {
      let val = value.replace(/[^\d+]/g, '');
      
      // Auto-prefix with +251 if it starts with 09 or 07
      if (val.startsWith('09') || val.startsWith('07')) {
        val = '+251' + val.substring(1);
      } else if (val.startsWith('9') || val.startsWith('7')) {
        val = '+251' + val;
      }

      // Limit length to +251 912345678 (13 chars)
      if (val.length > 13) val = val.substring(0, 13);
      
      setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Final check
    const isFormValid = 
      validation.first_name && 
      validation.last_name && 
      validation.phone_number && 
      validation.email && 
      validation.national_id && 
      validation.password.total && 
      validation.confirm_password;

    if (!isFormValid) {
      setTouched({
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        national_id: true,
        password: true,
        confirm_password: true
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number.trim().replace(/\s/g, ''),
        email: formData.email ? normalizeIdentifier(formData.email) : null,
        national_id: formData.national_id.trim(),
        password: formData.password.trim(),
        role: 'Owner'
      };

      // Corrected: use standardized api service
      const response: any = await api.post('/auth/register', payload);
      
      if (response.success) {
        // Redirect to Verification
        navigate('/auth/verify', { 
          state: { 
            phone: formData.phone_number,
            identifier: normalizeIdentifier(formData.email || formData.phone_number),
            type: 'registration',
            userId: response.data.id // Backend returns data.id
          } 
        });
      }
    } catch (error: any) {
      console.error('Registration Error:', error);
      
      const rawMsg = (typeof error === 'string') 
        ? error 
        : (error.message || error.error || '');

      let finalMsg = rawMsg;
      if (rawMsg === 'Network Error' || !rawMsg) {
        finalMsg = t('auth.errors.request_failed');
      }

      setServerError(finalMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (field: string, isValid: boolean) => {
    const base = "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 outline-none ";
    if (!touched[field]) return base + "border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10";
    return isValid 
      ? base + "border-green-500 bg-green-50/30 focus:ring-4 focus:ring-green-500/10"
      : base + "border-red-500 bg-red-50/30 focus:ring-4 focus:ring-red-500/10";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 p-2 overflow-hidden">
              <img src={logo} alt="EthioHome Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {t('auth.register_owner_title')}
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            {t('auth.register_owner_subtitle')}
          </p>
        </div>

        {/* Translation Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-10 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Server Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
                >
                  <AlertCircle size={20} />
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.first_name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('first_name')}
                    placeholder={t('auth.placeholders.first_name')}
                    className={getInputClass('first_name', validation.first_name)}
                  />
                  {touched.first_name && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.first_name ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                    </span>
                  )}
                </div>
                {touched.first_name && !validation.first_name && (
                  <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.first_name_invalid')}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.last_name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('last_name')}
                    placeholder={t('auth.placeholders.last_name')}
                    className={getInputClass('last_name', validation.last_name)}
                  />
                  {touched.last_name && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.last_name ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                    </span>
                  )}
                </div>
                {touched.last_name && !validation.last_name && (
                  <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.last_name_invalid')}</p>
                )}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                {t('auth.phone_number')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  <Smartphone size={18} />
                </span>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('phone_number')}
                  placeholder={t('auth.placeholders.phone_number')}
                  className={getInputClass('phone_number', validation.phone_number)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hidden sm:block">Ethiopia</span>
                  {touched.phone_number && (
                    validation.phone_number ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 ml-1 italic">Supports Ethio Telecom & Safaricom</p>
              {touched.phone_number && !validation.phone_number && (
                <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.phone_invalid')}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                {t('auth.email')} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  placeholder={t('auth.placeholders.email')}
                  className={getInputClass('email', validation.email)}
                />
                {formData.email && touched.email && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validation.email ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                  </span>
                )}
              </div>
              {touched.email && !validation.email && formData.email && (
                <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.email_invalid')}</p>
              )}
            </div>

            {/* National ID & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.national_id')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Contact size={18} />
                  </span>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('national_id')}
                    placeholder={t('auth.placeholders.national_id')}
                    maxLength={12}
                    className={getInputClass('national_id', validation.national_id)}
                  />
                  {touched.national_id && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.national_id ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                    </span>
                  )}
                </div>
                {touched.national_id && !validation.national_id && (
                  <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.national_id_invalid')}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.preferred_language')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Globe size={18} />
                  </span>
                  <select
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                  >
                    <option value="English">English 🇬🇧</option>
                    <option value="Amharic">አማርኛ 🇪🇹</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ArrowRight size={16} className="rotate-90" />
                  </span>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    className={getInputClass('password', validation.password.total)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Strength Meter */}
                <div className="mt-3 px-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div 
                          key={lvl}
                          className={`h-1 w-8 rounded-full transition-all duration-300 ${
                            passwordStrength >= lvl * 20 
                              ? (passwordStrength <= 40 ? 'bg-red-500' : passwordStrength <= 80 ? 'bg-yellow-500' : 'bg-green-500') 
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      passwordStrength <= 40 ? 'text-red-500' : passwordStrength <= 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength <= 40 ? 'Weak' : passwordStrength <= 80 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  
                  {/* Password Checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                    <CheckItem label={t('auth.password_requirements.min_chars')} met={validation.password.length} />
                    <CheckItem label={t('auth.password_requirements.uppercase')} met={validation.password.upper} />
                    <CheckItem label={t('auth.password_requirements.lowercase')} met={validation.password.lower} />
                    <CheckItem label={t('auth.password_requirements.number')} met={validation.password.number} />
                    <CheckItem label={t('auth.password_requirements.special')} met={validation.password.special} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {t('auth.confirm_password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('confirm_password')}
                    placeholder="••••••••"
                    className={getInputClass('confirm_password', validation.confirm_password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.confirm_password && !validation.confirm_password && formData.confirm_password && (
                  <p className="text-xs text-red-500 ml-1 font-medium">{t('auth.errors.password_mismatch')}</p>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                isLoading 
                  ? 'bg-primary/70 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark shadow-primary/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('auth.creating_account')}
                </>
              ) : (
                <>
                  {t('auth.create_account')}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Login Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {t('auth.has_account')}{' '}
              <Link to="/auth/login" className="text-primary font-bold hover:underline">
                {t('common.login')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface CheckItemProps {
  label: string;
  met: boolean;
}

const CheckItem: React.FC<CheckItemProps> = ({ label, met }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${met ? 'bg-green-500' : 'bg-slate-200'}`}>
      {met ? <Check size={8} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 bg-white rounded-full" />}
    </div>
    <span className={`text-[10px] font-semibold leading-none ${met ? 'text-slate-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);

export default Register;
