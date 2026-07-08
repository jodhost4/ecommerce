import { motion } from 'framer-motion';
import { FiShield, FiLock, FiDatabase, FiEye, FiMail, FiTrash2 } from 'react-icons/fi';

const sections = [
  {
    icon: FiShield,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including your name, email address, phone number, billing address, and payment information when you create an account or make a purchase. We also automatically collect certain information when you use our platform, such as IP address, browser type, operating system, referring URLs, device information, and pages visited.`,
  },
  {
    icon: FiDatabase,
    title: 'How We Use Your Information',
    content: `We use the information we collect to provide, maintain, and improve our services; process transactions and send related information; send you technical notices, updates, security alerts, and support messages; respond to your comments, questions, and requests; and communicate with you about products, services, offers, and events.`,
  },
  {
    icon: FiEye,
    title: 'Information Sharing',
    content: `We do not sell your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform, conducting our business, or serving our users, provided those parties agree to keep your information confidential. We may also disclose information when required by law or to protect our rights.`,
  },
  {
    icon: FiLock,
    title: 'Data Security',
    content: `We implement industry-standard security measures including 256-bit SSL encryption, PCI-DSS compliance, regular security audits, and access controls to protect your personal information. Our servers are hosted in SOC 2-compliant data centers with 24/7 monitoring and physical security measures.`,
  },
  {
    icon: FiMail,
    title: 'Communication Preferences',
    content: `You may opt out of receiving promotional emails from us by following the unsubscribe instructions provided in those emails. We will still send you non-promotional messages related to your account and transactions. You can manage your notification preferences in your account settings.`,
  },
  {
    icon: FiTrash2,
    title: 'Data Retention & Deletion',
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time. We will delete or anonymize your information within 30 days of your request, subject to legal retention requirements.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FiShield className="w-12 h-12 text-primary-300 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-lg text-primary-100">Last updated: January 1, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-secondary-600 leading-relaxed mb-10">
              At Commerce, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform. Please read this policy carefully. By using our services, you consent to the practices described herein.
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Contact Us</h2>
            <p className="text-secondary-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="space-y-2 text-secondary-600">
              <li>Email: privacy@commerce.com</li>
              <li>Address: 123 Commerce Street, Suite 100, New York, NY 10001</li>
              <li>Phone: +1 (555) 123-4567</li>
            </ul>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
