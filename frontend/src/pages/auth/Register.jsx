import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import authStore from '../../store/authStore';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      const { user, token, refreshToken } = response.data.data;
      authStore.login(user, token, refreshToken);
      toast.success('Account created successfully!');
      
      const role = user.role?.name || user.roleName;
      if (role === 'STORE_OWNER') {
        navigate('/merchant/setup');
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        navigate(redirect || '/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-center text-secondary-900 mb-6">Create your account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">First Name</label>
            <input type="text" {...register('firstName', { required: 'Required' })} className="input-field" />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name</label>
            <input type="text" {...register('lastName', { required: 'Required' })} className="input-field" />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" placeholder="you@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Password</label>
          <input type="password" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} className="input-field" placeholder="••••••••" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Phone (optional)</label>
          <input type="tel" {...register('phone')} className="input-field" placeholder="+1234567890" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">I want to...</label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="CUSTOMER" {...register('role')} defaultChecked className="text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-secondary-700">Shop on the platform</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="STORE_OWNER" {...register('role')} className="text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-secondary-700">Sell products/Open a store</span>
            </label>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-secondary-600">
        Already have an account?{' '}
        <Link 
          to={`/login${window.location.search}`} 
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
