import { useState, useEffect } from 'react';
import authStore from '../store/authStore';

export function useAuth() {
  const [state, setState] = useState(authStore.getSnapshot());

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getSnapshot());
    });
    return unsubscribe;
  }, []);

  return state;
}

export function useRequireAuth(roles = []) {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return { authorized: false, reason: 'not_authenticated' };
  }

  if (roles.length > 0) {
    const userRole = auth.user?.role?.name || auth.user?.roleName;
    if (!roles.includes(userRole)) {
      return { authorized: false, reason: 'not_authorized' };
    }
  }

  return { authorized: true, auth };
}
