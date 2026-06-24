import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Upload, Trash2, History, Plus, FileCode, CreditCard,
  DollarSign, Edit, Eye, EyeOff, Search, Users, Tag,
  Calendar, ShoppingBag, RefreshCw, X, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { activeSortedVariants, formatVariantDuration, shortestVariant } from '../utils/variants';

interface Transaction {
  id: string;
  user_email: string;
  user_name: string;
  product_title: string;
  amount_paid: number;
  purchase_date: string;
  status: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  duration_days: number | null;
  duration_months: number | null;
  is_lifetime: boolean;
  is_deleted: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  category: string;
  description: string;
  has_file: boolean;
  image_url?: string;
  ea_magic?: number;
  created_at?: string;
  variants?: ProductVariant[];
}

interface DraftProductVariant {
  name: string;
  price: number;
  duration_days: number | null;
  duration_months: number | null;
  is_lifetime: boolean;
}

interface License {
  id: string;
  purchase_id: string;
  user_id: string;
  product_id: string;
  mt5_account?: string;
  device_id?: string;
  status: string;
  expires_at?: string;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  amount_paid: number;
  purchase_date: string;
  status: string;
  expires_at?: string;
  voucher_code?: string;
  account_login?: string;
  account_server?: string;
  product?: Product;
  user?: User;
  license?: License;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  balance: number;
  phone_number?: string;
  date_of_birth?: string;
  address?: string;
  is_deleted: boolean;
  last_login?: string;
  created_at: string;
}

