import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiChevronDown, FiHelpCircle, FiBookOpen, FiCreditCard, FiServer, FiUser } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const categories = [
  { id: 'all', label: 'All Questions', icon: FiHelpCircle },
  { id: 'getting-started', label: 'Getting Started', icon: FiBookOpen },
  { id: 'pricing', label: 'Pricing', icon: FiCreditCard },
  { id: 'technical', label: 'Technical', icon: FiServer },
  { id: 'account', label: 'Account', icon: FiUser },
];

const faqs = [
  {
    category: 'getting-started',
    q: 'How do I create a store?',
    a: 'Sign up for a free account, choose a template, add your products, and you are ready to go. Our step-by-step wizard makes it easy.',
  },
  {
    category: 'getting-started',
    q: 'Do I need technical skills?',
    a: 'Not at all. Commerce is designed for non-technical users. Our drag-and-drop builder and pre-built templates handle everything.',
  },
  {
    category: 'getting-started',
    q: 'Can I import products from another platform?',
    a: 'Yes, we support CSV import and have direct migration tools for Shopify, WooCommerce, and BigCommerce.',
  },
  {
    category: 'getting-started',
    q: 'How long does it take to set up?',
    a: 'Most users launch their store within a day. Setting up basic products and a theme takes under an hour.',
  },
  {
    category: 'pricing',
    q: 'Is there a free trial?',
    a: 'Yes, all plans include a 14-day free trial with no credit card required. You can cancel anytime.',
  },
  {
    category: 'pricing',
    q: 'What happens when I exceed my plan limits?',
    a: 'We will notify you before you hit any limits. You can upgrade instantly without any downtime.',
  },
  {
    category: 'pricing',
    q: 'Are there any transaction fees?',
    a: 'No, Commerce does not charge any transaction fees. You only pay your payment processor\'s standard rates.',
  },
  {
    category: 'pricing',
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.',
  },
  {
    category: 'technical',
    q: 'Is my store mobile responsive?',
    a: 'All Commerce templates are fully responsive and optimized for mobile, tablet, and desktop devices.',
  },
  {
    category: 'technical',
    q: 'Can I use my own domain?',
    a: 'Yes, Business and Enterprise plans support custom domains with free SSL certificates included.',
  },
  {
    category: 'technical',
    q: 'How secure is your platform?',
    a: 'We use 256-bit SSL encryption, are PCI-DSS Level 1 compliant, and perform regular penetration testing.',
  },
  {
    category: 'technical',
    q: 'Do you offer API access?',
    a: 'Yes, our REST API is available on the Enterprise plan and as an add-on for Business plans.',
  },
  {
    category: 'account',
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login page. We will send you a reset link to your registered email.',
  },
  {
    category: 'account',
    q: 'Can I have multiple staff accounts?',
    a: 'Yes, depending on your plan. Starter includes 1 staff, Business includes 10, and Enterprise is unlimited.',
  },
  {
    category: 'account',
    q: 'How do I delete my account?',
    a: 'You can delete your account from settings. Contact support if you need help with data export before deletion.',
  },
  {
    category: 'account',
    q: 'Can I change my store name?',
    a: 'Yes, you can change your store name from the settings page at any time.',
  },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState([]);

  const filtered = useMemo(() => {
    return faqs.filter(
      (faq) =>
        (activeCategory === 'all' || faq.category === activeCategory) &&
        (faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeCategory, search]);

  const toggleItem = (i) => {
    setOpenItems((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">Everything you need to know about Commerce. Can not find what you are looking for? Contact our support team.</p>
            <div className="relative max-w-lg mx-auto">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-white text-secondary-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                <cat.icon className="w-4 h-4" /> {cat.label}
              </button>
            ))}
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleItem(i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-secondary-900 pr-4">{faq.q}</span>
                  <FiChevronDown
                    className={`w-5 h-5 text-secondary-400 flex-shrink-0 transition-transform duration-200 ${openItems.includes(i) ? 'rotate-180' : ''}`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openItems.includes(i) ? 'auto' : 0, opacity: openItems.includes(i) ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <div className="w-12 h-0.5 bg-primary-200 mb-4" />
                    <p className="text-secondary-600 leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <FiHelpCircle className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No results found</h3>
                <p className="text-secondary-500">Try a different search term or browse by category.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">Still Have Questions?</h2>
            <p className="text-secondary-600 mb-6 max-w-md mx-auto">Our support team is here to help you with anything you need.</p>
            <a href="/contact" className="btn-primary px-6 py-3">
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
