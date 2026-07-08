import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary-600">Commerce</h1>
            <p className="mt-2 text-sm text-secondary-500">Multi-Tenant SaaS Platform</p>
          </div>
          <div className="card p-8">
            <Outlet />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
