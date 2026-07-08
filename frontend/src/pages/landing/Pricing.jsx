import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiHelpCircle, FiChevronDown } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const plans = [
  {
    name: 'Starter',
    monthly: 29,
    yearly: 290,
    desc: 'Perfect for small businesses just getting started.',
    features: [
      { text: 'Up to 100 products', included: true },
      { text: 'Basic analytics dashboard', included: true },
      { text: 'Email support', included: true },
      { text: '1 staff account', included: true },
      { text: 'Custom domain', included: false },
      { text: 'Abandoned cart recovery', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Business',
    monthly: 79,
    yearly: 790,
    desc: 'For growing businesses that need more power.',
    popular: true,
    features: [
      { text: 'Up to 1,000 products', included: true },
      { text: 'Advanced analytics & reports', included: true },
      { text: 'Priority email & chat support', included: true },
      { text: '10 staff accounts', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Abandoned cart recovery', included: true },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Enterprise',
    monthly: 199,
    yearly: 1990,
    desc: 'For large businesses with advanced needs.',
    features: [
      { text: 'Unlimited products', included: true },
      { text: 'Real-time analytics', included: true },
      { text: '24/7 phone & email support', included: true },
      { text: 'Unlimited staff accounts', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Abandoned cart recovery', included: true },
      { text: 'Full API access', included: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate the difference.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All plans come with a 14-day free trial. No credit card required. You can cancel anytime during the trial.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes, we offer a 30-day money-back guarantee on all plans. If you are not satisfied, we will refund your payment.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use 256-bit SSL encryption, are PCI-DSS compliant, and perform regular security audits.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes, Business and Enterprise plans include custom domain support. You can connect any domain you own.',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Choose the plan that fits your business. No hidden fees, no surprises.</p>
          </motion.div>

          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!yearly ? 'text-secondary-900' : 'text-secondary-400'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${yearly ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${yearly ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-secondary-900' : 'text-secondary-400'}`}>
              Yearly <span className="text-green-500 font-semibold">Save 20%</span>
            </span>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${plan.popular ? 'border-primary-500 bg-white shadow-2xl shadow-primary-100 scale-105 md:scale-110' : 'border-gray-200 bg-white hover:shadow-xl'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">{plan.name}</h3>
                <p className="text-secondary-500 text-sm mb-6">{plan.desc}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-secondary-900">
                    ${yearly ? plan.yearly / 12 : plan.monthly}
                  </span>
                  <span className="text-secondary-400 ml-2">/month</span>
                </div>
                {yearly && (
                  <p className="text-sm text-green-600 font-medium mb-4">${plan.yearly} billed annually</p>
                )}
                <Link
                  to="/register"
                  className={`block text-center py-3 rounded-lg font-semibold transition-all mb-8 ${plan.popular ? 'btn-primary shadow-lg' : 'btn-secondary'}`}
                >
                  Get Started
                </Link>
                <ul className="space-y-3.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-center text-sm ${f.included ? 'text-secondary-700' : 'text-secondary-400'}`}>
                      {f.included ? (
                        <FiCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <FiX className="w-5 h-5 text-secondary-300 mr-3 flex-shrink-0" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-12">
              <FiHelpCircle className="w-10 h-10 text-primary-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-secondary-900 mb-3">Frequently Asked Questions</h2>
              <p className="text-secondary-600">Got questions? We have answers.</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
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
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-secondary-500">
              Still have questions? <Link to="/contact" className="text-primary-600 font-medium hover:underline">Contact our team</Link>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
