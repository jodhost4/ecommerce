import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiZap, FiGrid, FiShield, FiBarChart2, FiArrowRight, FiCheck,
  FiStar, FiChevronRight, FiMail, FiPlay, FiTrendingUp, FiUsers
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  { icon: FiGrid, title: 'Custom Storefronts', desc: 'Drag-and-drop builder with beautiful themes to launch your store in minutes.' },
  { icon: FiShield, title: 'Secure Payments', desc: 'Multi-gateway support with PCI compliance and fraud protection built in.' },
  { icon: FiBarChart2, title: 'Analytics & Insights', desc: 'Real-time dashboards with actionable insights to grow your business.' },
  { icon: FiZap, title: 'Lightning Fast', desc: 'Optimized for speed with global CDN and automatic scaling.' },
];

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up free and choose your store name. No code required.' },
  { num: '02', title: 'Customize Your Store', desc: 'Pick a theme, add products, and set your brand colors.' },
  { num: '03', title: 'Start Selling', desc: 'Launch your store and accept orders from day one.' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Fashion Boutique Owner', text: 'Commerce helped me launch my online store in under a day. The analytics alone have transformed how I do business.', rating: 5 },
  { name: 'Marcus Chen', role: 'Electronics Retailer', text: 'We migrated from Shopify and saved 60% on fees. The multi-warehouse inventory is a game changer.', rating: 5 },
  { name: 'Emily Rodriguez', role: 'Beauty Brand Founder', text: 'The built-in marketing tools helped us reach 10x more customers. Absolutely love the platform!', rating: 5 },
];

const pricingPlans = [
  { name: 'Starter', price: '$29', features: ['Up to 100 products', 'Basic analytics', 'Email support', '1 staff account'], popular: false },
  { name: 'Business', price: '$79', features: ['Up to 1000 products', 'Advanced analytics', 'Priority support', '10 staff accounts', 'Custom domain'], popular: true },
  { name: 'Enterprise', price: '$199', features: ['Unlimited products', 'Real-time analytics', '24/7 phone support', 'Unlimited staff', 'Dedicated account manager', 'API access'], popular: false },
];

