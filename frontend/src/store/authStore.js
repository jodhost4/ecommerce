import { create } from 'zustand';

// Simple auth store using React context pattern (no external dependency)
class AuthStore {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.token = localStorage.getItem('token') || null;
    this.refreshToken = localStorage.getItem('refreshToken') || null;
    this.listeners = new Set();
  }

  setState(newState) {
    Object.assign(this, newState);
    this.listeners.forEach((listener) => listener(this));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    this.setState({ user });
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    this.setState({ token });
  }

  setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    this.setState({ refreshToken });
  }

  login(userData, token, refreshToken) {
    this.setUser(userData);
    this.setToken(token);
    this.setRefreshToken(refreshToken);
  }

  logout() {
    this.setUser(null);
    this.setToken(null);
    this.setRefreshToken(null);
  }

  get isAuthenticated() {
    return !!this.token && !!this.user;
  }

  get isSuperAdmin() {
    return this.user?.role?.name === 'SUPER_ADMIN' || this.user?.roleName === 'SUPER_ADMIN';
  }

  get isStoreOwner() {
    return this.user?.role?.name === 'STORE_OWNER' || this.user?.roleName === 'STORE_OWNER';
  }

  get isCustomer() {
    return this.user?.role?.name === 'CUSTOMER' || this.user?.roleName === 'CUSTOMER';
  }
}

const authStore = new AuthStore();
export default authStore;
