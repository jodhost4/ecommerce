import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (token) {
      authService.verifyEmail(token)
        .then(() => {
          setStatus('success');
          toast.success('Email verified!');
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      {status === 'verifying' && (
        <div>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Verifying your email...</p>
        </div>
      )}
      {status === 'success' && (
        <div>
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Email verified!</h2>
          <p className="text-secondary-600 mb-4">Your email has been successfully verified.</p>
          <Link to="/login" className="btn-primary">Go to login</Link>
        </div>
      )}
      {status === 'error' && (
        <div>
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Verification failed</h2>
          <p className="text-secondary-600 mb-4">The verification link is invalid or expired.</p>
          <Link to="/login" className="btn-primary">Go to login</Link>
        </div>
      )}
    </motion.div>
  );
}
