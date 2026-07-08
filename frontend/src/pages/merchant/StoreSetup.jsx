import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiChevronLeft, FiChevronRight, FiShoppingBag, FiGrid, FiEye, FiSettings, FiSmile, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CURRENCIES, LANGUAGES, STORE_CATEGORIES, THEME_PRESETS } from '../../utils/constants';

const steps = [
  { id: 1, name: 'Create Store', icon: FiShoppingBag },
  { id: 2, name: 'Category', icon: FiGrid },
  { id: 3, name: 'Theme', icon: FiEye },
  { id: 4, name: 'Details', icon: FiSettings },
  { id: 5, name: 'Done', icon: FiSmile },
];

const initialForm = {
  name: '',
  slug: '',
  description: '',
  email: '',
  businessCategory: '',
  theme: 'light',
  logo: '',
  banner: '',
  currency: 'USD',
  language: 'en',
  timezone: 'UTC',
};

export default function StoreSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validateStep(step) {
    const errs = {};
    if (step === 1) {
      if (!form.name.trim()) errs.name = 'Store name is required';
      if (!form.email.trim()) errs.email = 'Store email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    }
    if (step === 2) {
      if (!form.businessCategory) errs.businessCategory = 'Please select a category';
    }
    if (step === 3) {
      if (!form.theme) errs.theme = 'Please select a theme';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function checkSlug(slug) {
    if (!slug.trim()) return;
    setSlugChecking(true);
    setSlugAvailable(null);
    try {
      const { data } = await api.get('/stores/check-slug', { params: { slug } });
      setSlugAvailable(data.data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }

  function handleSlugChange(value) {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    updateField('slug', slug);
    if (slug.length >= 3) {
      const timer = setTimeout(() => checkSlug(slug), 500);
      return () => clearTimeout(timer);
    }
    setSlugAvailable(null);
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post('/stores', form);
      setCurrentStep(5);
      toast.success('Store created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create store');
      setCurrentStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-secondary-900 mb-8 text-center">
        Set Up Your Store
      </motion.h1>

      <div className="flex items-center justify-center mb-10">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: currentStep >= step.id ? 1 : 0.9 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep > step.id ? 'bg-green-500 text-white' :
                  currentStep === step.id ? 'bg-primary-600 text-white' :
                  'bg-secondary-200 text-secondary-500'
                }`}
              >
                {currentStep > step.id ? <FiCheck className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </motion.div>
              <span className={`text-xs mt-1.5 font-medium ${currentStep >= step.id ? 'text-primary-600' : 'text-secondary-400'}`}>{step.name}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 md:w-24 h-1 mx-2 rounded-full ${currentStep > step.id ? 'bg-green-500' : 'bg-secondary-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {currentStep === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Create Your Store</h2>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Store Name *</label>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`} placeholder="My Awesome Store" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Store URL</label>
                  <div className="flex items-center border border-secondary-300 rounded-lg overflow-hidden focus-within:border-primary-500 transition-colors">
                    <span className="px-3 py-2 bg-secondary-50 text-secondary-500 text-sm border-r border-secondary-300 whitespace-nowrap">
                      {window.location.origin}/store/
                    </span>
                    <input type="text" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} className="flex-1 px-3 py-2 outline-none text-secondary-900" placeholder="my-store" />
                  </div>
                  {slugChecking && <p className="text-blue-500 text-xs mt-1">Checking availability...</p>}
                  {slugAvailable === true && <p className="text-green-500 text-xs mt-1 flex items-center"><FiCheck className="w-3 h-3 mr-1" /> Available!</p>}
                  {slugAvailable === false && <p className="text-red-500 text-xs mt-1">This URL is already taken</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className="input-field w-full resize-none" placeholder="Tell customers about your store..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Store Email *</label>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={`input-field w-full ${errors.email ? 'border-red-500' : ''}`} placeholder="store@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Choose Business Category</h2>
                <p className="text-sm text-secondary-500 mb-4">Select the category that best describes your business.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {STORE_CATEGORIES.map((cat) => (
                    <motion.button
                      key={cat}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateField('businessCategory', cat)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.businessCategory === cat
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-secondary-200 hover:border-primary-200 hover:bg-secondary-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg mb-2 flex items-center justify-center ${form.businessCategory === cat ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-500'}`}>
                        <FiGrid className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-secondary-900">{cat}</p>
                    </motion.button>
                  ))}
                </div>
                {errors.businessCategory && <p className="text-red-500 text-xs mt-1">{errors.businessCategory}</p>}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Choose a Theme</h2>
                <p className="text-sm text-secondary-500 mb-4">Pick a starting theme for your store. You can customize it later.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {THEME_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateField('theme', preset.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        form.theme === preset.id
                          ? 'border-primary-500 ring-2 ring-primary-100'
                          : 'border-secondary-200 hover:border-primary-200'
                      }`}
                    >
                      <div className="h-20 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: preset.colors.background }}>
                        <div className="space-y-1.5 w-3/4">
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: preset.colors.text + '40' }} />
                          <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: preset.colors.text + '30' }} />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-secondary-900 text-center">{preset.name}</p>
                      <div className="flex justify-center space-x-1 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.text }} />
                      </div>
                    </motion.button>
                  ))}
                </div>
                {errors.theme && <p className="text-red-500 text-xs mt-1">{errors.theme}</p>}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Business Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Logo URL</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" value={form.logo} onChange={(e) => updateField('logo', e.target.value)} className="input-field flex-1" placeholder="https://..." />
                      <div className="w-12 h-12 rounded-lg border border-secondary-200 flex items-center justify-center overflow-hidden bg-secondary-50 flex-shrink-0">
                        {form.logo ? <img src={form.logo} alt="" className="w-full h-full object-cover" /> : <FiUpload className="w-5 h-5 text-secondary-400" />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Banner URL</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" value={form.banner} onChange={(e) => updateField('banner', e.target.value)} className="input-field flex-1" placeholder="https://..." />
                      <div className="w-12 h-12 rounded-lg border border-secondary-200 flex items-center justify-center overflow-hidden bg-secondary-50 flex-shrink-0">
                        {form.banner ? <img src={form.banner} alt="" className="w-full h-full object-cover" /> : <FiUpload className="w-5 h-5 text-secondary-400" />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Currency</label>
                    <select value={form.currency} onChange={(e) => updateField('currency', e.target.value)} className="input-field w-full">
                      {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Language</label>
                    <select value={form.language} onChange={(e) => updateField('language', e.target.value)} className="input-field w-full">
                      {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Timezone</label>
                    <select value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} className="input-field w-full md:w-64">
                      {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'].map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheck className="w-10 h-10 text-green-600" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Store Created!</h2>
                <p className="text-secondary-500 mb-6">Your store "{form.name}" has been set up successfully.</p>
                <div className="flex items-center justify-center space-x-4">
                  <button onClick={() => navigate('/merchant')} className="btn-primary px-6 py-2">Go to Dashboard</button>
                  <button onClick={() => navigate('/merchant/products')} className="btn-secondary px-6 py-2">Add Products</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {currentStep < 5 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-secondary-200">
            <button
              onClick={currentStep === 1 ? () => navigate('/merchant') : prevStep}
              className="flex items-center space-x-2 px-4 py-2 text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
            </button>

            {currentStep < 4 ? (
              <button onClick={nextStep} className="btn-primary flex items-center space-x-2 px-6 py-2 rounded-lg">
                <span>Next</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center space-x-2 px-6 py-2 rounded-lg disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Store'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
