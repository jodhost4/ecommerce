import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiGlobe, FiTrendingUp, FiTarget, FiEye, FiHeart } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stats = [
  { icon: FiUsers, label: 'Active Users', value: '50,000+' },
  { icon: FiShoppingBag, label: 'Stores Created', value: '12,000+' },
  { icon: FiGlobe, label: 'Countries', value: '95+' },
  { icon: FiTrendingUp, label: 'Revenue Processed', value: '$2B+' },
];

const team = [
  { name: 'Alex Chen', role: 'CEO & Co-Founder', bio: 'Former Shopify engineer with a passion for democratizing e-commerce.' },
  { name: 'Sarah Mitchell', role: 'CTO & Co-Founder', bio: '15 years building scalable platforms at Amazon and Stripe.' },
  { name: 'David Park', role: 'Head of Design', bio: 'Award-winning product designer who cares deeply about user experience.' },
  { name: 'Maria Lopez', role: 'VP of Engineering', bio: 'Leads our distributed engineering team across 8 time zones.' },
  { name: 'James Wilson', role: 'Head of Sales', bio: 'Built enterprise sales teams at multiple SaaS unicorns.' },
  { name: 'Priya Patel', role: 'Head of Customer Success', bio: 'Ensures every merchant gets the support they deserve.' },
];

const timeline = [
  { year: '2020', event: 'Commerce founded with a mission to simplify online selling.' },
  { year: '2021', event: 'Launched public beta with first 100 merchants.' },
  { year: '2022', event: 'Raised $20M Series A and expanded to 50 countries.' },
  { year: '2023', event: 'Reached 10,000 stores and $1B in processed revenue.' },
  { year: '2024', event: 'Launched AI-powered tools and enterprise tier.' },
  { year: '2025', event: 'Global team of 200+ serving 95+ countries.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Story</h1>
            <p className="text-lg text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Commerce was born from a simple idea: every business deserves a beautiful, powerful online store without the complexity.
              We have helped thousands of entrepreneurs turn their dreams into thriving businesses.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="text-center p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-secondary-900 mb-1">{stat.value}</div>
                <div className="text-secondary-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Our Journey</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">From a small startup to a global commerce platform.</p>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200 hidden lg:block" />
              <div className="space-y-12">
                {timeline.map((item, i) => (
                  <motion.div
                    key={item.year}
                    variants={itemVariants}
                    className={`relative flex items-center gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <span className="text-primary-600 font-bold text-lg">{item.year}</span>
                        <p className="text-secondary-700 mt-1">{item.event}</p>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-200 font-bold text-sm flex-shrink-0 z-10">
                      {i + 1}
                    </div>
                    <div className="flex-1 hidden lg:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Meet Our Team</h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">Passionate people building the future of e-commerce.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member) => (
                <motion.div key={member.name} variants={itemVariants} className="group p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-primary-100 transition-all text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">{member.name}</h3>
                  <p className="text-primary-600 text-sm font-medium mb-3">{member.role}</p>
                  <p className="text-secondary-500 text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div variants={itemVariants} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <FiTarget className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-4">Our Mission</h3>
                <p className="text-secondary-600 leading-relaxed">
                  To empower every entrepreneur and business worldwide with the tools, insights, and platform they need to build, manage, and grow a successful online store — without technical complexity or high costs.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <FiEye className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-4">Our Vision</h3>
                <p className="text-secondary-600 leading-relaxed">
                  A world where anyone can start and scale an online business regardless of technical background. We envision Commerce as the operating system for global commerce — accessible, intelligent, and relentlessly innovative.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <FiHeart className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Journey</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Be part of something bigger. Start your store with Commerce today.</p>
            <a href="/register" className="inline-flex items-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg">
              Start Free Trial
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
