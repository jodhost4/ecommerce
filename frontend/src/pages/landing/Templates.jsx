import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiGrid, FiEye, FiShoppingBag, FiLayers, FiSmartphone, FiWatch, FiHome } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const categories = ['All', 'Fashion', 'Electronics', 'Beauty', 'Grocery', 'Home & Living', 'Sports', 'Books'];

const templates = [
  { id: 1, name: 'Vogue Fashion', category: 'Fashion', desc: 'Elegant fashion store with lookbook layouts and size guides.', color: 'from-pink-500 to-rose-600', icon: FiShoppingBag },
  { id: 2, name: 'TechHub', category: 'Electronics', desc: 'Modern electronics store with product comparison features.', color: 'from-blue-500 to-indigo-600', icon: FiSmartphone },
  { id: 3, name: 'Glow Beauty', category: 'Beauty', desc: 'Clean beauty store with tutorial integration and reviews.', color: 'from-purple-500 to-violet-600', icon: FiLayers },
  { id: 4, name: 'FreshMart', category: 'Grocery', desc: 'Grocery store with subscription boxes and weekly deals.', color: 'from-emerald-500 to-teal-600', icon: FiGrid },
  { id: 5, name: 'Homely', category: 'Home & Living', desc: 'Home decor store with AR room preview capability.', color: 'from-amber-500 to-orange-600', icon: FiHome },
  { id: 6, name: 'SportFlex', category: 'Sports', desc: 'Sports equipment store with size charts and bulk ordering.', color: 'from-red-500 to-red-700', icon: FiWatch },
  { id: 7, name: 'PageTurner', category: 'Books', desc: 'Bookstore with author spotlight and review carousels.', color: 'from-cyan-500 to-sky-600', icon: FiLayers },
  { id: 8, name: 'Luxe Fashion', category: 'Fashion', desc: 'Premium fashion store with virtual try-on integration.', color: 'from-indigo-500 to-purple-700', icon: FiShoppingBag },
  { id: 9, name: 'GadgetPro', category: 'Electronics', desc: 'Gadget store with spec sheets and video reviews.', color: 'from-slate-600 to-slate-800', icon: FiSmartphone },
  { id: 10, name: 'Organic Bliss', category: 'Grocery', desc: 'Organic grocery store with farm stories and recipes.', color: 'from-green-500 to-emerald-700', icon: FiGrid },
  { id: 11, name: 'GlowUp Studio', category: 'Beauty', desc: 'Salon & beauty store with booking system integration.', color: 'from-fuchsia-500 to-pink-600', icon: FiLayers },
  { id: 12, name: 'Comfort Living', category: 'Home & Living', desc: 'Furniture store with room planner and swatches.', color: 'from-yellow-500 to-amber-700', icon: FiHome },
];

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = templates.filter(
    (t) =>
      (activeCategory === 'All' || t.category === activeCategory) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Professional Store Templates</h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">Choose from our collection of beautifully designed templates. Customize everything to match your brand.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-secondary-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((template) => (
              <motion.div key={template.id} variants={itemVariants} className="group">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                  <div className={`relative h-48 bg-gradient-to-br ${template.color} flex items-center justify-center overflow-hidden`}>
                    <template.icon className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Link
                        to="/register"
                        className="opacity-0 group-hover:opacity-100 transition-opacity btn-secondary bg-white text-secondary-900 border-0 shadow-lg"
                      >
                        <FiEye className="mr-2" /> Preview
                      </Link>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-secondary-700">
                      {template.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">{template.name}</h3>
                    <p className="text-secondary-600 text-sm mb-4">{template.desc}</p>
                    <Link
                      to="/register"
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Use This Template <FiEye className="ml-1.5 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <FiSearch className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No templates found</h3>
              <p className="text-secondary-500">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Design?</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Our team can create a bespoke template tailored to your brand and requirements.</p>
            <Link to="/contact" className="inline-flex items-center px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg">
              Request Custom Design
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