interface Voucher {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit?: number;
  usage_count: number;
  product_scope?: string;
  created_at: string;
}

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard routing
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'vouchers'>('dashboard');

  // Common Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Dashboard State
  const [dashboardStats, setDashboardStats] = useState<{
    kpis: {
      total_revenue: number;
      total_orders: number;
      active_products: number;
      pending_uploads: number;
      new_users_registered: number;
    };
    registrations_by_day: { date: string; count: number }[];
    orders_by_day: { date: string; count: number }[];
    revenue_by_day: { date: string; amount: number }[];
    recent_orders: Transaction[];
  } | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 2. Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Product Variant Management States
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantDurationType, setNewVariantDurationType] = useState<'lifetime' | 'days' | 'months'>('months');
  const [newVariantDurationValue, setNewVariantDurationValue] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [showVariantsSection, setShowVariantsSection] = useState(true);
  const [draftProductVariants, setDraftProductVariants] = useState<DraftProductVariant[]>([]);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState('EA');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productUploadType, setProductUploadType] = useState<'url' | 'file'>('url');
  const [productEaMagic, setProductEaMagic] = useState('');
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productFileSelectedName, setProductFileSelectedName] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [confirmingProductDelete, setConfirmingProductDelete] = useState<Product | null>(null);
  const [confirmingProductDeleteLoading, setConfirmingProductDeleteLoading] = useState(false);

  // Ref for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Replacing file for product directly in catalog
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);

  // 3. Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // 4. Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showSensitives, setShowSensitives] = useState<Record<string, boolean>>({});
  const [updatingUser, setUpdatingUser] = useState(false);
  const [confirmingUserAction, setConfirmingUserAction] = useState<User | null>(null);
  const [confirmingUserActionLoading, setConfirmingUserActionLoading] = useState(false);

  // User edit form states
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserBalance, setEditUserBalance] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserDOB, setEditUserDOB] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');

  // 5. Vouchers State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Voucher form states
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherName, setVoucherName] = useState('');
  const [voucherDiscountType, setVoucherDiscountType] = useState('percentage');
  const [voucherDiscountValue, setVoucherDiscountValue] = useState('');
  const [voucherStartDate, setVoucherStartDate] = useState('');
  const [voucherEndDate, setVoucherEndDate] = useState('');
  const [voucherUsageLimit, setVoucherUsageLimit] = useState('');
  const [voucherProductScope, setVoucherProductScope] = useState('');
  const [voucherIsActive, setVoucherIsActive] = useState(true);
  const [submittingVoucher, setSubmittingVoucher] = useState(false);

  // Fetching data functions
  const loadDashboardData = async () => {
    try {
      let url = '/api/admin/dashboard';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const stats = await api.get<any>(url);
      setDashboardStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    }
  };

  const loadProductsData = async () => {
    try {
      const data = await api.get<Product[]>('/api/products');
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch catalog inventory.');
    }
  };

  const loadOrdersData = async () => {
    try {
      const data = await api.get<Order[]>('/api/admin/orders');
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order list.');
    }
  };

  const loadUsersData = async () => {
    try {
      const data = await api.get<User[]>('/api/admin/users');
      setUsersList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user directory.');
    }
  };

  const loadVouchersData = async () => {
    try {
      const data = await api.get<Voucher[]>('/api/admin/vouchers');
      setVouchers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch voucher list.');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'dashboard') await loadDashboardData();
      else if (activeTab === 'products') await loadProductsData();
      else if (activeTab === 'orders') await loadOrdersData();
      else if (activeTab === 'users') await loadUsersData();
      else if (activeTab === 'vouchers') await loadVouchersData();
    } catch (err) {
      // Caught inside subfunctions
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    if (!showAddProductModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAddProductModal]);

  // Handle Date range filter
  const handleFilterDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadDashboardData().finally(() => setLoading(false));
  };

  const handleResetDashboard = () => {
    setStartDate('');
    setEndDate('');
    setLoading(true);
    api.get<any>('/api/admin/dashboard').then((stats) => {
      setDashboardStats(stats);
    }).catch((err) => {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    }).finally(() => setLoading(false));
  };

  // Image Upload helpers for creating product
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProductImageFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'Image file size exceeds the 10MB limit.', type: 'error' });
      return;
    }
    setProductImageFile(file);
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const buildVariantFromForm = (): DraftProductVariant | null => {
    if (!newVariantName.trim() || !newVariantPrice.trim()) {
      setToast({ message: 'Please fill in variant name and price.', type: 'error' });
      return null;
    }

    const priceVal = parseFloat(newVariantPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setToast({ message: 'Price must be a valid non-negative number.', type: 'error' });
      return null;
    }

    let durationDays: number | null = null;
    let durationMonths: number | null = null;
    let isLifetime = false;

    if (newVariantDurationType === 'lifetime') {
      isLifetime = true;
    } else {
      const durationVal = parseInt(newVariantDurationValue);
      if (isNaN(durationVal) || durationVal <= 0) {
        setToast({ message: 'Duration must be a valid positive integer.', type: 'error' });
        return null;
      }
      if (newVariantDurationType === 'days') {
        durationDays = durationVal;
      } else {
        durationMonths = durationVal;
      }
    }

    return {
      name: newVariantName.trim(),
      price: priceVal,
      duration_days: durationDays,
      duration_months: durationMonths,
      is_lifetime: isLifetime
    };
  };

  const resetVariantForm = () => {
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantDurationType('months');
    setNewVariantDurationValue('');
  };

  const handleAddDraftVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    const variant = buildVariantFromForm();
    if (!variant) return;
    setDraftProductVariants(prev => [...prev, variant]);
    resetVariantForm();
  };

  const handleRemoveDraftVariant = (index: number) => {
    if (draftProductVariants.length <= 1) {
      setToast({ message: 'At least one variant is required.', type: 'error' });
      return;
    }
    setDraftProductVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftProductVariants.length === 0) {
      setToast({ message: 'Please add at least one valid variant before creating the product.', type: 'error' });
      return;
    }
    setSubmittingProduct(true);
    try {
      const formData = new FormData();
      formData.append('title', productTitle);
      formData.append('description', productDescription);
      formData.append('category', productCategory);
      formData.append('variants', JSON.stringify(draftProductVariants));
      if (productEaMagic.trim() !== '') {
        formData.append('ea_magic', productEaMagic);
      }

      if (productUploadType === 'url' && productImageUrl) {
        formData.append('image_url', productImageUrl);
      } else if (productUploadType === 'file' && productImageFile) {
        formData.append('image_file', productImageFile);
      }

      if (productFile) {
        formData.append('file', productFile);
      }

      await api.postForm('/api/admin/products', formData);
      setToast({ message: 'Product created successfully!', type: 'success' });

      // Reset
      setShowAddProductModal(false);
      setProductTitle('');
      setProductDescription('');
      setProductCategory('EA');
      setDraftProductVariants([]);
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantDurationType('months');
      setNewVariantDurationValue('');
      setProductImageUrl('');
      setProductImageFile(null);
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
      setProductImagePreview(null);
      setProductEaMagic('');
      setProductFile(null);
      setProductFileSelectedName('');

      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create product.', type: 'error' });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Replace/Upload tool binary file directly from inventory list
  const handleUploadFileDirect = async (productId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.postForm(`/api/admin/products/${productId}/upload-file`, formData);
      setToast({ message: 'Physical tool binary file updated successfully!', type: 'success' });
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to upload binary file.', type: 'error' });
    } finally {
      setReplacingProductId(null);
    }
  };

  // Product Delete
  const handleDeleteProduct = (product: Product) => {
    setConfirmingProductDelete(product);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!confirmingProductDelete || confirmingProductDeleteLoading) return;

    const productId = confirmingProductDelete.id;
    try {
      setConfirmingProductDeleteLoading(true);
      await api.delete(`/api/admin/products/${productId}`);
      setToast({ message: 'Product deleted successfully!', type: 'success' });
      loadProductsData();
      setConfirmingProductDelete(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete product.', type: 'error' });
    } finally {
      setConfirmingProductDeleteLoading(false);
    }
  };

  // Product Edit
  const handleStartEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductTitle(p.title);
    setProductDescription(p.description);
    setProductCategory(p.category);
    setProductEaMagic(p.ea_magic ? p.ea_magic.toString() : '');
    setProductImageUrl(p.image_url || '');
    setProductUploadType('url');
    setProductImageFile(null);
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImagePreview(null);

    // Reset variants form states
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantDurationType('months');
    setNewVariantDurationValue('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmittingProduct(true);
    try {
      const formData = new FormData();
      formData.append('title', productTitle);
      formData.append('description', productDescription);
      formData.append('category', productCategory);
      if (productCategory === 'EA' && productEaMagic.trim() !== '') {
        formData.append('ea_magic', productEaMagic);
      } else {
        formData.append('ea_magic', '');
      }

      if (productUploadType === 'url') {
        formData.append('image_url', productImageUrl);
      } else if (productUploadType === 'file' && productImageFile) {
        formData.append('image_file', productImageFile);
      } else {
        formData.append('image_url', editingProduct.image_url || '');
      }

      await api.putForm(`/api/admin/products/${editingProduct.id}`, formData);
      setToast({ message: 'Product details updated successfully!', type: 'success' });
      setEditingProduct(null);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update product details.', type: 'error' });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleAddVariant = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!newVariantName.trim() || !newVariantPrice.trim()) {
      setToast({ message: 'Please fill in variant name and price.', type: 'error' });
      return;
    }

    const priceVal = parseFloat(newVariantPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setToast({ message: 'Price must be a valid non-negative number.', type: 'error' });
      return;
    }

    let durationDays: number | null = null;
    let durationMonths: number | null = null;
    let isLifetime = false;

    if (newVariantDurationType === 'lifetime') {
      isLifetime = true;
    } else {
      const durationVal = parseInt(newVariantDurationValue);
      if (isNaN(durationVal) || durationVal <= 0) {
        setToast({ message: 'Duration must be a valid positive integer.', type: 'error' });
        return;
      }
      if (newVariantDurationType === 'days') {
        durationDays = durationVal;
      } else {
        durationMonths = durationVal;
      }
    }

    try {
      setAddingVariant(true);
      await api.post(`/api/admin/products/${editingProduct.id}/variants`, {
        name: newVariantName.trim(),
        price: priceVal,
        duration_days: durationDays,
        duration_months: durationMonths,
        is_lifetime: isLifetime
      });

      setToast({ message: 'Product variant created successfully!', type: 'success' });
      
      // Reset form fields
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantDurationValue('');
      
      // Refresh product data in modal and main inventory
      const updatedProduct = await api.get<Product>(`/api/products/${editingProduct.id}`);
      setEditingProduct(updatedProduct);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create product variant.', type: 'error' });
    } finally {
      setAddingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!editingProduct) return;
    if (activeSortedVariants(editingProduct.variants).length <= 1) {
      setToast({ message: 'Cannot delete the last active variant.', type: 'error' });
      return;
    }
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      setDeletingVariantId(variantId);
      await api.delete(`/api/admin/products/${editingProduct.id}/variants/${variantId}`);
      setToast({ message: 'Product variant deleted successfully!', type: 'success' });
      
      // Refresh product data in modal and main inventory
      const updatedProduct = await api.get<Product>(`/api/products/${editingProduct.id}`);
      setEditingProduct(updatedProduct);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete product variant.', type: 'error' });
    } finally {
      setDeletingVariantId(null);
    }
  };

  // Orders Status Transition
  const handleUpdateOrderStatus = async (purchaseId: string, newStatus: string) => {
    setUpdatingOrderStatus(true);
    try {
      await api.put<Order>(`/api/admin/orders/${purchaseId}?new_status=${newStatus}`, {});
      setToast({ message: `Order status updated to ${newStatus}!`, type: 'success' });
      // Update local state lists
      setOrders(orders.map(o => o.id === purchaseId ? { ...o, status: newStatus } : o));
      if (viewingOrder && viewingOrder.id === purchaseId) {
        setViewingOrder({ ...viewingOrder, status: newStatus });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update order status.', type: 'error' });
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // User Management
  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserFullName(u.full_name);
    setEditUserRole(u.role);
    setEditUserBalance(u.balance.toString());
    setEditUserPhone(u.phone_number || '');
    setEditUserDOB(u.date_of_birth || '');
    setEditUserAddress(u.address || '');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdatingUser(true);
    try {
      const balanceVal = parseFloat(editUserBalance);
      if (isNaN(balanceVal)) {
        throw new Error('Balance must be a valid number.');
      }

      const payload = {
        full_name: editUserFullName,
        role: editUserRole,
        balance: balanceVal,
        phone_number: editUserPhone || null,
        date_of_birth: editUserDOB || null,
        address: editUserAddress || null
      };

      const updated = await api.put<User>(`/api/admin/users/${editingUser.id}`, payload);
      setToast({ message: 'User updated successfully!', type: 'success' });
      setUsersList(usersList.map(u => u.id === editingUser.id ? updated : u));
      if (viewingUser && viewingUser.id === editingUser.id) {
        setViewingUser(updated);
      }
      setEditingUser(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update user profile.', type: 'error' });
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleToggleSoftDeleteUser = (u: User) => {
    setConfirmingUserAction(u);
  };

  const handleConfirmToggleSoftDeleteUser = async () => {
    if (!confirmingUserAction || confirmingUserActionLoading) return;

    const u = confirmingUserAction;
    const actionText = u.is_deleted ? 'restore' : 'soft-delete';
    try {
      setConfirmingUserActionLoading(true);
      if (u.is_deleted) {
        await api.post<User>(`/api/admin/users/${u.id}/restore`, {});
        setToast({ message: 'User account restored successfully!', type: 'success' });
      } else {
        await api.delete(`/api/admin/users/${u.id}`);
        setToast({ message: 'User account suspended (soft-deleted) successfully!', type: 'success' });
      }
      // Since delete does not return the model standard, reload users
      loadUsersData();
      if (viewingUser && viewingUser.id === u.id) {
        setViewingUser({ ...viewingUser, is_deleted: !u.is_deleted });
      }
      setConfirmingUserAction(null);
    } catch (err: any) {
      setToast({ message: err.message || `Failed to ${actionText} user.`, type: 'error' });
    } finally {
      setConfirmingUserActionLoading(false);
    }
  };

  // Vouchers Campaigns Management
  const handleStartEditVoucher = (v: Voucher) => {
    setEditingVoucher(v);
    setVoucherCode(v.code);
    setVoucherName(v.name);
    setVoucherDiscountType(v.discount_type);
    setVoucherDiscountValue(v.discount_value.toString());
    setVoucherStartDate(v.start_date.substring(0, 16)); // Format to datetime-local string
    setVoucherEndDate(v.end_date.substring(0, 16));
    setVoucherUsageLimit(v.usage_limit ? v.usage_limit.toString() : '');
    setVoucherProductScope(v.product_scope || '');
    setVoucherIsActive(v.is_active);
    setShowVoucherModal(true);
  };

  const handleCreateOrUpdateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVoucher(true);
    try {
      const payload = {
        code: voucherCode.toUpperCase(),
        name: voucherName,
        discount_type: voucherDiscountType,
        discount_value: parseFloat(voucherDiscountValue),
        start_date: new Date(voucherStartDate).toISOString(),
        end_date: new Date(voucherEndDate).toISOString(),
        usage_limit: voucherUsageLimit ? parseInt(voucherUsageLimit) : null,
        product_scope: voucherProductScope || null,
        is_active: voucherIsActive
      };

      if (editingVoucher) {
        await api.put(`/api/admin/vouchers/${editingVoucher.id}`, payload);
        setToast({ message: 'Voucher campaign updated successfully!', type: 'success' });
      } else {
        await api.post('/api/admin/vouchers', payload);
        setToast({ message: 'Voucher campaign created successfully!', type: 'success' });
      }
      setShowVoucherModal(false);
      // Reset
      setVoucherCode('');
      setVoucherName('');
      setVoucherDiscountType('percentage');
      setVoucherDiscountValue('');
      setVoucherStartDate('');
      setVoucherEndDate('');
      setVoucherUsageLimit('');
      setVoucherProductScope('');
      setVoucherIsActive(true);
      setEditingVoucher(null);
      loadVouchersData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save voucher campaign.', type: 'error' });
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Are you sure you want to permanently delete this voucher campaign?')) {
      return;
    }
    try {
      await api.delete(`/api/admin/vouchers/${voucherId}`);
      setToast({ message: 'Voucher campaign deleted successfully!', type: 'success' });
      loadVouchersData();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete voucher.', type: 'error' });
    }
  };

  // Helper sensitive masking
  const toggleShowSensitive = (field: string) => {
    setShowSensitives(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Filtered Products List
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered Orders List
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.user && o.user.email.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.user && o.user.full_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.product && o.product.title.toLowerCase().includes(orderSearch.toLowerCase()));

    if (orderStatusFilter === 'all') return matchesSearch;
    return matchesSearch && o.status.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  // Filtered Users List
  const filteredUsers = usersList.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--error-color)', fontSize: '1.2rem', fontWeight: 600 }}>Access Denied. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>

      {/* Title Section */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Admin Management Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            System stats, products inventory, logs checkouts ledger, user accounts directory, and voucher campaigns.
          </p>
        </div>
        <button onClick={loadAllData} className="btn-secondary" style={{ height: '42px' }}>
          <RefreshCw size={16} />
          Sync Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-panel" style={{
        display: 'flex',
        padding: '0.4rem',
        gap: '0.4rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <CreditCard size={14} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <FileCode size={14} />
          Quản lý sản phẩm
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <ShoppingBag size={14} />
          Quản lý đơn hàng
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <Users size={14} />
          Quản lý users
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={activeTab === 'vouchers' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <Tag size={14} />
          Chiến dịch sale / voucher
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error-color)', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.1)',
            borderTopColor: 'var(--primary-solid)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : (
        <div className="animate-fade-in">

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && dashboardStats && (
            <div>
              {/* Date Filter Panel */}
              <form onSubmit={handleFilterDashboard} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Từ Ngày</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }} />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Đến Ngày</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}>Filter</button>
                  <button type="button" onClick={handleResetDashboard} className="btn-secondary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}>Reset</button>
                </div>
              </form>

              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
                    <DollarSign size={24} color="var(--success-color)" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Revenue Summary</span>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>${dashboardStats.kpis.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
                    <ShoppingBag size={24} color="var(--primary-solid)" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Total Orders</span>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{dashboardStats.kpis.total_orders} Completed</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
                    <FileCode size={24} color="#06b6d4" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Active Tools</span>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{dashboardStats.kpis.active_products} listed</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
                    <AlertTriangle size={24} color="var(--warning-color)" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Pending Uploads</span>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{dashboardStats.kpis.pending_uploads} tools</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
                    <Users size={24} color="#a855f7" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>New Registrations</span>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{dashboardStats.kpis.new_users_registered} users</strong>
                  </div>
                </div>
              </div>

              {/* Charts & Trends Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Revenue & Sales Daily Table */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={18} color="var(--success-color)" /> Daily Checkout & Revenue Ledger
                  </h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.5rem' }}>Ngày</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center' }}>Đơn hàng</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.revenue_by_day.length === 0 ? (
                          <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No statistics recorded</td></tr>
                        ) : (
                          dashboardStats.revenue_by_day.map((day) => {
                            const matchingOrders = dashboardStats.orders_by_day.find(o => o.date === day.date)?.count || 0;
                            return (
                              <tr key={day.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '0.65rem 0.5rem' }}>{day.date}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{matchingOrders}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--success-color)' }}>${day.amount.toFixed(2)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* User registrations Table */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#a855f7" /> Daily User Registrations Trend
                  </h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.5rem' }}>Ngày</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Số lượng đăng ký mới</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.registrations_by_day.length === 0 ? (
                          <tr><td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No user registrations recorded</td></tr>
                        ) : (
                          dashboardStats.registrations_by_day.map((day) => (
                            <tr key={day.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.65rem 0.5rem' }}>{day.date}</td>
                              <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#a855f7' }}>{day.count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} color="var(--primary-solid)" /> Recent System Ledger Transactions
                </h3>
                {dashboardStats.recent_orders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No transactions found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '1rem 0.5rem' }}>Thời gian</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Khách Hàng</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Sản Phẩm</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Giá Thanh Toán</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.recent_orders.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {new Date(tx.purchase_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              <strong style={{ display: 'block', color: '#fff', fontSize: '0.9rem' }}>{tx.user_name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.user_email}</span>
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {tx.product_title}
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                              ${tx.amount_paid.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: tx.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: tx.status === 'completed' ? 'var(--success-color)' : 'var(--warning-color)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search catalog products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem', height: '40px' }}
                  />
                </div>
                <button onClick={() => setShowAddProductModal(true)} className="btn-primary" style={{ height: '40px' }}>
                  <Plus size={16} /> Thêm sản phẩm mới
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No products listed.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Thông tin sản phẩm</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Phân loại</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Giá từ</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Trạng Thái File</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const isPending = !p.has_file;
                        const displayVariant = shortestVariant(p.variants);
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                flexShrink: 0
                              }}>
                                <img
                                  src={p.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&auto=format&fit=crop&q=60'}
                                  alt={p.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&auto=format&fit=crop&q=60';
                                  }}
                                />
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>{p.title}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.id}</span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                {p.category}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                              {displayVariant ? `$${displayVariant.price.toFixed(2)}` : 'No package'}
                            </td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isPending ? 'var(--warning-color)' : 'var(--success-color)'
                              }}>
                                {isPending ? 'Chờ tải lên file' : 'Active (Có file)'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                {/* File upload actions */}
                                <button
                                  onClick={() => {
                                    setReplacingProductId(p.id);
                                    replaceFileInputRef.current?.click();
                                  }}
                                  className="btn-secondary"
                                  title={isPending ? "Tải lên file code" : "Thay thế file code"}
                                  style={{ padding: '0.45rem', height: '34px', borderColor: isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.08)' }}
                                >
                                  <Upload size={14} color={isPending ? 'var(--warning-color)' : 'var(--text-secondary)'} />
                                </button>

                                <button
                                  onClick={() => handleStartEditProduct(p)}
                                  className="btn-secondary"
                                  style={{ padding: '0.45rem', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                >
                                  <Edit size={14} color="var(--primary-solid)" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  className="btn-secondary"
                                  style={{ padding: '0.45rem', height: '34px', borderColor: 'rgba(239,68,68,0.2)' }}
                                >
                                  <Trash2 size={14} color="var(--error-color)" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Hidden File Input for Direct Upload */}
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && replacingProductId) {
                        handleUploadFileDirect(replacingProductId, file);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by buyer or product..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem', height: '40px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trạng Thái:</span>
                  <select
                    className="form-control"
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none', width: '150px', height: '40px' }}
                  >
                    <option value="all">Tất cả</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No orders matching criteria found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Mã Đơn Hàng</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Ngày đặt</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Khách hàng</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Sản phẩm</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Giá Thanh Toán</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Trạng thái</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {o.id.substring(0, 8)}...
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(o.purchase_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>{o.user?.full_name || 'Guest'}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {o.product?.title || 'Unknown Product'}
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                            ${o.amount_paid.toFixed(2)}
                            {o.voucher_code && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success-color)' }}>
                                Voucher: {o.voucher_code}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '10px',
                              background: o.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : o.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: o.status === 'completed' ? 'var(--success-color)' : o.status === 'pending' ? 'var(--warning-color)' : 'var(--error-color)',
                              textTransform: 'uppercase'
                            }}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                            <button
                              onClick={() => setViewingOrder(o)}
                              className="btn-secondary"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', height: '34px' }}
                            >
                              <Eye size={14} /> Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem', height: '40px' }}
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No users registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Họ Tên & Email</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Vai trò</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Số dư ví</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Ngày đăng ký</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Đăng nhập cuối</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Trạng thái</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', opacity: u.is_deleted ? 0.6 : 1 }}>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>{u.full_name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              background: u.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: u.role === 'admin' ? '#a855f7' : 'var(--text-secondary)',
                              textTransform: 'uppercase'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                            ${u.balance.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '10px',
                              background: u.is_deleted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: u.is_deleted ? 'var(--error-color)' : 'var(--success-color)'
                            }}>
                              {u.is_deleted ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => setViewingUser(u)}
                                className="btn-secondary"
                                style={{ padding: '0.45rem', height: '34px' }}
                                title="Xem thông tin chi tiết"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleStartEditUser(u)}
                                className="btn-secondary"
                                style={{ padding: '0.45rem', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit size={14} color="var(--primary-solid)" />
                              </button>
                              <button
                                onClick={() => handleToggleSoftDeleteUser(u)}
                                className="btn-secondary"
                                style={{
                                  padding: '0.45rem',
                                  height: '34px',
                                  borderColor: u.is_deleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239,68,68,0.2)'
                                }}
                                title={u.is_deleted ? "Kích hoạt lại tài khoản" : "Tạm ngưng tài khoản"}
                              >
                                <Trash2 size={14} color={u.is_deleted ? 'var(--success-color)' : 'var(--error-color)'} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VOUCHERS */}
          {activeTab === 'vouchers' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Active Sale Campaigns & Vouchers</h2>
                <button onClick={() => { setEditingVoucher(null); setShowVoucherModal(true); }} className="btn-primary" style={{ height: '40px' }}>
                  <Plus size={16} /> Tạo Voucher mới
                </button>
              </div>

              {vouchers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No voucher campaigns listed.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Mã / Chiến dịch</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Mức Giảm</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Thời Hạn Sử Dụng</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Lượt sử dụng / Giới hạn</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Phạm vi áp dụng</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Trạng thái</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((v) => {
                        const now = new Date();
                        const isExpired = new Date(v.end_date) < now;
                        return (
                          <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--primary-glow)', fontFamily: 'monospace' }}>{v.code}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.name}</span>
                            </td>
                            <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                              {v.discount_type === 'percentage' ? `${v.discount_value}%` : `$${v.discount_value}`}
                            </td>
                            <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Calendar size={12} color="var(--text-muted)" />
                                <span>
                                  {new Date(v.start_date).toLocaleDateString(undefined, { dateStyle: 'short' })} - {new Date(v.end_date).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              {v.usage_count} / {v.usage_limit !== null && v.usage_limit !== undefined ? v.usage_limit : 'unlimited'}
                            </td>
                            <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {v.product_scope ? `Sản phẩm ID: ${v.product_scope.substring(0, 15)}...` : 'Tất cả cửa hàng (Storewide)'}
                            </td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                background: isExpired ? 'rgba(239, 68, 68, 0.15)' : v.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: isExpired ? 'var(--error-color)' : v.is_active ? 'var(--success-color)' : 'var(--text-muted)'
                              }}>
                                {isExpired ? 'Expired' : v.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleStartEditVoucher(v)}
                                  className="btn-secondary"
                                  style={{ padding: '0.45rem', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                >
                                  <Edit size={14} color="var(--primary-solid)" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVoucher(v.id)}
                                  className="btn-secondary"
                                  style={{ padding: '0.45rem', height: '34px', borderColor: 'rgba(239,68,68,0.2)' }}
                                >
                                  <Trash2 size={14} color="var(--error-color)" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: ADD PRODUCT */}
      {showAddProductModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: 'max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))',
          overflowY: 'auto'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            padding: '2rem',
            maxWidth: '720px',
            width: '100%',
            maxHeight: 'calc(100dvh - 2rem)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto 0',
            minHeight: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create New Trading Tool Product</h2>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ overflowY: 'auto', paddingRight: '0.25rem', minHeight: 0 }}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input type="text" required value={productTitle} onChange={e => setProductTitle(e.target.value)} className="form-control" placeholder="e.g. Algo HFT Pro Scalper" />
              </div>

              <div className="form-group">
                <label className="form-label">Phân loại *</label>
                <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none' }}>
                  <option value="EA">Expert Advisor (EA)</option>
                  <option value="Indicator">Technical Indicator</option>
                  <option value="Script">Execution Script</option>
                </select>
              </div>

              {productCategory === 'EA' && (
                <div className="form-group">
                  <label className="form-label">EA Magic Number (Optional)</label>
                  <input type="number" value={productEaMagic} onChange={e => setProductEaMagic(e.target.value)} className="form-control" placeholder="e.g. 9988112" />
                </div>
              )}

              {/* Thumbnail Type Selector */}
              <div className="form-group">
                <label className="form-label">Hình ảnh thu nhỏ (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content' }}>
                  <button type="button" onClick={() => setProductUploadType('url')} style={{ background: productUploadType === 'url' ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#fff' }}>URL ảnh từ xa</button>
                  <button type="button" onClick={() => setProductUploadType('file')} style={{ background: productUploadType === 'file' ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#fff' }}>Tải file ảnh lên</button>
                </div>

                {productUploadType === 'url' ? (
                  <input type="url" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} className="form-control" placeholder="https://images.unsplash.com/... or blank" />
                ) : productImagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem' }}>
                    <img src={productImagePreview} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productImageFile?.name}</span>
                    <button type="button" onClick={() => { setProductImageFile(null); setProductImagePreview(null); }} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</button>
                  </div>
                ) : (
                  <div onClick={() => imageInputRef.current?.click()} style={{ border: '1px dashed var(--panel-border)', padding: '0.75rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Nhấn vào đây để duyệt file ảnh thu nhỏ
                    <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageFileChange} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả sản phẩm *</label>
                <textarea required rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} className="form-control" placeholder="Mô tả thuật toán, chỉ báo, hoặc cách thức vận hành..." style={{ resize: 'vertical' }} />
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fff' }}>
                  <Tag size={16} color="var(--primary-solid)" />
                  VARIANTS * ({draftProductVariants.length})
                </h3>

                {draftProductVariants.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {draftProductVariants.map((variant, index) => (
                      <div key={`${variant.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{variant.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatVariantDuration({ ...variant, id: `${index}` })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e0a96d' }}>${variant.price.toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemoveDraftVariant(index)} disabled={draftProductVariants.length <= 1} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', height: '28px', minWidth: '40px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--error-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: draftProductVariants.length <= 1 ? 0.5 : 1 }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Package Name *</label>
                  <input type="text" placeholder="e.g. 1-Month License, Lifetime" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                </div>

                <div className="responsive-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Price (USD) *</label>
                    <input type="number" step="0.01" min="0" placeholder="0.00" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration Type</label>
                    <select value={newVariantDurationType} onChange={e => setNewVariantDurationType(e.target.value as any)} className="form-control" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)' }}>
                      <option value="lifetime">Lifetime</option>
                      <option value="days">Days</option>
                      <option value="months">Calendar Months</option>
                    </select>
                  </div>
                </div>

                {newVariantDurationType !== 'lifetime' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration ({newVariantDurationType}) *</label>
                    <input type="number" min="1" placeholder={newVariantDurationType === 'months' ? 'Number of months (e.g. 3)' : 'Number of days (e.g. 90)'} value={newVariantDurationValue} onChange={e => setNewVariantDurationValue(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                )}

                <button type="button" onClick={handleAddDraftVariant} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.35rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--primary-solid)', boxShadow: 'none' }}>
                  <Plus size={14} /> Add Draft Variant
                </button>
              </div>

              {/* Tool code binary file upload */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Tải file Code / Executable (.ex5, .mq5, .zip) *</label>
                {productFileSelectedName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.65rem' }}>
                    <FileCode size={20} color="var(--primary-solid)" />
                    <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productFileSelectedName}</span>
                    <button type="button" onClick={() => { setProductFile(null); setProductFileSelectedName(''); }} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--panel-border)', padding: '1.5rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}>
                    <Upload size={24} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chọn file sản phẩm (Có thể bỏ trống để bổ sung sau)</p>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProductFile(file);
                        setProductFileSelectedName(file.name);
                      }
                    }} />
                  </div>
                )}
              </div>

              <button type="submit" disabled={submittingProduct || draftProductVariants.length === 0} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                {submittingProduct ? 'Đang xuất bản...' : 'Tạo và đăng bán sản phẩm'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Edit Product Details</h2>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input type="text" required value={productTitle} onChange={e => setProductTitle(e.target.value)} className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Phân loại *</label>
                <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none' }}>
                  <option value="EA">Expert Advisor (EA)</option>
                  <option value="Indicator">Technical Indicator</option>
                  <option value="Script">Execution Script</option>
                </select>
              </div>

              {productCategory === 'EA' && (
                <div className="form-group">
                  <label className="form-label">EA Magic Number (Optional)</label>
                  <input type="number" value={productEaMagic} onChange={e => setProductEaMagic(e.target.value)} className="form-control" />
                </div>
              )}

              {/* Thumbnail Type Selector */}
              <div className="form-group">
                <label className="form-label">Hình ảnh thu nhỏ</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content' }}>
                  <button type="button" onClick={() => setProductUploadType('url')} style={{ background: productUploadType === 'url' ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#fff' }}>URL ảnh từ xa</button>
                  <button type="button" onClick={() => setProductUploadType('file')} style={{ background: productUploadType === 'file' ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#fff' }}>Tải file ảnh lên</button>
                </div>

                {productUploadType === 'url' ? (
                  <input type="url" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} className="form-control" />
                ) : productImagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem' }}>
                    <img src={productImagePreview} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productImageFile?.name}</span>
                    <button type="button" onClick={() => { setProductImageFile(null); setProductImagePreview(null); }} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</button>
                  </div>
                ) : (
                  <div onClick={() => editImageInputRef.current?.click()} style={{ border: '1px dashed var(--panel-border)', padding: '0.75rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Chọn file ảnh thu nhỏ mới để thay thế
                    <input type="file" ref={editImageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageFileChange} />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Mô tả sản phẩm *</label>
                <textarea required rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} className="form-control" style={{ resize: 'vertical' }} />
              </div>

              {/* COLLAPSIBLE SECTION: PRODUCT VARIANTS */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.15)' }}>
                <div 
                  onClick={() => setShowVariantsSection(!showVariantsSection)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fff' }}>
                    <Tag size={16} color="var(--primary-solid)" />
                    Product Variants ({activeSortedVariants(editingProduct.variants).length})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {showVariantsSection ? 'Collapse' : 'Expand'}
                  </span>
                </div>

                {showVariantsSection && (
                  <div style={{ marginTop: '1rem' }}>
                    {/* List of existing variants */}
                    {activeSortedVariants(editingProduct.variants).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {activeSortedVariants(editingProduct.variants).map(v => (
                          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{v.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {formatVariantDuration(v)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e0a96d' }}>
                                ${v.price.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteVariant(v.id)}
                                disabled={deletingVariantId === v.id || activeSortedVariants(editingProduct.variants).length <= 1}
                                className="btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', height: '28px', minWidth: '40px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--error-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {deletingVariantId === v.id ? '...' : <Trash2 size={12} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--error-color)', marginBottom: '1.25rem' }}>No variants created for this product. Add one before saving or enabling checkout.</p>
                    )}

                    {/* Form to add a new variant */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add New Variant</h4>
                      
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Variant Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. 1-Month License, Lifetime"
                          value={newVariantName}
                          onChange={e => setNewVariantName(e.target.value)}
                          className="form-control"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="responsive-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Price (USD) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={newVariantPrice}
                            onChange={e => setNewVariantPrice(e.target.value)}
                            className="form-control"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration Type</label>
                          <select
                            value={newVariantDurationType}
                            onChange={e => setNewVariantDurationType(e.target.value as any)}
                            className="form-control"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.03)' }}
                          >
                            <option value="months">Months</option>
                            <option value="days">Days</option>
                            <option value="lifetime">Lifetime</option>
                          </select>
                        </div>
                      </div>

                      {newVariantDurationType !== 'lifetime' && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration ({newVariantDurationType}) *</label>
                          <input
                            type="number"
                            min="1"
                            placeholder={newVariantDurationType === 'months' ? "Number of months (e.g. 3)" : "Number of days (e.g. 90)"}
                            value={newVariantDurationValue}
                            onChange={e => setNewVariantDurationValue(e.target.value)}
                            className="form-control"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddVariant}
                        disabled={addingVariant}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.35rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--primary-solid)', boxShadow: 'none' }}
                      >
                        <Plus size={14} />
                        {addingVariant ? 'Adding Variant...' : 'Add Variant'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" disabled={submittingProduct} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submittingProduct ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ORDER DETAILS */}
      {viewingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Order Details & Parameters</h2>
              <button onClick={() => setViewingOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="responsive-grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Mã Đơn Hàng</span>
                <strong style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{viewingOrder.id}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Trạng thái</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                  background: viewingOrder.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : viewingOrder.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: viewingOrder.status === 'completed' ? 'var(--success-color)' : viewingOrder.status === 'pending' ? 'var(--warning-color)' : 'var(--error-color)',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginTop: '0.25rem'
                }}>
                  {viewingOrder.status}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Khách Hàng</span>
                <strong style={{ fontSize: '0.95rem' }}>{viewingOrder.user?.full_name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>{viewingOrder.user?.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Ngày Đặt Hàng</span>
                <strong style={{ fontSize: '0.95rem' }}>{new Date(viewingOrder.purchase_date).toLocaleString()}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Sản Phẩm</span>
                <strong style={{ fontSize: '0.95rem' }}>{viewingOrder.product?.title}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Phân loại: {viewingOrder.product?.category}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Số Tiền Thanh Toán</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--success-color)' }}>${viewingOrder.amount_paid.toFixed(2)}</strong>
                {viewingOrder.voucher_code && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Voucher code: {viewingOrder.voucher_code}</span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                MT5 License Parameter Information
              </h3>
              <div className="responsive-grid-2" style={{ fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>MT5 Account ID</span>
                  <strong>{viewingOrder.license?.mt5_account || 'Chưa liên kết / Chưa kích hoạt'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>MT5 Server Name</span>
                  <strong>{viewingOrder.account_server || viewingOrder.license?.device_id || 'Chưa liên kết'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>License Status</span>
                  <span style={{ color: viewingOrder.license?.status === 'active' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                    {viewingOrder.license?.status ? viewingOrder.license.status.toUpperCase() : 'INACTIVE'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>License Expiry Date</span>
                  <strong>{viewingOrder.expires_at ? new Date(viewingOrder.expires_at).toLocaleDateString() : 'Không thời hạn (Lifetime)'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'completed')}
                disabled={updatingOrderStatus || viewingOrder.status === 'completed'}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--success-color)' }}
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'pending')}
                disabled={updatingOrderStatus || viewingOrder.status === 'pending'}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}
              >
                Mark Pending
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'failed')}
                disabled={updatingOrderStatus || viewingOrder.status === 'failed'}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}
              >
                Mark Failed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW USER PROFILE DETAILS */}
      {viewingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>User Profile details & Secrets</h2>
              <button onClick={() => setViewingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="responsive-grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Họ Tên</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{viewingUser.full_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Email</span>
                <strong style={{ fontSize: '1rem' }}>{viewingUser.email}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Vai trò</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px',
                  background: viewingUser.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: viewingUser.role === 'admin' ? '#a855f7' : 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginTop: '0.25rem'
                }}>
                  {viewingUser.role}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Số Dư Ví Wallet</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--success-color)' }}>${viewingUser.balance.toFixed(2)}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Số điện thoại</span>
                <strong>{viewingUser.phone_number || 'Chưa thiết lập'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Ngày sinh</span>
                <strong>{viewingUser.date_of_birth || 'Chưa thiết lập'}</strong>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Địa chỉ</span>
                <strong>{viewingUser.address || 'Chưa thiết lập'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Ngày Đăng Ký</span>
                <strong>{new Date(viewingUser.created_at).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Đăng nhập cuối</span>
                <strong>{viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString() : 'Never'}</strong>
              </div>
            </div>

            {/* Masked Sensitive Fields Section */}
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                Sensitive Data & Secrets Boundaries
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Hashed Password Field */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.7rem', display: 'inline-block', marginRight: '0.5rem' }}>Password Hash (Secret)</label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Stored as hash; cannot reveal</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="text"
                      readOnly
                      className="form-control"
                      style={{ fontSize: '0.8rem', height: '32px', fontFamily: 'monospace' }}
                      value="************************************************"
                    />
                  </div>
                </div>

                {/* API Key placeholder/License key example */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>API Key / License Key hash</label>
                    <button
                      type="button"
                      onClick={() => toggleShowSensitive('apiKey')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-solid)', fontSize: '0.75rem' }}
                    >
                      {showSensitives['apiKey'] ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Reveal</>}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    className="form-control"
                    style={{ fontSize: '0.8rem', height: '32px', fontFamily: 'monospace' }}
                    value={showSensitives['apiKey'] ? `lt_98a723bcdeff12019ab98273641abc65d9e8f172` : `************************************************`}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleToggleSoftDeleteUser(viewingUser)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', borderColor: viewingUser.is_deleted ? 'var(--success-color)' : 'var(--error-color)', color: viewingUser.is_deleted ? 'var(--success-color)' : 'var(--error-color)' }}
              >
                {viewingUser.is_deleted ? 'Restore user' : 'Suspend user (soft-delete)'}
              </button>
              <button
                onClick={() => { setViewingUser(null); handleStartEditUser(viewingUser); }}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER PROFILE */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Chỉnh sửa tài khoản</h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input type="text" required value={editUserFullName} onChange={e => setEditUserFullName(e.target.value)} className="form-control" />
              </div>

              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Vai trò *</label>
                  <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none' }}>
                    <option value="user">User (Khách mua)</option>
                    <option value="admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số dư ví (USD) *</label>
                  <input type="number" step="0.01" required value={editUserBalance} onChange={e => setEditUserBalance(e.target.value)} className="form-control" />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Số Điện Thoại</label>
                  <input type="text" value={editUserPhone} onChange={e => setEditUserPhone(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày Sinh</label>
                  <input type="text" placeholder="e.g. 1995-10-15" value={editUserDOB} onChange={e => setEditUserDOB(e.target.value)} className="form-control" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Địa Chỉ</label>
                <textarea rows={2} value={editUserAddress} onChange={e => setEditUserAddress(e.target.value)} className="form-control" style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" disabled={updatingUser} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {updatingUser ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT VOUCHER */}
      {showVoucherModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {editingVoucher ? 'Edit Voucher Campaign' : 'Create New Voucher Campaign'}
              </h2>
              <button onClick={() => setShowVoucherModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateVoucher}>
              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Mã Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    className="form-control"
                    placeholder="e.g. TRADING30"
                    disabled={editingVoucher !== null}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên chiến dịch *</label>
                  <input type="text" required value={voucherName} onChange={e => setVoucherName(e.target.value)} className="form-control" placeholder="e.g. Summer Sale 2026" />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Loại chiết khấu *</label>
                  <select value={voucherDiscountType} onChange={e => setVoucherDiscountType(e.target.value)} className="form-control" style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none' }}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền mặt định mức ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá trị giảm *</label>
                  <input type="number" step="0.01" min="0" required value={voucherDiscountValue} onChange={e => setVoucherDiscountValue(e.target.value)} className="form-control" placeholder="e.g. 20 or 50.00" />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu *</label>
                  <input type="datetime-local" required value={voucherStartDate} onChange={e => setVoucherStartDate(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input type="datetime-local" required value={voucherEndDate} onChange={e => setVoucherEndDate(e.target.value)} className="form-control" />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="form-group">
                  <label className="form-label">Giới hạn số lượt dùng (Optional)</label>
                  <input type="number" min="1" value={voucherUsageLimit} onChange={e => setVoucherUsageLimit(e.target.value)} className="form-control" placeholder="e.g. 100 (Để trống = Vô hạn)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sản phẩm áp dụng (Optional ID)</label>
                  <input type="text" value={voucherProductScope} onChange={e => setVoucherProductScope(e.target.value)} className="form-control" placeholder="Mã UUID sản phẩm (Trống = Toàn sàn)" />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="voucherIsActive"
                  checked={voucherIsActive}
                  onChange={e => setVoucherIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="voucherIsActive" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Kích hoạt chiến dịch / voucher ngay
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowVoucherModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" disabled={submittingVoucher} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submittingVoucher ? 'Đang lưu...' : 'Lưu Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={!!confirmingProductDelete}
        title="Xác nhận xóa sản phẩm"
        message={
          <>Bạn có chắc muốn xóa sản phẩm <strong style={{ color: '#fff' }}>{confirmingProductDelete?.title}</strong>?</>
        }
        confirmLabel="Có"
        cancelLabel="Không"
        loading={confirmingProductDeleteLoading}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => {
          if (!confirmingProductDeleteLoading) setConfirmingProductDelete(null);
        }}
      />

      <ConfirmationDialog
        open={!!confirmingUserAction}
        title={confirmingUserAction?.is_deleted ? 'Restore user account?' : 'Suspend user account?'}
        message={
          confirmingUserAction?.is_deleted
            ? <>Bạn có chắc muốn khôi phục tài khoản <strong style={{ color: '#fff' }}>{confirmingUserAction.full_name}</strong>?</>
            : <>Bạn có chắc muốn tạm ngưng/xóa tài khoản <strong style={{ color: '#fff' }}>{confirmingUserAction?.full_name}</strong>?</>
        }
        confirmLabel="Có"
        cancelLabel="Không"
        loading={confirmingUserActionLoading}
        onConfirm={handleConfirmToggleSoftDeleteUser}
        onCancel={() => {
          if (!confirmingUserActionLoading) setConfirmingUserAction(null);
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
export default Admin;
