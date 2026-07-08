import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiChevronLeft, FiClock, FiMessageSquare } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Contact() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    api.get(`/stores/${storeId}`)
      .then(res => setStore(res.data.data))
      .catch(err => console.error('Store fetch error:', err))
      .finally(() => setLoading(false));
  }, [storeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Simulate API call for contact form
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Your message has been sent successfully!');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white min-h-screen">
      {/* Header section */}
      <section className="bg-secondary-900 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl -ml-32 -mb-32" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <Link to={`/store/${storeId}/home`} className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-6 transition-colors">
            <FiChevronLeft className="mr-2" /> Back to Store
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-secondary-300 max-w-2xl mx-auto"
          >
            Have a question or feedback? We'd love to hear from you. Our team typically responds within 24 hours.
          </motion.p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Contact Information */}
            <div className="lg:col-span-4 space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-8 flex items-center">
                  <FiMessageSquare className="mr-3 text-primary-600" /> Contact Info
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FiMail className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Email Support</p>
                      <p className="text-lg font-medium text-secondary-900">{store?.supportEmail || 'support@' + (store?.slug || 'store') + '.com'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FiPhone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Call Us</p>
                      <p className="text-lg font-medium text-secondary-900">{store?.supportPhone || '+1 (555) 000-0000'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-lg font-medium text-secondary-900 leading-relaxed">{store?.address || 'Available Online Excellence'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Working Hours</p>
                      <p className="text-lg font-medium text-secondary-900">Mon - Fri: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-secondary-100 shadow-xl shadow-secondary-100/50">
                <h3 className="text-2xl font-bold text-secondary-900 mb-8">Send us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="input-field py-3"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="input-field py-3"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                      className="input-field py-3"
                      placeholder="What is this about?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">Your Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      className="input-field py-3"
                      rows={6}
                      placeholder="Tell us everything..."
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={sending} 
                    className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center space-x-3 rounded-2xl shadow-lg shadow-primary-500/20"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
