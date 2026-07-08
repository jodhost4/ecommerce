import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import authStore from '../../store/authStore';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      const { user, token, refreshToken } = response.data.data;
      authStore.login(user, token, refreshToken);
      toast.success('Welcome back!');
      
      const role = user.role?.name || user.roleName;
      if (role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (role === 'STORE_OWNER' || role === 'STORE_STAFF') {
        // If it's a store owner and they have no store, go to setup
        if (role === 'STORE_OWNER' && !user.ownedStore) {
          navigate('/merchant/setup');
        } else {
          navigate('/merchant');
        }
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        navigate(redirect || '/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-center text-secondary-900 mb-6">Sign in to your account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="input-field"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="input-field"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-secondary-600">
        Don't have an account?{' '}
        <Link 
          to={`/register${window.location.search}`} 
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
