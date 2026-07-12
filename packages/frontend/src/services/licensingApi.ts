import { api } from './api';

// ─── Product endpoints ───
export const getProducts = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get(`/products${query}`);
};

export const getProduct = (id: string) => api.get(`/products/${id}`);

// ─── Cart endpoints ───
export const addToCart = (productId: string, qty: number = 1) =>
  api.post('/cart/add', { productId, qty });

export const getCart = () => api.get('/cart');

export const removeFromCart = (productId: string) =>
  api.delete(`/cart/${productId}`);

export const clearCart = () => api.delete('/cart/all');

// ─── Checkout endpoints ───
export const calculateCheckout = (data: Record<string, unknown>) =>
  api.post('/checkout/calculate', data);

export const placeOrder = (data: Record<string, unknown>) =>
  api.post('/checkout/place', data);

// ─── Order endpoints ───
export const getOrders = () => api.get('/orders');

export const getOrder = (id: string) => api.get(`/orders/${id}`);

export const cancelOrder = (id: string) => api.post(`/orders/${id}/cancel`);

// ─── License endpoints ───
export const getLicenses = () => api.get('/licenses');

export const getLicense = (id: string) => api.get(`/licenses/${id}`);

export const getUserLicenses = () => api.get('/licenses/user');

// ─── Auth endpoints ───
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: Record<string, unknown>) =>
  api.post('/auth/register', data);

// ─── Profile endpoints ───
export const getProfile = () => api.get('/profile');

export const updateProfile = (data: Record<string, unknown>) =>
  api.put('/profile', data);

export const changePassword = (data: Record<string, unknown>) =>
  api.post('/profile/change-password', data);

// ─── Admin endpoints ───
export const adminGetStats = () => api.get('/admin/stats');

export const adminGetOrders = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get(`/admin/orders${query}`);
};

export const adminUpdateOrderStatus = (orderId: string, status: string) =>
  api.put(`/admin/orders/${orderId}/status`, { status });

export const adminGetCustomers = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get(`/admin/customers${query}`);
};

export const adminGetProducts = () => api.get('/admin/products');

export const adminCreateProduct = (data: Record<string, unknown>) =>
  api.post('/admin/products', data);

export const adminUpdateProduct = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/products/${id}`, data);

export const adminGetLicenses = () => api.get('/admin/licenses');

export const adminGenerateLicense = (data: Record<string, unknown>) =>
  api.post('/admin/licenses/generate', data);

export const adminRevokeLicense = (id: string) =>
  api.post(`/admin/licenses/${id}/revoke`);

export const adminGetSalesReport = (
  params?: Record<string, string>
) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get(`/admin/reports/sales${query}`);
};

export const adminGetProductReport = () => api.get('/admin/reports/products');

export const adminGetLicenseReport = () => api.get('/admin/reports/licenses');

// ─── Utility endpoints ───
export const validateCoupon = (code: string) =>
  api.post('/coupons/validate', { code });

export const getDownloads = () => api.get('/downloads');

export const getNotifications = () => api.get('/notifications');

export const markNotificationRead = (id: string) =>
  api.put(`/notifications/${id}/read`);

export const createSupportRequest = (data: Record<string, unknown>) =>
  api.post('/support', data);

export const getEmailLogs = () => api.get('/admin/email-logs');

// ─── Admin Coupon endpoints ───
export const adminGetCoupons = () => api.get('/admin/coupons');
export const adminCreateCoupon = (data: Record<string, unknown>) => api.post('/admin/coupons', data);
export const adminUpdateCoupon = (id: string, data: Record<string, unknown>) => api.put(`/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id: string) => api.delete(`/admin/coupons/${id}`);
