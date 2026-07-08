import { motion } from 'framer-motion';
import { FiFileText, FiUsers, FiShoppingCart, FiAlertCircle, FiShield, FiXCircle, FiBook, FiMail } from 'react-icons/fi';

const sections = [
  {
    icon: FiFileText,
    title: 'Acceptance of Terms',
    content: 'By accessing or using Commerce ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services. We reserve the right to update these terms at any time, and continued use constitutes acceptance of changes.',
  },
  {
    icon: FiUsers,
    title: 'Account Registration',
    content: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.',
  },
  {
    icon: FiShoppingCart,
    title: 'Services & Usage',
    content: 'Commerce provides an e-commerce platform for creating and managing online stores. You agree to use the Platform only for lawful purposes and in accordance with these terms. You may not use the Platform to sell illegal products, engage in fraudulent activity, or violate any applicable laws or regulations.',
  },
  {
    icon: FiAlertCircle,
    title: 'Payment & Billing',
    content: 'Subscription fees are charged in advance on a monthly or annual basis as selected. All payments are non-refundable except as expressly stated in our refund policy. We may change our fees with 30 days notice. Late payments may result in service suspension. You are responsible for all applicable taxes.',
  },
  {
    icon: FiShield,
    title: 'Intellectual Property',
    content: 'The Platform, including its code, design, logos, and content, is owned by Commerce and protected by intellectual property laws. You retain ownership of your store content, products, and customer data. You grant us a license to host and display your content as necessary to provide our services.',
  },
  {
    icon: FiXCircle,
    title: 'Prohibited Activities',
    content: 'You may not: (a) use the Platform for any illegal purpose; (b) attempt to gain unauthorized access to our systems; (c) interfere with the proper functioning of the Platform; (d) reverse engineer any part of the Platform; (e) use automated tools to scrape or extract data without permission; (f) transmit malware or harmful code.',
  },
  {
    icon: FiBook,
    title: 'Limitation of Liability',
    content: 'Commerce shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability for any claim is limited to the amount paid by you in the twelve months preceding the claim. The Platform is provided "as is" without warranties of any kind.',
  },
  {
    icon: FiMail,
    title: 'Contact & Disputes',
    content: 'Any disputes arising from these terms shall be governed by the laws of the State of New York. You agree to first attempt to resolve disputes informally by contacting us. If a dispute cannot be resolved, it shall be settled by binding arbitration. These terms constitute the entire agreement between you and Commerce.',
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FiFileText className="w-12 h-12 text-primary-300 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
            <p className="text-lg text-primary-100">Last updated: January 1, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-secondary-600 leading-relaxed mb-10">
              Please read these Terms and Conditions carefully before using the Commerce platform. By creating an account or using our services, you agree to be bound by these terms. If you are using the Platform on behalf of a business, you represent that you have the authority to bind that business.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 md:p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900 mb-3">{section.title}</h2>
                    <p className="text-secondary-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
