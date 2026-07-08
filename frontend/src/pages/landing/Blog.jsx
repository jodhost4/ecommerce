import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiClock, FiArrowRight, FiChevronLeft, FiChevronRight, FiCalendar, FiUser, FiTag } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const categories = ['All', 'E-Commerce Tips', 'Platform Updates', 'Marketing', 'Design', 'Business Growth'];

const posts = [
  {
    id: 1,
    title: '10 Proven Strategies to Boost Your Online Store Sales',
    excerpt: 'Learn the most effective techniques to increase conversion rates and maximize revenue for your e-commerce business.',
    category: 'E-Commerce Tips',
    author: 'Alex Chen',
    date: 'Dec 15, 2024',
    readTime: '8 min read',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: 'Introducing AI-Powered Product Recommendations',
    excerpt: 'Our new machine learning engine helps you show the right products to the right customers at the right time.',
    category: 'Platform Updates',
    author: 'Sarah Mitchell',
    date: 'Dec 10, 2024',
    readTime: '5 min read',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 3,
    title: 'The Ultimate Guide to Social Media Marketing for Stores',
    excerpt: 'Discover how to leverage Instagram, TikTok, and Facebook to drive traffic and build your brand online.',
    category: 'Marketing',
    author: 'Maria Lopez',
    date: 'Dec 5, 2024',
    readTime: '12 min read',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 4,
    title: 'How to Design a High-Converting Product Page',
    excerpt: 'Explore the psychology behind great product page design and learn what makes customers click "Add to Cart."',
    category: 'Design',
    author: 'David Park',
    date: 'Nov 28, 2024',
    readTime: '6 min read',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 5,
    title: 'Scaling Your Business: When to Move to Enterprise',
    excerpt: 'Key indicators that your business is ready for enterprise-level e-commerce solutions and what to expect.',
    category: 'Business Growth',
    author: 'James Wilson',
    date: 'Nov 20, 2024',
    readTime: '7 min read',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 6,
    title: 'Email Marketing Automation: A Complete Walkthrough',
    excerpt: 'Set up automated email sequences that nurture leads, recover abandoned carts, and increase customer lifetime value.',
    category: 'Marketing',
    author: 'Priya Patel',
    date: 'Nov 15, 2024',
    readTime: '10 min read',
    color: 'from-cyan-500 to-sky-600',
  },
  {
    id: 7,
    title: 'Mobile Optimization: Why It Matters More Than Ever',
    excerpt: 'With over 70% of traffic coming from mobile devices, learn how to optimize your store for every screen size.',
    category: 'E-Commerce Tips',
    author: 'Alex Chen',
    date: 'Nov 8, 2024',
    readTime: '6 min read',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 8,
    title: 'New Theme Editor: Customize Everything Instantly',
    excerpt: 'Our revamped theme editor gives you pixel-perfect control over your store design with live preview.',
    category: 'Platform Updates',
    author: 'Sarah Mitchell',
    date: 'Nov 1, 2024',
    readTime: '4 min read',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 9,
    title: 'Inventory Management Best Practices for Small Businesses',
    excerpt: 'Avoid stockouts and overstocking with these proven inventory management strategies and tools.',
    category: 'Business Growth',
    author: 'James Wilson',
    date: 'Oct 25, 2024',
    readTime: '9 min read',
    color: 'from-emerald-500 to-teal-600',
  },
];

const POSTS_PER_PAGE = 6;

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return posts.filter(
      (post) =>
        (activeCategory === 'All' || post.category === activeCategory) &&
        (post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeCategory, search]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginatedPosts = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Blog</h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">Insights, tips, and updates to help you build and grow your online store.</p>
            <div className="relative max-w-lg mx-auto">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-white text-secondary-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <motion.article key={post.id} variants={itemVariants} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                <div className={`h-48 bg-gradient-to-br ${post.color} flex items-center justify-center relative overflow-hidden`}>
                  <FiTag className="w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-secondary-700">
                    {post.category}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-secondary-500 mb-3">
                    <span className="flex items-center"><FiCalendar className="w-3.5 h-3.5 mr-1" /> {post.date}</span>
                    <span className="flex items-center"><FiClock className="w-3.5 h-3.5 mr-1" /> {post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-xs text-secondary-500">
                      <FiUser className="w-3.5 h-3.5 mr-1" /> {post.author}
                    </span>
                    <Link to={`/blog/${post.id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                      Read More <FiArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {paginatedPosts.length === 0 && (
            <div className="text-center py-20">
              <FiSearch className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No articles found</h3>
              <p className="text-secondary-500">Try adjusting your search or filter.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary p-2"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    currentPage === i + 1
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-secondary-600 border border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary p-2"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-white mb-4">Want to Stay Ahead?</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Subscribe to our newsletter for the latest e-commerce trends and platform updates.</p>
            <a href="/register" className="inline-flex items-center px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg">
              Subscribe Now
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