export default function LandingHome() {
  const [email, setEmail] = useState('');
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    // Fetch all active/published stores for Browse Stores section
    fetch('/api/stores/public-list?isActive=true&limit=6')
      .then((r) => r.json())
      .then((d) => {
        // ApiResponse.success returns { data: { data: [...], pagination: {...} } }
        // or sometimes d.data is the array directly if it's not nested
        const storeData = d.data?.data || d.data || [];
        setStores(Array.isArray(storeData) ? storeData : []);
      })
      .catch(() => {})
      .finally(() => setLoadingStores(false));
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Subscribed! Check your email for updates.');
      setEmail('');
    }
  };

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 text-sm font-medium mb-6">
                <FiZap className="w-4 h-4 mr-2" /> Launch your store today
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Build Your Online Store
                <span className="text-primary-300"> in Minutes</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-lg">
                The all-in-one commerce platform for modern businesses. Launch, manage, and grow your online store with zero hassle.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center px-8 py-3.5 bg-white text-primary-900 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl">
                  Get Started Free <FiArrowRight className="ml-2" />
                </Link>
                <Link to="/templates" className="inline-flex items-center px-8 py-3.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
                  <FiPlay className="mr-2" /> View Templates
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10 text-primary-200 text-sm">
                <div className="flex items-center"><FiCheck className="w-4 h-4 mr-1.5 text-green-400" /> No credit card</div>
                <div className="flex items-center"><FiCheck className="w-4 h-4 mr-1.5 text-green-400" /> Free 14-day trial</div>
                <div className="flex items-center"><FiCheck className="w-4 h-4 mr-1.5 text-green-400" /> Cancel anytime</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 to-purple-600 rounded-3xl blur-2xl opacity-30" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="bg-white rounded-xl p-4 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="text-sm text-gray-400 ml-2">commerce.app/dashboard</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="h-20 bg-gray-50 rounded-lg border border-gray-100 p-2">
                          <div className="h-2 bg-green-200 rounded w-2/3 mb-2" />
                          <div className="h-6 bg-green-100 rounded" />
                        </div>
                        <div className="h-20 bg-gray-50 rounded-lg border border-gray-100 p-2">
                          <div className="h-2 bg-blue-200 rounded w-2/3 mb-2" />
                          <div className="h-6 bg-blue-100 rounded" />
                        </div>
                        <div className="h-20 bg-gray-50 rounded-lg border border-gray-100 p-2">
                          <div className="h-2 bg-purple-200 rounded w-2/3 mb-2" />
                          <div className="h-6 bg-purple-100 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Everything You Need to Sell Online</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Powerful tools that help you create, manage, and grow your online store.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div key={feature.title} variants={itemVariants} className="group p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">{feature.title}</h3>
                  <p className="text-secondary-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">How It Works</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Get your store up and running in three simple steps.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                <motion.div key={step.num} variants={itemVariants} className="relative text-center">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg shadow-primary-200">
                    {step.num}
                  </div>
                  <div className={i < steps.length - 1 ? "hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-200 to-primary-400" : ""} />
                  <h3 className="text-xl font-semibold text-secondary-900 mb-3">{step.title}</h3>
                  <p className="text-secondary-600">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Browse Live Stores */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Browse Live Stores</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Discover stores built on our platform by real entrepreneurs.</p>
            </div>
            {loadingStores ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-500 mb-4">No stores published yet — be the first!</p>
                <Link to="/register" className="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-semibold">
                  Create Your Store <FiArrowRight className="ml-2" />
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store, i) => (
                  <motion.a
                    key={store.id}
                    href={`/store/${store.slug}/home`}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group block p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          store.name?.[0]?.toUpperCase() || 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">{store.name}</h3>
                        {store.businessCategory && (
                          <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">{store.businessCategory}</span>
                        )}
                      </div>
                    </div>
                    {store.description && (
                      <p className="text-sm text-secondary-600 line-clamp-2 mb-4">{store.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-secondary-400">
                      <span>{store._count?.products || 0} products</span>
                      <span className="flex items-center gap-1 text-primary-600 font-medium">
                        Visit Store <FiArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
            {stores.length > 0 && (
              <div className="text-center mt-8">
                <Link to="/register" className="inline-flex items-center px-6 py-3 border border-primary-300 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-all">
                  Create Your Own Store <FiArrowRight className="ml-2" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">No hidden fees. No surprises. Scale as you grow.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  variants={itemVariants}
                  className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${plan.popular ? 'border-primary-500 bg-primary-50/50 shadow-xl shadow-primary-100' : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-lg'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold text-secondary-900">{plan.price}</span>
                    <span className="text-secondary-500 ml-2">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center text-secondary-600">
                        <FiCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`block text-center py-3 rounded-lg font-semibold transition-all ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Get Started
                  </Link>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-secondary-500 mt-8">
              Need a custom plan? <Link to="/contact" className="text-primary-600 font-medium hover:underline">Contact us</Link>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Loved by Store Owners</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Hear from thousands of businesses that trust Commerce.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div key={t.name} variants={itemVariants} className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <FiStar key={j} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-secondary-700 mb-6 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">{t.name}</p>
                      <p className="text-secondary-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Store?</h2>
            <p className="text-lg text-primary-100 mb-8 max-w-lg mx-auto">Join thousands of businesses already selling with Commerce. Start your free 14-day trial today.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="inline-flex items-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg">
                Start Free Trial <FiArrowRight className="ml-2" />
              </Link>
              <Link to="/contact" className="inline-flex items-center px-8 py-3.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
                Talk to Sales
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 mt-10 text-primary-200">
              <div className="flex items-center gap-2"><FiTrendingUp className="w-5 h-5" /> No hidden fees</div>
              <div className="flex items-center gap-2"><FiUsers className="w-5 h-5" /> Cancel anytime</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <FiMail className="w-10 h-10 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-3">Stay Updated</h2>
            <p className="text-secondary-600 mb-6 max-w-md mx-auto">Get the latest product updates, tips, and e-commerce news.</p>
            <form onSubmit={handleNewsletter} className="flex max-w-md mx-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-field flex-1"
                required
              />
              <button type="submit" className="btn-primary">Subscribe</button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
