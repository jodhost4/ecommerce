import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiChevronDown, FiClock, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const contactInfo = [
  { icon: FiMail, title: 'Email Us', detail: 'support@commerce.com', sub: 'We reply within 24 hours' },
  { icon: FiPhone, title: 'Call Us', detail: '+1 (555) 123-4567', sub: 'Mon-Fri 9am-6pm EST' },
  { icon: FiMapPin, title: 'Visit Us', detail: '123 Commerce Street, Suite 100', sub: 'New York, NY 10001' },
];

const faqs = [
  { q: 'How quickly do you respond?', a: 'We typically respond to all inquiries within 24 hours during business days.' },
  { q: 'Do you offer phone support?', a: 'Yes, phone support is available for Business and Enterprise plans during business hours.' },
  { q: 'Can I schedule a demo?', a: 'Absolutely! Fill out the form and mention "demo" in the subject, and our team will reach out.' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">Have a question, feedback, or want to partner with us? We would love to hear from you.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors">
                  <info.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">{info.title}</h3>
                <p className="text-secondary-700 font-medium">{info.detail}</p>
                <p className="text-sm text-secondary-500 mt-1">{info.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Send Us a Message</h2>
                <p className="text-secondary-600">Fill out the form and our team will get back to you shortly.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="john@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">Subject</label>
                  <input type="text" name="subject" value={form.subject} onChange={handleChange} className="input-field" placeholder="How can we help?" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows="5" className="input-field resize-none" placeholder="Tell us more about your inquiry..." required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                  {loading ? 'Sending...' : <><FiSend className="mr-2" /> Send Message</>}
                </button>
              </form>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Quick Answers</h2>
                <p className="text-secondary-600">Find answers to commonly asked questions.</p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <motion.div key={i} variants={itemVariants} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-secondary-900">{faq.q}</span>
                      <FiChevronDown className={`w-5 h-5 text-secondary-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-secondary-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-primary-50 rounded-2xl border border-primary-100">
                <div className="flex items-start gap-4">
                  <FiMessageCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-secondary-900 mb-1">Need immediate help?</h3>
                    <p className="text-sm text-secondary-600">Our support team is available Monday through Friday, 9 AM to 6 PM EST.</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary-600 font-medium">
                      <FiClock className="w-4 h-4" /> Average response: &lt; 2 hours
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
