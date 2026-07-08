import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent if email exists');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-secondary-900 mb-2">Check your email</h2>
        <p className="text-secondary-600 mb-4">If an account exists, we've sent a password reset link.</p>
        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">Back to login</Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-center text-secondary-900 mb-6">Reset your password</h2>
      <p className="text-sm text-secondary-600 text-center mb-6">Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" placeholder="you@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-secondary-600">
        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">Back to login</Link>
      </p>
    </motion.div>
  );
}
