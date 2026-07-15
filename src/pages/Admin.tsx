import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL } from '../utils/api';
import { getExchangeRate } from '../api/exchange';
import {
  Upload, Trash2, History, Plus, FileCode, CreditCard,
  DollarSign, Edit, Eye, EyeOff, Search, Users, Tag,
  Calendar, ShoppingBag, RefreshCw, X, AlertTriangle, Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { activeSortedVariants, formatVariantDuration, shortestVariant } from '../utils/variants';
import { Box, Container, Typography, Button, InputBase, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnPrimarySx, btnSecondarySx, pageContainerSx, pageTitleSx } from '../theme';

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

interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  amount_paid: number;
  purchase_date: string;
  status: string;
  expires_at?: string;
  voucher_code?: string;
  order_code?: number;
  variant_name?: string;
  variant_price?: number;
  variant_duration_days?: number;
  variant_duration_months?: number;
  variant_is_lifetime?: boolean;
}

interface OrderDetail extends Order {
  purchases: Purchase[];
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

interface TopUpAdmin {
  id: string;
  user_id: string;
  amount: number;
  amount_vnd: number;
  currency: string;
  status: string;
  error_message: string | null;
  payment_reference: string;
  acb_transaction_id: string | null;
  qr_code: string | null;
  qr_image_base64: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  user?: User;
}

export const Admin: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Guard routing
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'vouchers' | 'topups'>('dashboard');

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
  const [replacingFileDragOver, setReplacingFileDragOver] = useState(false);
  const [replacingSelectedFile, setReplacingSelectedFile] = useState<File | null>(null);
  const [uploadingReplacingFile, setUploadingReplacingFile] = useState(false);

  // 3. Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState<OrderDetail | null>(null);
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

  // 6. TopUps State
  const [topUpsList, setTopUpsList] = useState<TopUpAdmin[]>([]);
  const [customQrUrl, setCustomQrUrl] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [deletingQr, setDeletingQr] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [topUpsSearch, setTopUpsSearch] = useState('');
  const [topUpsStatusFilter, setTopUpsStatusFilter] = useState('all');
  const [viewingTopUp, setViewingTopUp] = useState<TopUpAdmin | null>(null);
  const [editingTopUp, setEditingTopUp] = useState<TopUpAdmin | null>(null);
  const [showAddTopUpModal, setShowAddTopUpModal] = useState(false);
  const [topUpTargetUserId, setTopUpTargetUserId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(25000);

  // Edit form states
  const [editTopUpStatus, setEditTopUpStatus] = useState('pending');
  const [editTopUpErrorMessage, setEditTopUpErrorMessage] = useState('');
  const [editTopUpTransactionId, setEditTopUpTransactionId] = useState('');
  const [editTopUpPaidAt, setEditTopUpPaidAt] = useState('');
  const [updatingTopUp, setUpdatingTopUp] = useState(false);
  const [confirmingTopUpManualCredit, setConfirmingTopUpManualCredit] = useState<TopUpAdmin | null>(null);
  const [confirmingTopUpManualCreditLoading, setConfirmingTopUpManualCreditLoading] = useState(false);
  const [confirmingTopUpCancel, setConfirmingTopUpCancel] = useState<TopUpAdmin | null>(null);
  const [confirmingTopUpCancelLoading, setConfirmingTopUpCancelLoading] = useState(false);
  const [confirmingTopUpDelete, setConfirmingTopUpDelete] = useState<TopUpAdmin | null>(null);
  const [confirmingTopUpDeleteLoading, setConfirmingTopUpDeleteLoading] = useState(false);

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

  const loadTopUpsData = async () => {
    try {
      const [data, rateData] = await Promise.all([
        api.get<TopUpAdmin[]>('/api/admin/top-ups'),
        getExchangeRate().catch(() => null)
      ]);
      setTopUpsList(data);
      if (rateData && rateData.conversion_rate) {
        setExchangeRate(rateData.conversion_rate);
      }
      try {
        const qrData = await api.get<{ qr_code_url: string | null; has_custom_qr: boolean }>('/api/admin/settings/qr-code');
        setCustomQrUrl(qrData.qr_code_url);
      } catch (qrErr) {
        console.error('Failed to load custom QR settings', qrErr);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch top-up transactions.');
    }
  };

  const loadAllData = async (silent = false) => {
    const hasData =
      (activeTab === 'dashboard' && dashboardStats) ||
      (activeTab === 'products' && products.length > 0) ||
      (activeTab === 'orders' && orders.length > 0) ||
      (activeTab === 'users' && usersList.length > 0) ||
      (activeTab === 'vouchers' && vouchers.length > 0) ||
      (activeTab === 'topups' && topUpsList.length > 0);

    const shouldShowSpinner = !silent && !hasData;

    if (shouldShowSpinner) {
      setLoading(true);
    }
    setError('');
    try {
      if (activeTab === 'dashboard') await loadDashboardData();
      else if (activeTab === 'products') await loadProductsData();
      else if (activeTab === 'orders') await loadOrdersData();
      else if (activeTab === 'users') await loadUsersData();
      else if (activeTab === 'vouchers') await loadVouchersData();
      else if (activeTab === 'topups') await loadTopUpsData();
    } catch (err) {
      // Caught inside subfunctions
    } finally {
      if (shouldShowSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  // Handle Date range filter
  const handleFilterDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboardData();
  };

  const handleResetDashboard = () => {
    setStartDate('');
    setEndDate('');
    api.get<any>('/api/admin/dashboard').then((stats) => {
      setDashboardStats(stats);
    }).catch((err) => {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    });
  };

  // Image Upload helpers for creating product
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProductImageFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'Kích thước tệp ảnh vượt quá giới hạn 10MB.', type: 'error' });
      return;
    }
    setProductImageFile(file);
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const buildVariantFromForm = (): DraftProductVariant | null => {
    if (!newVariantName.trim() || !newVariantPrice.trim()) {
      setToast({ message: 'Vui lòng điền đầy đủ tên gói và giá.', type: 'error' });
      return null;
    }

    const priceVal = parseFloat(newVariantPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setToast({ message: 'Giá phải là số hợp lệ không âm.', type: 'error' });
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
        setToast({ message: 'Thời hạn phải là một số nguyên dương hợp lệ.', type: 'error' });
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
      setToast({ message: 'Yêu cầu ít nhất một gói bản quyền.', type: 'error' });
      return;
    }
    setDraftProductVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftProductVariants.length === 0) {
      setToast({ message: 'Vui lòng thêm ít nhất một gói bản quyền hợp lệ trước khi tạo sản phẩm.', type: 'error' });
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
      setToast({ message: 'Tạo sản phẩm thành công!', type: 'success' });

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
      setToast({ message: err.message || 'Không thể tạo sản phẩm.', type: 'error' });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleUploadFileDirect = async (productId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.postForm(`/api/admin/products/${productId}/upload-file`, formData);
      setToast({ message: 'Cập nhật file binary công cụ thành công!', type: 'success' });
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tải lên file binary.', type: 'error' });
    } finally {
      setReplacingProductId(null);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setConfirmingProductDelete(product);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!confirmingProductDelete || confirmingProductDeleteLoading) return;

    const productId = confirmingProductDelete.id;
    try {
      setConfirmingProductDeleteLoading(true);
      await api.delete(`/api/admin/products/${productId}`);
      setToast({ message: 'Xóa sản phẩm thành công!', type: 'success' });
      loadProductsData();
      setConfirmingProductDelete(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể xóa sản phẩm.', type: 'error' });
    } finally {
      setConfirmingProductDeleteLoading(false);
    }
  };

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
      setToast({ message: 'Cập nhật thông tin sản phẩm thành công!', type: 'success' });
      setEditingProduct(null);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể cập nhật thông tin sản phẩm.', type: 'error' });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleAddVariant = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!newVariantName.trim() || !newVariantPrice.trim()) {
      setToast({ message: 'Vui lòng điền đầy đủ tên gói và giá.', type: 'error' });
      return;
    }

    const priceVal = parseFloat(newVariantPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setToast({ message: 'Giá phải là số hợp lệ không âm.', type: 'error' });
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
        setToast({ message: 'Thời hạn phải là một số nguyên dương hợp lệ.', type: 'error' });
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

      setToast({ message: 'Đã tạo gói bản quyền thành công!', type: 'success' });
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantDurationValue('');

      const updatedProduct = await api.get<Product>(`/api/products/${editingProduct.id}`);
      setEditingProduct(updatedProduct);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo gói bản quyền.', type: 'error' });
    } finally {
      setAddingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!editingProduct) return;
    if (activeSortedVariants(editingProduct.variants).length <= 1) {
      setToast({ message: 'Không thể xóa gói bản quyền duy nhất còn hoạt động.', type: 'error' });
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa gói bản quyền này không?')) return;

    try {
      setDeletingVariantId(variantId);
      await api.delete(`/api/admin/products/${editingProduct.id}/variants/${variantId}`);
      setToast({ message: 'Đã xóa gói bản quyền thành công!', type: 'success' });

      const updatedProduct = await api.get<Product>(`/api/products/${editingProduct.id}`);
      setEditingProduct(updatedProduct);
      loadProductsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể xóa gói bản quyền.', type: 'error' });
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleViewOrderDetail = async (orderId: string) => {
    try {
      const data = await api.get<OrderDetail>(`/api/admin/orders/${orderId}`);
      setViewingOrder(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể lấy thông tin chi tiết đơn hàng.', type: 'error' });
    }
  };

  const handleUpdateOrderStatus = async (purchaseId: string, newStatus: string) => {
    setUpdatingOrderStatus(true);
    try {
      await api.put<Order>(`/api/admin/orders/${purchaseId}?new_status=${newStatus}`, {});
      const statusText = newStatus === 'completed' ? 'Hoàn thành' : newStatus === 'pending' ? 'Chờ xử lý' : 'Thất bại';
      setToast({ message: `Đã cập nhật trạng thái đơn hàng thành ${statusText}!`, type: 'success' });
      setOrders(orders.map(o => o.id === purchaseId ? { ...o, status: newStatus } : o));
      if (viewingOrder && viewingOrder.id === purchaseId) {
        handleViewOrderDetail(purchaseId);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Cập nhật trạng thái đơn hàng thất bại.', type: 'error' });
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // User Management
  const handleStartEditUser = (u: User) => {
    // Tài khoản đã tạm ngưng chỉ được xem chi tiết hoặc kích hoạt lại, không cho mở form chỉnh sửa.
    if (u.is_deleted) return;

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
        throw new Error('Số dư phải là số hợp lệ.');
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
      setToast({ message: 'Cập nhật người dùng thành công!', type: 'success' });
      setUsersList(usersList.map(u => u.id === editingUser.id ? updated : u));
      if (viewingUser && viewingUser.id === editingUser.id) {
        setViewingUser(updated);
      }
      setEditingUser(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Cập nhật thông tin người dùng thất bại.', type: 'error' });
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
        setToast({ message: 'Đã khôi phục tài khoản người dùng thành công!', type: 'success' });
      } else {
        await api.delete(`/api/admin/users/${u.id}`);
        setToast({ message: 'Đã tạm ngưng tài khoản người dùng thành công!', type: 'success' });
      }
      loadUsersData();
      if (viewingUser && viewingUser.id === u.id) {
        setViewingUser({ ...viewingUser, is_deleted: !u.is_deleted });
      }
      setConfirmingUserAction(null);
    } catch (err: any) {
      const displayAction = actionText === 'restore' ? 'khôi phục' : 'tạm ngưng';
      setToast({ message: err.message || `Không thể ${displayAction} tài khoản người dùng.`, type: 'error' });
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
    setVoucherStartDate(v.start_date.substring(0, 16));
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
        setToast({ message: 'Cập nhật chiến dịch Voucher thành công!', type: 'success' });
      } else {
        await api.post('/api/admin/vouchers', payload);
        setToast({ message: 'Tạo chiến dịch Voucher thành công!', type: 'success' });
      }
      setShowVoucherModal(false);
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
      setToast({ message: err.message || 'Không thể lưu chiến dịch Voucher.', type: 'error' });
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn chiến dịch voucher này không?')) {
      return;
    }
    try {
      await api.delete(`/api/admin/vouchers/${voucherId}`);
      setToast({ message: 'Xóa chiến dịch Voucher thành công!', type: 'success' });
      loadVouchersData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể xóa voucher.', type: 'error' });
    }
  };

  // Top-Up Management Handlers
  const handleCreateTopUpAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpTargetUserId || !topUpAmount) {
      setToast({ message: 'Vui lòng chọn khách hàng và nhập số tiền.', type: 'error' });
      return;
    }
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      setToast({ message: 'Số tiền phải là một số dương.', type: 'error' });
      return;
    }
    setSubmittingTopUp(true);
    try {
      await api.post('/api/admin/top-ups', {
        user_id: topUpTargetUserId,
        amount: amt
      });
      setToast({ message: 'Tạo yêu cầu nạp tiền thành công!', type: 'success' });
      setShowAddTopUpModal(false);
      setTopUpTargetUserId('');
      setTopUpAmount('');
      loadTopUpsData();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo yêu cầu nạp tiền.', type: 'error' });
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const handleStartEditTopUp = (t: TopUpAdmin) => {
    setEditingTopUp(t);
    setEditTopUpStatus(t.status);
    setEditTopUpErrorMessage(t.error_message || '');
    setEditTopUpTransactionId(t.acb_transaction_id || '');
    setEditTopUpPaidAt(t.paid_at ? t.paid_at.substring(0, 16) : '');
  };

  const handleUpdateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopUp) return;
    setUpdatingTopUp(true);
    try {
      const payload: any = {
        status: editTopUpStatus,
        error_message: editTopUpErrorMessage || null,
        acb_transaction_id: editTopUpTransactionId || null,
        paid_at: editTopUpPaidAt ? new Date(editTopUpPaidAt).toISOString() : null
      };
      const updated = await api.put<TopUpAdmin>(`/api/admin/top-ups/${editingTopUp.id}`, payload);
      setToast({ message: 'Cập nhật yêu cầu nạp tiền thành công!', type: 'success' });
      setTopUpsList(topUpsList.map(t => t.id === editingTopUp.id ? updated : t));
      if (viewingTopUp && viewingTopUp.id === editingTopUp.id) {
        setViewingTopUp(updated);
      }
      setEditingTopUp(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể cập nhật yêu cầu nạp tiền.', type: 'error' });
    } finally {
      setUpdatingTopUp(false);
    }
  };

  const handleCancelTopUpAdmin = (topUp: TopUpAdmin) => {
    setConfirmingTopUpCancel(topUp);
  };

  const handleConfirmCancelTopUpAdmin = async () => {
    if (!confirmingTopUpCancel || confirmingTopUpCancelLoading) return;
    const topUp = confirmingTopUpCancel;
    try {
      setConfirmingTopUpCancelLoading(true);
      const updated = await api.post<TopUpAdmin>(`/api/admin/top-ups/${topUp.id}/cancel`, {});
      setToast({ message: 'Hủy yêu cầu nạp tiền thành công!', type: 'success' });
      setTopUpsList(topUpsList.map(t => t.id === topUp.id ? updated : t));
      if (viewingTopUp && viewingTopUp.id === topUp.id) {
        setViewingTopUp(updated);
      }
      setConfirmingTopUpCancel(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Hủy yêu cầu nạp tiền thất bại.', type: 'error' });
    } finally {
      setConfirmingTopUpCancelLoading(false);
    }
  };

  const handleConfirmManualCreditTopUp = async () => {
    if (!confirmingTopUpManualCredit || confirmingTopUpManualCreditLoading) return;
    const topUp = confirmingTopUpManualCredit;
    try {
      setConfirmingTopUpManualCreditLoading(true);
      const updated = await api.post<TopUpAdmin>(`/api/admin/top-ups/${topUp.id}/manual-credit`, {});
      setToast({ message: 'Đã cộng tiền thủ công và cập nhật số dư khách hàng thành công!', type: 'success' });
      setTopUpsList(topUpsList.map(t => t.id === topUp.id ? updated : t));
      if (viewingTopUp && viewingTopUp.id === topUp.id) {
        setViewingTopUp(updated);
      }

      if (updated.user) {
        setUsersList(prev => prev.map(u => u.id === updated.user_id ? { ...u, balance: updated.user!.balance } : u));
        if (viewingUser && viewingUser.id === updated.user_id) {
          setViewingUser(prev => prev ? { ...prev, balance: updated.user!.balance } : null);
        }
        if (user && user.id === updated.user_id) {
          refreshUser();
        }
      }
      setConfirmingTopUpManualCredit(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể cộng tiền thủ công.', type: 'error' });
    } finally {
      setConfirmingTopUpManualCreditLoading(false);
    }
  };

  const handleManualCreditTopUp = (topUp: TopUpAdmin) => {
    setConfirmingTopUpManualCredit(topUp);
  };

  const handleDeleteTopUp = (topUp: TopUpAdmin) => {
    setConfirmingTopUpDelete(topUp);
  };

  const handleConfirmDeleteTopUp = async () => {
    if (!confirmingTopUpDelete || confirmingTopUpDeleteLoading) return;
    const topUp = confirmingTopUpDelete;
    try {
      setConfirmingTopUpDeleteLoading(true);
      await api.delete(`/api/admin/top-ups/${topUp.id}`);
      setToast({ message: 'Xóa bản ghi nạp tiền thành công!', type: 'success' });
      setTopUpsList(topUpsList.filter(t => t.id !== topUp.id));
      if (viewingTopUp && viewingTopUp.id === topUp.id) {
        setViewingTopUp(null);
      }
      setConfirmingTopUpDelete(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể xóa bản ghi nạp tiền.', type: 'error' });
    } finally {
      setConfirmingTopUpDeleteLoading(false);
    }
  };

  const handleManualRefresh = async (topUpId: string) => {
    try {
      const updated = await api.get<TopUpAdmin>(`/api/admin/top-ups/${topUpId}`);
      setTopUpsList(topUpsList.map(t => t.id === topUpId ? updated : t));
      if (viewingTopUp && viewingTopUp.id === topUpId) {
        setViewingTopUp(updated);
      }
      setToast({ message: 'Cập nhật trạng thái giao dịch thành công.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể cập nhật trạng thái giao dịch.', type: 'error' });
    }
  };

  const handleUploadQrCode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Vui lòng chọn file hình ảnh hợp lệ.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingQr(true);
    try {
      const data = await api.postForm<{ qr_code_url: string; has_custom_qr: boolean }>('/api/admin/settings/qr-code', formData);
      setCustomQrUrl(data.qr_code_url);
      setToast({ message: 'Upload custom QR code thành công!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Upload custom QR code thất bại.', type: 'error' });
    } finally {
      setUploadingQr(false);
    }
  };

  const handleDeleteQrCode = async () => {
    setDeletingQr(true);
    try {
      await api.delete('/api/admin/settings/qr-code');
      setCustomQrUrl(null);
      setToast({ message: 'Đã xóa custom QR code thành công!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Xóa custom QR code thất bại.', type: 'error' });
    } finally {
      setDeletingQr(false);
    }
  };

  const toggleShowSensitive = (field: string) => {
    setShowSensitives(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.user && o.user.email.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.user && o.user.full_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.product && o.product.title.toLowerCase().includes(orderSearch.toLowerCase()));

    if (orderStatusFilter === 'all') return matchesSearch;
    return matchesSearch && o.status.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  const filteredUsers = usersList.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTopUps = topUpsList.filter(t => {
    const email = t.user?.email || '';
    const name = t.user?.full_name || '';
    const ref = t.payment_reference || '';
    const matchesSearch =
      email.toLowerCase().includes(topUpsSearch.toLowerCase()) ||
      name.toLowerCase().includes(topUpsSearch.toLowerCase()) ||
      ref.toLowerCase().includes(topUpsSearch.toLowerCase());

    if (topUpsStatusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status.toLowerCase() === topUpsStatusFilter.toLowerCase();
  });

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Typography sx={{ color: 'error.main', fontSize: '1.2rem', fontWeight: 600 }}>Truy cập bị Từ chối. Đang chuyển hướng...</Typography>
      </Box>
    );
  }

  const inputSx = {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: '"Outfit", sans-serif',
    '& input': { padding: 0, '&::placeholder': { color: '#6b7280', opacity: 1 } }
  };

  const selectSx = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: '"Outfit", sans-serif',
    height: '40px',
    width: '100%',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
  };

  const menuProps = {
    slotProps: {
      paper: {
        sx: {
          backgroundColor: '#141621',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          '& .MuiMenuItem-root': {
            fontSize: '0.9rem',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            '&.Mui-selected': {
              backgroundColor: '#6366f1',
              color: '#fff',
              '&:hover': { backgroundColor: '#4f46e5' }
            }
          }
        }
      }
    }
  };

  return (
    <>
      <Container
        maxWidth="xl"
        sx={pageContainerSx}
      >
        {/* Title Section */}
        <Box sx={{ marginBottom: { xs: '1.5rem', md: '2rem' }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: '1rem' }}>
          <Box>
            <Typography variant="h1" sx={{ ...pageTitleSx, marginBottom: '0.25rem' }}>
              Không gian Quản lý Admin
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Thống kê hệ thống, danh mục sản phẩm, nhật ký đơn hàng, danh bạ tài khoản người dùng và chiến dịch voucher.
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              loadAllData();
            }}
            sx={{ ...btnSecondarySx, height: '42px', display: 'flex', gap: '0.5rem', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}
          >
            <RefreshCw size={16} />
            Đồng bộ Dữ liệu
          </Button>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{
          ...glassPanelSx,
          display: 'flex',
          padding: '0.4rem',
          gap: '0.4rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          width: '100%',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: '4px' }
        }}>
          {[
            { id: 'dashboard', label: 'Bảng điều khiển', icon: <CreditCard size={14} /> },
            { id: 'products', label: 'Quản lý sản phẩm', icon: <FileCode size={14} /> },
            { id: 'orders', label: 'Quản lý đơn hàng', icon: <ShoppingBag size={14} /> },
            { id: 'users', label: 'Quản lý tài khoản', icon: <Users size={14} /> },
            { id: 'vouchers', label: 'Chiến dịch sale / voucher', icon: <Tag size={14} /> },
            { id: 'topups', label: 'Quản lý nạp tiền', icon: <Coins size={14} /> }
          ].map(t => {
            const isSel = activeTab === t.id;
            return (
              <Button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                sx={{
                  ...(isSel ? btnPrimarySx : btnSecondarySx),
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: '0 0 auto',
                  minWidth: 'max-content',
                  '& svg': { flexShrink: 0 }
                }}
              >
                {t.icon}
                {t.label}
              </Button>
            );
          })}
        </Box>

        {/* Global Error Banner */}
        {error && (
          <Box sx={{ ...glassPanelSx, padding: '1rem 1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'error.main', fontWeight: 600 }}>
            {error}
          </Box>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box sx={{
            animation: 'fadeIn 0.3s ease forwards',
            '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } }
          }}>

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && dashboardStats && (
              <Box>
                {/* Date Filter Panel */}
                <Box component="form" onSubmit={handleFilterDashboard} sx={{ ...glassPanelSx, padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                  <Box sx={{ flex: '1', minWidth: '200px' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', marginBottom: '0.5rem', fontWeight: 600 }}>Từ Ngày</Typography>
                    <InputBase type="date" value={startDate} onChange={e => setStartDate(e.target.value)} sx={{ ...inputSx, '& input': { colorScheme: 'dark', padding: 0 } }} />
                  </Box>
                  <Box sx={{ flex: '1', minWidth: '200px' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', marginBottom: '0.5rem', fontWeight: 600 }}>Đến Ngày</Typography>
                    <InputBase type="date" value={endDate} onChange={e => setEndDate(e.target.value)} sx={{ ...inputSx, '& input': { colorScheme: 'dark', padding: 0 } }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                    <Button type="submit" sx={{ ...btnPrimarySx, padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}>Lọc</Button>
                    <Button type="button" onClick={handleResetDashboard} sx={{ ...btnSecondarySx, padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}>Đặt lại</Button>
                  </Box>
                </Box>

                {/* KPI Cards Grid */}
                <Grid container spacing={3} sx={{ marginBottom: '2.5rem' }}>
                  {[
                    { title: 'Doanh thu Tổng', val: `$${dashboardStats.kpis.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'success.main', bg: 'rgba(16, 185, 129, 0.15)', icon: <DollarSign size={24} /> },
                    { title: 'Tổng đơn hàng', val: `${dashboardStats.kpis.total_orders} Hoàn thành`, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', icon: <ShoppingBag size={24} /> },
                    { title: 'Công cụ hoạt động', val: `${dashboardStats.kpis.active_products} đăng bán`, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: <FileCode size={24} /> },
                    { title: 'Chờ tải file', val: `${dashboardStats.kpis.pending_uploads} công cụ`, color: 'warning.main', bg: 'rgba(245, 158, 11, 0.15)', icon: <AlertTriangle size={24} /> },
                    { title: 'Đăng ký mới', val: `${dashboardStats.kpis.new_users_registered} người dùng`, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', icon: <Users size={24} /> }
                  ].map((card, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
                      <Box sx={{ ...glassPanelSx, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', height: '100%' }}>
                        <Box sx={{ background: card.bg, color: card.color, padding: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                          {card.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>{card.title}</Typography>
                          <Typography component="strong" sx={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>{card.val}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Charts & Trends Breakdown */}
                <Grid container spacing={4} sx={{ marginBottom: '2.5rem' }}>
                  {/* Revenue & Sales Daily Table */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ ...glassPanelSx, padding: '2rem', height: '100%' }}>
                      <Typography variant="h3" sx={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <DollarSign size={18} color="#10b981" /> Nhật ký Doanh thu & Thanh toán Hàng ngày
                      </Typography>
                      <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày</TableCell>
                              <TableCell align="center" sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Đơn hàng</TableCell>
                              <TableCell align="right" sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Doanh thu</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dashboardStats.revenue_by_day.length === 0 ? (
                              <TableRow><TableCell colSpan={3} align="center" sx={{ borderBottom: 'none', color: 'text.disabled' }}>Không có thống kê nào được ghi nhận</TableCell></TableRow>
                            ) : (
                              dashboardStats.revenue_by_day.map((day) => {
                                const matchingOrders = dashboardStats.orders_by_day.find(o => o.date === day.date)?.count || 0;
                                return (
                                  <TableRow key={day.date} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <TableCell sx={{ padding: '0.65rem 0.5rem', borderBottom: 'none' }}>{day.date}</TableCell>
                                    <TableCell align="center" sx={{ padding: '0.65rem 0.5rem', borderBottom: 'none' }}>{matchingOrders}</TableCell>
                                    <TableCell align="right" sx={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'success.main', borderBottom: 'none' }}>${day.amount.toFixed(2)}</TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  </Grid>

                  {/* User registrations Table */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ ...glassPanelSx, padding: '2rem', height: '100%' }}>
                      <Typography variant="h3" sx={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <Users size={18} color="#a855f7" /> Xu hướng Đăng ký Người dùng Hàng ngày
                      </Typography>
                      <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày</TableCell>
                              <TableCell align="right" sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Số lượng đăng ký mới</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dashboardStats.registrations_by_day.length === 0 ? (
                              <TableRow><TableCell colSpan={2} align="center" sx={{ borderBottom: 'none', color: 'text.disabled' }}>Không có người dùng mới đăng ký</TableCell></TableRow>
                            ) : (
                              dashboardStats.registrations_by_day.map((day) => (
                                <TableRow key={day.date} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <TableCell sx={{ padding: '0.65rem 0.5rem', borderBottom: 'none' }}>{day.date}</TableCell>
                                  <TableCell align="right" sx={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: '#a855f7', borderBottom: 'none' }}>{day.count}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Recent Orders List */}
                <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <History size={20} color="#6366f1" /> Lịch sử Giao dịch Gần đây
                  </Typography>
                  {dashboardStats.recent_orders.length === 0 ? (
                    <Typography sx={{ color: 'text.disabled' }}>Không tìm thấy giao dịch nào.</Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                          <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Thời gian</TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Khách Hàng</TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Sản Phẩm</TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Giá Thanh Toán</TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng Thái</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardStats.recent_orders.map((tx) => (
                            <TableRow key={tx.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <TableCell sx={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                                {new Date(tx.purchase_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                              </TableCell>
                              <TableCell sx={{ padding: '0.85rem 0.5rem', borderBottom: 'none' }}>
                                <Typography component="strong" sx={{ display: 'block', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{tx.user_name}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{tx.user_email}</Typography>
                              </TableCell>
                              <TableCell sx={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem', color: 'text.secondary', borderBottom: 'none' }}>
                                {tx.product_title}
                              </TableCell>
                              <TableCell sx={{ padding: '0.85rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                                ${tx.amount_paid.toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ padding: '0.85rem 0.5rem', borderBottom: 'none' }}>
                                <Box component="span" sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: tx.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: tx.status === 'completed' ? 'success.main' : 'warning.main',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '10px',
                                  textTransform: 'uppercase'
                                }}>
                                  {tx.status}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <Box sx={{ position: 'relative', width: '320px' }}>
                    <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                    <InputBase
                      placeholder="Tìm kiếm sản phẩm..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      sx={{ ...inputSx, paddingLeft: '2.5rem', height: '40px' }}
                    />
                  </Box>
                  <Button onClick={() => setShowAddProductModal(true)} sx={{ ...btnPrimarySx, height: '40px' }}>
                    <Plus size={16} /> Thêm sản phẩm mới
                  </Button>
                </Box>

                {filteredProducts.length === 0 ? (
                  <Typography sx={{ color: 'text.disabled', textAlign: 'center', padding: '3rem 0' }}>Không có sản phẩm nào được đăng bán.</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Thông tin sản phẩm</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Phân loại</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Giá từ</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng Thái File</TableCell>
                          <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredProducts.map((p) => {
                          const isPending = !p.has_file;
                          const displayVariant = shortestVariant(p.variants);
                          return (
                            <TableRow key={p.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Box sx={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  background: 'rgba(0,0,0,0.2)',
                                  flexShrink: 0
                                }}>
                                  <Box
                                    component="img"
                                    src={p.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&auto=format&fit=crop&q=60'}
                                    alt={p.title}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </Box>
                                <Box>
                                  <Typography component="strong" sx={{ display: 'block', color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>{p.title}</Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>ID: {p.id}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'text.secondary' }}>
                                  {p.category}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                                {displayVariant ? `$${displayVariant.price.toFixed(2)}` : 'Chưa cấu hình gói'}
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Box component="span" sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '10px',
                                  background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isPending ? 'warning.main' : 'success.main'
                                }}>
                                  {isPending ? 'Chờ tải lên file' : 'Active (Có file)'}
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Box sx={{ display: 'inline-flex', gap: '0.5rem' }}>
                                  <Button
                                    onClick={() => {
                                      setReplacingProductId(p.id);
                                      setReplacingSelectedFile(null);
                                    }}
                                    sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.08)' }}
                                    title={isPending ? "Tải lên file code" : "Thay thế file code"}
                                  >
                                    <Upload size={14} color={isPending ? '#f59e0b' : '#9ca3af'} />
                                  </Button>
                                  <Button
                                    onClick={() => handleStartEditProduct(p)}
                                    sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                  >
                                    <Edit size={14} color="#6366f1" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteProduct(p)}
                                    sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(239,68,68,0.2)' }}
                                  >
                                    <Trash2 size={14} color="#ef4444" />
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>


                  </Box>
                )}
              </Box>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === 'orders' && (
              <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <Box sx={{ position: 'relative', width: '320px' }}>
                    <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                    <InputBase
                      placeholder="Tìm kiếm theo người mua hoặc sản phẩm..."
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      sx={{ ...inputSx, paddingLeft: '2.5rem', height: '40px' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase' }}>Trạng Thái:</Typography>
                    <FormControl sx={{ width: '150px' }}>
                      <Select
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                        sx={selectSx}
                        MenuProps={menuProps}
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="pending">Chờ xử lý</MenuItem>
                        <MenuItem value="failed">Thất bại</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {filteredOrders.length === 0 ? (
                  <Typography sx={{ color: 'text.disabled', textAlign: 'center', padding: '3rem 0' }}>Không tìm thấy đơn hàng nào khớp với điều kiện.</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Mã Đơn Hàng</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày đặt</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Khách hàng</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Sản phẩm</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Giá Thanh Toán</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng thái</TableCell>
                          <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOrders.map((o) => (
                          <TableRow key={o.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', borderBottom: 'none' }}>
                              {o.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                              {new Date(o.purchase_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Typography component="strong" sx={{ display: 'block', fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{o.user?.full_name || 'Guest'}</Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{o.user?.email || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                              {o.product?.title || 'Unknown Product'}
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                              ${o.amount_paid.toFixed(2)}
                              {o.voucher_code && (
                                <Box component="span" sx={{ display: 'block', fontSize: '0.7rem', color: 'success.main' }}>
                                  Voucher: {o.voucher_code}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Box component="span" sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                background: (o.status === 'completed' || o.status === 'active') ? 'rgba(16, 185, 129, 0.15)' : o.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: (o.status === 'completed' || o.status === 'active') ? 'success.main' : o.status === 'pending' ? 'warning.main' : 'error.main',
                                textTransform: 'uppercase'
                              }}>
                                {o.status}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Button
                                onClick={() => handleViewOrderDetail(o.id)}
                                sx={{ ...btnSecondarySx, padding: '0.45rem 0.85rem', fontSize: '0.85rem', height: '34px' }}
                              >
                                <Eye size={14} /> Chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 4: USERS */}
            {activeTab === 'users' && (
              <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <Box sx={{ position: 'relative', width: '320px' }}>
                    <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                    <InputBase
                      placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      sx={{ ...inputSx, paddingLeft: '2.5rem', height: '40px' }}
                    />
                  </Box>
                </Box>

                {filteredUsers.length === 0 ? (
                  <Typography sx={{ color: 'text.disabled', textAlign: 'center', padding: '3rem 0' }}>Chưa có người dùng nào đăng ký.</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 850 }}>
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Họ Tên & Email</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Vai trò</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Số dư ví</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày đăng ký</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng thái</TableCell>
                          <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Typography component="strong" sx={{ display: 'block', fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{u.full_name}</Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{u.email}</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Box component="span" sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: u.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: u.role === 'admin' ? '#a855f7' : 'text.secondary',
                                textTransform: 'uppercase'
                              }}>
                                {u.role}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                              ${u.balance.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                              {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </TableCell>
                            <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Box component="span" sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: u.is_deleted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: u.is_deleted ? 'error.main' : 'success.main'
                              }}>
                                {u.is_deleted ? 'Tạm ngưng' : 'Hoạt động'}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                              <Box sx={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <Button
                                  onClick={() => setViewingUser(u)}
                                  sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px' }}
                                  title="Xem thông tin chi tiết"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  onClick={() => handleStartEditUser(u)}
                                  disabled={u.is_deleted}
                                  sx={{
                                    ...btnSecondarySx,
                                    padding: '0.45rem',
                                    minWidth: 'auto',
                                    height: '34px',
                                    borderColor: 'rgba(99,102,241,0.2)',
                                    ...(u.is_deleted ? { opacity: 0.6 } : {}),
                                    '&.Mui-disabled': {
                                      opacity: 0.6,
                                      borderColor: 'rgba(99,102,241,0.2)'
                                    }
                                  }}
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit size={14} color="#6366f1" />
                                </Button>
                                <Button
                                  onClick={() => handleToggleSoftDeleteUser(u)}
                                  sx={{
                                    ...btnSecondarySx,
                                    padding: '0.45rem',
                                    minWidth: 'auto',
                                    height: '34px',
                                    borderColor: u.is_deleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239,68,68,0.2)'
                                  }}
                                  title={u.is_deleted ? "Kích hoạt lại tài khoản" : "Tạm ngưng tài khoản"}
                                >
                                  <Trash2 size={14} color={u.is_deleted ? '#10b981' : '#ef4444'} />
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 5: VOUCHERS */}
            {activeTab === 'vouchers' && (
              <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <Typography variant="h2" sx={{ fontSize: '1.3rem', fontWeight: 700 }}>Chiến dịch Sale & Voucher đang hoạt động</Typography>
                  <Button onClick={() => { setEditingVoucher(null); setShowVoucherModal(true); }} sx={{ ...btnPrimarySx, height: '40px' }}>
                    <Plus size={16} /> Tạo Voucher mới
                  </Button>
                </Box>

                {vouchers.length === 0 ? (
                  <Typography sx={{ color: 'text.disabled', textAlign: 'center', padding: '3rem 0' }}>Không có chiến dịch voucher nào.</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Mã / Chiến dịch</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Mức Giảm</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Thời Hạn Sử Dụng</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Lượt sử dụng / Giới hạn</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Phạm vi áp dụng</TableCell>
                          <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng thái</TableCell>
                          <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vouchers.map((v) => {
                          const now = new Date();
                          const isExpired = new Date(v.end_date) < now;
                          return (
                            <TableRow key={v.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Typography component="strong" sx={{ display: 'block', fontSize: '1.05rem', color: 'primary.main', fontFamily: 'monospace', fontWeight: 700 }}>{v.code}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{v.name}</Typography>
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                                {v.discount_type === 'percentage' ? `${v.discount_value}%` : `$${v.discount_value}`}
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Calendar size={12} color="#6b7280" />
                                  <Typography component="span" sx={{ fontSize: '0.85rem' }}>
                                    {new Date(v.start_date).toLocaleDateString(undefined, { dateStyle: 'short' })} - {new Date(v.end_date).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                {v.usage_count} / {v.usage_limit !== null && v.usage_limit !== undefined ? v.usage_limit : 'vô hạn'}
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                                {v.product_scope ? `Sản phẩm ID: ${v.product_scope.substring(0, 15)}...` : 'Tất cả cửa hàng (Storewide)'}
                              </TableCell>
                              <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Box component="span" sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '10px',
                                  background: isExpired ? 'rgba(239, 68, 68, 0.15)' : v.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                  color: isExpired ? 'error.main' : v.is_active ? 'success.main' : 'text.disabled'
                                }}>
                                  {isExpired ? 'Hết hạn' : v.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                <Box sx={{ display: 'inline-flex', gap: '0.5rem' }}>
                                  <Button
                                    onClick={() => handleStartEditVoucher(v)}
                                    sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                  >
                                    <Edit size={14} color="#6366f1" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteVoucher(v.id)}
                                    sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(239,68,68,0.2)' }}
                                  >
                                    <Trash2 size={14} color="#ef4444" />
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 6: TOPUPS */}
            {activeTab === 'topups' && (
              <>
                <Grid container spacing={4}>
                  {/* Left/Top Column: QR Settings Card */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ ...glassPanelSx, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
                      <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <Upload size={18} color="#6366f1" />
                        Cấu hình QR nhận tiền
                      </Typography>

                      {customQrUrl ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                          <Box
                            onClick={() => setQrPreviewUrl(customQrUrl.startsWith('http') ? customQrUrl : `${API_BASE_URL}${customQrUrl}`)}
                            sx={{ padding: '8px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Box
                              component="img"
                              src={customQrUrl.startsWith('http') ? customQrUrl : `${API_BASE_URL}${customQrUrl}`}
                              alt="Custom Bank QR Code"
                              sx={{ maxWidth: '100%', maxHeight: '100%', display: 'block', objectFit: 'contain' }}
                            />
                          </Box>
                          <Button
                            onClick={handleDeleteQrCode}
                            disabled={deletingQr}
                            sx={{
                              ...btnSecondarySx,
                              borderColor: 'rgba(239,68,68,0.2)',
                              color: 'error.main',
                              '&:hover': {
                                background: 'rgba(239, 68, 68, 0.08)',
                                borderColor: 'rgba(239, 68, 68, 0.3)'
                              },
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {deletingQr ? 'Đang xóa...' : (
                              <>
                                <Trash2 size={16} />
                                Xóa QR Code
                              </>
                            )}
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', py: '1.5rem', width: '100%' }}>
                          <Coins size={40} style={{ opacity: 0.3, color: '#6366f1' }} />
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            Chưa cấu hình QR Code nhận tiền. Hệ thống sẽ tự động sử dụng ACB VietQR.
                          </Typography>
                          <Button
                            component="label"
                            disabled={uploadingQr}
                            sx={{
                              ...btnPrimarySx,
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Upload size={16} />
                            {uploadingQr ? 'Đang upload...' : 'Tải lên hình ảnh QR'}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleUploadQrCode}
                            />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Right/Bottom Column: Topups List */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ ...glassPanelSx, padding: '2rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Box sx={{ position: 'relative', width: '320px' }}>
                            <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                            <InputBase
                              placeholder="Tìm kiếm theo email người mua hoặc mã nạp tiền..."
                              value={topUpsSearch}
                              onChange={e => setTopUpsSearch(e.target.value)}
                              sx={{ ...inputSx, paddingLeft: '2.5rem', height: '40px' }}
                            />
                          </Box>
                          <FormControl sx={{ width: '170px' }}>
                            <Select
                              value={topUpsStatusFilter}
                              onChange={e => setTopUpsStatusFilter(e.target.value)}
                              sx={selectSx}
                              MenuProps={menuProps}
                            >
                              <MenuItem value="all">Tất cả trạng thái</MenuItem>
                              <MenuItem value="pending">Chờ xử lý</MenuItem>
                              <MenuItem value="completed">Hoàn thành</MenuItem>
                              <MenuItem value="failed">Thất bại</MenuItem>
                              <MenuItem value="cancelled">Đã hủy</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Button onClick={() => { setShowAddTopUpModal(true); }} sx={{ ...btnPrimarySx, height: '40px' }}>
                          <Plus size={16} /> Tạo Top-Up mới
                        </Button>
                      </Box>

                      {filteredTopUps.length === 0 ? (
                        <Typography sx={{ color: 'text.disabled', textAlign: 'center', padding: '3rem 0' }}>Không tìm thấy yêu cầu nạp tiền nào khớp với điều kiện.</Typography>
                      ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table sx={{ minWidth: 950 }}>
                            <TableHead>
                              <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Khách Hàng / Email</TableCell>
                                <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Số tiền (USD)</TableCell>
                                <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Số tiền (VND)</TableCell>
                                <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Mã nạp tiền</TableCell>
                                <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Mã GD ACB</TableCell>
                                <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày Tạo</TableCell>
                                <TableCell sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng Thái</TableCell>
                                <TableCell align="right" sx={{ padding: '1rem 0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Hành động</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredTopUps.map((t) => {
                                const statusLower = t.status.toLowerCase();
                                return (
                                  <TableRow key={t.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                      <Typography component="strong" sx={{ display: 'block', fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{t.user?.full_name || 'Khách'}</Typography>
                                      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{t.user?.email || 'N/A'}</Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ padding: '1rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                                      ${t.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'success.main', borderBottom: 'none' }}>
                                      {t.amount_vnd.toLocaleString()} đ
                                    </TableCell>
                                    <TableCell sx={{ padding: '1rem 0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', borderBottom: 'none' }}>
                                      {t.payment_reference}
                                    </TableCell>
                                    <TableCell sx={{ padding: '1rem 0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', borderBottom: 'none' }}>
                                      {t.acb_transaction_id || '-'}
                                    </TableCell>
                                    <TableCell sx={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                                      {new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                    </TableCell>
                                    <TableCell sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                      <Box component="span" sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '10px',
                                        background: statusLower === 'completed' ? 'rgba(16, 185, 129, 0.15)' : statusLower === 'cancelled' ? 'rgba(255, 255, 255, 0.05)' : statusLower === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        color: statusLower === 'completed' ? 'success.main' : statusLower === 'cancelled' ? 'text.disabled' : statusLower === 'failed' ? 'error.main' : 'warning.main',
                                        textTransform: 'uppercase'
                                      }}>
                                        {statusLower === 'completed' ? 'Hoàn thành' : statusLower === 'pending' ? 'Chờ xử lý' : statusLower === 'failed' ? 'Thất bại' : statusLower === 'cancelled' ? 'Đã hủy' : t.status}
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ padding: '1rem 0.5rem', borderBottom: 'none' }}>
                                      <Box sx={{ display: 'inline-flex', gap: '0.5rem' }}>
                                        <Button
                                          onClick={() => setViewingTopUp(t)}
                                          sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px' }}
                                          title="Xem chi tiết"
                                        >
                                          <Eye size={14} />
                                        </Button>
                                        <Button
                                          onClick={() => handleStartEditTopUp(t)}
                                          sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(99,102,241,0.2)' }}
                                          title="Chỉnh sửa trạng thái"
                                        >
                                          <Edit size={14} color="#6366f1" />
                                        </Button>
                                        {statusLower === 'pending' && (
                                          <>
                                            <Button
                                              onClick={() => handleManualRefresh(t.id)}
                                              sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                                              title="Kiểm tra thanh toán"
                                            >
                                              <RefreshCw size={14} color="#10b981" />
                                            </Button>
                                            <Button
                                              onClick={() => handleManualCreditTopUp(t)}
                                              sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                                              title="Cộng tiền thủ công (Audited)"
                                            >
                                              <Coins size={14} color="#6366f1" />
                                            </Button>
                                            <Button
                                              onClick={() => handleCancelTopUpAdmin(t)}
                                              sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                              title="Hủy giao dịch"
                                            >
                                              <X size={14} color="#ef4444" />
                                            </Button>
                                          </>
                                        )}
                                        {statusLower !== 'completed' && (
                                          <Button
                                            onClick={() => handleDeleteTopUp(t)}
                                            sx={{ ...btnSecondarySx, padding: '0.45rem', minWidth: 'auto', height: '34px', borderColor: 'rgba(239,68,68,0.2)' }}
                                            title="Xóa bản ghi"
                                          >
                                            <Trash2 size={14} color="#ef4444" />
                                          </Button>
                                        )}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                {/* QR Code Preview Dialog */}
                <Dialog
                  open={!!qrPreviewUrl}
                  onClose={() => setQrPreviewUrl(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        ...glassPanelSx,
                        padding: '1rem',
                        maxWidth: '500px',
                        width: '100%',
                        background: 'rgba(20, 22, 33, 0.95)',
                        backgroundImage: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }
                    }
                  }}
                >
                  <DialogTitle sx={{ width: '100%', padding: 0, display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <Box component="button" onClick={() => setQrPreviewUrl(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
                      <X size={20} />
                    </Box>
                  </DialogTitle>
                  <DialogContent sx={{ padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {qrPreviewUrl && (
                      <Box
                        component="img"
                        src={qrPreviewUrl}
                        alt="QR Code Preview"
                        sx={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', display: 'block', objectFit: 'contain' }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </Box>
        )}
      </Container>

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: ADD PRODUCT */}
      <Dialog
        open={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Tạo Sản phẩm Công cụ Giao dịch Mới
          </Typography>
          <Box component="button" onClick={() => setShowAddProductModal(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          padding: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <Box component="form" onSubmit={handleCreateProduct} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Box>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tên sản phẩm *</Typography>
              <InputBase required value={productTitle} onChange={e => setProductTitle(e.target.value)} sx={inputSx} placeholder="Ví dụ: Algo HFT Pro Scalper" />
            </Box>

            <Box>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Phân loại *</Typography>
              <FormControl sx={{ width: '100%' }}>
                <Select
                  value={productCategory}
                  onChange={e => setProductCategory(e.target.value)}
                  sx={selectSx}
                  MenuProps={menuProps}
                >
                  <MenuItem value="EA">Expert Advisor (EA)</MenuItem>
                  <MenuItem value="Indicator">Technical Indicator</MenuItem>
                  <MenuItem value="Script">Execution Script</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {productCategory === 'EA' && (
              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>EA Magic Number (Tùy chọn)</Typography>
                <InputBase type="number" value={productEaMagic} onChange={e => setProductEaMagic(e.target.value)} sx={inputSx} placeholder="Ví dụ: 9988112" />
              </Box>
            )}

            <Box>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Hình ảnh thu nhỏ (Optional)</Typography>
              <Box sx={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content' }}>
                <Button onClick={() => setProductUploadType('url')} sx={{ textTransform: 'none', background: productUploadType === 'url' ? 'rgba(99,102,241,0.15)' : 'none', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem', minWidth: 'auto' }}>URL ảnh từ xa</Button>
                <Button onClick={() => setProductUploadType('file')} sx={{ textTransform: 'none', background: productUploadType === 'file' ? 'rgba(99,102,241,0.15)' : 'none', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem', minWidth: 'auto' }}>Tải file ảnh lên</Button>
              </Box>

              {productUploadType === 'url' ? (
                <InputBase type="url" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} sx={inputSx} placeholder="https://images.unsplash.com/... or blank" />
              ) : productImagePreview ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.5rem' }}>
                  <Box component="img" src={productImagePreview} sx={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                  <Typography sx={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productImageFile?.name}</Typography>
                  <Button type="button" onClick={() => { setProductImageFile(null); setProductImagePreview(null); }} sx={{ ...btnSecondarySx, padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</Button>
                </Box>
              ) : (
                <Box onClick={() => imageInputRef.current?.click()} sx={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '0.75rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'text.secondary' }}>
                  Nhấn vào đây để duyệt file ảnh thu nhỏ
                  <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageFileChange} />
                </Box>
              )}
            </Box>

            <Box>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Mô tả sản phẩm *</Typography>
              <InputBase required multiline rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} sx={inputSx} placeholder="Mô tả thuật toán, chỉ báo, hoặc cách thức vận hành..." />
            </Box>

            <Box sx={{ ...glassPanelSx, padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
              <Typography variant="h3" sx={{ fontSize: '1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fff' }}>
                <Tag size={16} color="#6366f1" />
                GÓI BẢN QUYỀN * ({draftProductVariants.length})
              </Typography>

              {draftProductVariants.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {draftProductVariants.map((variant, index) => (
                    <Box key={`${variant.name}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{variant.name}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{formatVariantDuration({ ...variant, id: `${index}` })}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'primary.main' }}>${variant.price.toFixed(2)}</Typography>
                        <Button type="button" onClick={() => handleRemoveDraftVariant(index)} disabled={draftProductVariants.length <= 1} sx={{ ...btnSecondarySx, padding: '0.25rem', height: '28px', minWidth: '40px', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'error.main', opacity: draftProductVariants.length <= 1 ? 0.5 : 1 }}>
                          <Trash2 size={12} />
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ marginBottom: '0.75rem' }}>
                <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Tên gói bản quyền *</Typography>
                <InputBase placeholder="Ví dụ: Gói 1 Tháng, Vĩnh viễn" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
              </Box>

              <Grid container spacing={2} sx={{ marginBottom: '0.75rem' }}>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Giá (USD) *</Typography>
                  <InputBase type="number" placeholder="0.00" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Loại thời hạn</Typography>
                  <FormControl sx={{ width: '100%' }}>
                    <Select
                      value={newVariantDurationType}
                      onChange={e => setNewVariantDurationType(e.target.value as any)}
                      sx={{ ...selectSx, height: '34px', fontSize: '0.85rem' }}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="lifetime">Vĩnh viễn</MenuItem>
                      <MenuItem value="days">Ngày</MenuItem>
                      <MenuItem value="months">Tháng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {newVariantDurationType !== 'lifetime' && (
                <Box sx={{ marginBottom: '1rem' }}>
                  <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Thời hạn ({newVariantDurationType === 'months' ? 'Tháng' : 'Ngày'}) *</Typography>
                  <InputBase type="number" placeholder={newVariantDurationType === 'months' ? 'Số tháng (Ví dụ: 3)' : 'Số ngày (Ví dụ: 90)'} value={newVariantDurationValue} onChange={e => setNewVariantDurationValue(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                </Box>
              )}

              <Button type="button" onClick={handleAddDraftVariant} sx={{ ...btnSecondarySx, width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.35rem', borderColor: 'rgba(99,102,241,0.25)', color: 'primary.main' }}>
                <Plus size={14} /> Thêm gói bản quyền
              </Button>
            </Box>

            <Box>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tải file Code / Executable (.ex5, .mq5, .zip) *</Typography>
              {productFileSelectedName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.65rem' }}>
                  <FileCode size={20} color="#6366f1" />
                  <Typography sx={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productFileSelectedName}</Typography>
                  <Button type="button" onClick={() => { setProductFile(null); setProductFileSelectedName(''); }} sx={{ ...btnSecondarySx, padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</Button>
                </Box>
              ) : (
                <Box onClick={() => fileInputRef.current?.click()} sx={{ border: '2px dashed rgba(255,255,255,0.1)', padding: '1.5rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}>
                  <Upload size={24} style={{ marginBottom: '0.5rem', color: '#6b7280' }} />
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Chọn file sản phẩm (Có thể bỏ trống để bổ sung sau)</Typography>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProductFile(file);
                      setProductFileSelectedName(file.name);
                    }
                  }} />
                </Box>
              )}
            </Box>

            <Button type="submit" disabled={submittingProduct || draftProductVariants.length === 0} sx={{ ...btnPrimarySx, width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '1rem' }}>
              {submittingProduct ? 'Đang xuất bản...' : 'Tạo và đăng bán sản phẩm'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT PRODUCT */}
      <Dialog
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Chỉnh sửa Thông tin Sản phẩm
          </Typography>
          <Box component="button" onClick={() => setEditingProduct(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          padding: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}>
          {editingProduct && (
            <Box component="form" onSubmit={handleUpdateProduct} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tên sản phẩm *</Typography>
                <InputBase required value={productTitle} onChange={e => setProductTitle(e.target.value)} sx={inputSx} />
              </Box>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Phân loại *</Typography>
                <FormControl sx={{ width: '100%' }}>
                  <Select
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="EA">Expert Advisor (EA)</MenuItem>
                    <MenuItem value="Indicator">Technical Indicator</MenuItem>
                    <MenuItem value="Script">Execution Script</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {productCategory === 'EA' && (
                <Box>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>EA Magic Number (Tùy chọn)</Typography>
                  <InputBase type="number" value={productEaMagic} onChange={e => setProductEaMagic(e.target.value)} sx={inputSx} />
                </Box>
              )}

              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Hình ảnh thu nhỏ</Typography>
                <Box sx={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content' }}>
                  <Button onClick={() => setProductUploadType('url')} sx={{ textTransform: 'none', background: productUploadType === 'url' ? 'rgba(99,102,241,0.15)' : 'none', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem', minWidth: 'auto' }}>URL ảnh từ xa</Button>
                  <Button onClick={() => setProductUploadType('file')} sx={{ textTransform: 'none', background: productUploadType === 'file' ? 'rgba(99,102,241,0.15)' : 'none', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem', minWidth: 'auto' }}>Tải file ảnh lên</Button>
                </Box>

                {productUploadType === 'url' ? (
                  <InputBase type="url" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} sx={inputSx} />
                ) : productImagePreview ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.5rem' }}>
                    <Box component="img" src={productImagePreview} sx={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                    <Typography sx={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{productImageFile?.name}</Typography>
                    <Button type="button" onClick={() => { setProductImageFile(null); setProductImagePreview(null); }} sx={{ ...btnSecondarySx, padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Hủy</Button>
                  </Box>
                ) : (
                  <Box onClick={() => editImageInputRef.current?.click()} sx={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '0.75rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'text.secondary' }}>
                    Chọn file ảnh thu nhỏ mới để thay thế
                    <input type="file" ref={editImageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageFileChange} />
                  </Box>
                )}
              </Box>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Mô tả sản phẩm *</Typography>
                <InputBase required multiline rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} sx={inputSx} />
              </Box>

              {/* COLLAPSIBLE SECTION: PRODUCT VARIANTS */}
              <Box sx={{ ...glassPanelSx, padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.15)' }}>
                <Box
                  onClick={() => setShowVariantsSection(!showVariantsSection)}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Typography variant="h3" sx={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fff' }}>
                    <Tag size={16} color="#6366f1" />
                    Gói bản quyền sản phẩm ({activeSortedVariants(editingProduct.variants).length})
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {showVariantsSection ? 'Thu gọn' : 'Mở rộng'}
                  </Typography>
                </Box>

                {showVariantsSection && (
                  <Box sx={{ marginTop: '1rem' }}>
                    {/* List of existing variants */}
                    {activeSortedVariants(editingProduct.variants).length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {activeSortedVariants(editingProduct.variants).map(v => (
                          <Box key={v.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{v.name}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{formatVariantDuration(v)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'primary.main' }}>${v.price.toFixed(2)}</Typography>
                              <Button
                                type="button"
                                onClick={() => handleDeleteVariant(v.id)}
                                disabled={deletingVariantId === v.id || activeSortedVariants(editingProduct.variants).length <= 1}
                                sx={{ ...btnSecondarySx, padding: '0.25rem', height: '28px', minWidth: '40px', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'error.main' }}
                              >
                                {deletingVariantId === v.id ? '...' : <Trash2 size={12} />}
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: 'error.main', fontSize: '0.8rem', marginBottom: '1.25rem' }}>Chưa có gói bản quyền nào được tạo cho sản phẩm này. Hãy thêm một gói trước khi lưu hoặc cho phép thanh toán.</Typography>
                    )}

                    {/* Form to add a new variant */}
                    <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                      <Typography variant="h4" sx={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thêm gói bản quyền mới</Typography>

                      <Box sx={{ marginBottom: '0.75rem' }}>
                        <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Tên gói bản quyền *</Typography>
                        <InputBase placeholder="Ví dụ: Gói 1 Tháng, Vĩnh viễn" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                      </Box>

                      <Grid container spacing={2} sx={{ marginBottom: '0.75rem' }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Giá (USD) *</Typography>
                          <InputBase type="number" placeholder="0.00" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Loại thời hạn</Typography>
                          <FormControl sx={{ width: '100%' }}>
                            <Select
                              value={newVariantDurationType}
                              onChange={e => setNewVariantDurationType(e.target.value as any)}
                              sx={{ ...selectSx, height: '34px', fontSize: '0.85rem' }}
                              MenuProps={menuProps}
                            >
                              <MenuItem value="months">Tháng</MenuItem>
                              <MenuItem value="days">Ngày</MenuItem>
                              <MenuItem value="lifetime">Vĩnh viễn</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {newVariantDurationType !== 'lifetime' && (
                        <Box sx={{ marginBottom: '1rem' }}>
                          <Typography component="label" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Thời hạn ({newVariantDurationType === 'months' ? 'Tháng' : 'Ngày'}) *</Typography>
                          <InputBase type="number" placeholder={newVariantDurationType === 'months' ? 'Số tháng' : 'Số ngày'} value={newVariantDurationValue} onChange={e => setNewVariantDurationValue(e.target.value)} sx={{ ...inputSx, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
                        </Box>
                      )}

                      <Button type="button" onClick={handleAddVariant} disabled={addingVariant} sx={{ ...btnSecondarySx, width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.35rem', borderColor: 'rgba(99,102,241,0.25)', color: 'primary.main' }}>
                        {addingVariant ? 'Đang tạo...' : <><Plus size={14} /> Tạo gói bản quyền</>}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              <Button type="submit" disabled={submittingProduct} sx={{ ...btnPrimarySx, width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '1rem' }}>
                {submittingProduct ? 'Đang cập nhật...' : 'Lưu thông tin sản phẩm'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: VIEW ORDER DETAIL */}
      <Dialog
        open={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Chi tiết & Xác thực Đơn hàng (Quyền Admin)
          </Typography>
          <Box component="button" onClick={() => setViewingOrder(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          {viewingOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Mã Hóa Đơn</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 700 }}>{viewingOrder.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Trạng Thái Đơn</Typography>
                  <Box component="span" sx={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '10px',
                    background: (viewingOrder.status === 'completed' || viewingOrder.status === 'active') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: (viewingOrder.status === 'completed' || viewingOrder.status === 'active') ? 'success.main' : 'warning.main',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                  }}>
                    {viewingOrder.status === 'completed' ? 'Hoàn thành' : viewingOrder.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Khách Hàng</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{viewingOrder.user?.full_name}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{viewingOrder.user?.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Sản Phẩm</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{viewingOrder.product?.title}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Phân loại: {viewingOrder.product?.category}</Typography>
                </Grid>
              </Grid>

              {/* Transactions Ledger */}
              <Box sx={{ ...glassPanelSx, padding: '1.25rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.02)' }}>
                <Typography variant="h3" sx={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Nhật ký giao dịch thanh toán ({viewingOrder.purchases.length})
                </Typography>
                {viewingOrder.purchases.length > 0 ? (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Gói License</TableCell>
                          <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Số tiền USD</TableCell>
                          <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Order Code</TableCell>
                          <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Trạng thái</TableCell>
                          <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>Ngày thanh toán</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingOrder.purchases.map((p) => (
                          <TableRow key={p.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <TableCell sx={{ padding: '0.5rem', borderBottom: 'none' }}>
                              <Typography component="strong" sx={{ fontWeight: 600 }}>{p.variant_name || 'Mặc định'}</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: '0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                              ${p.amount_paid.toFixed(2)}
                              {p.voucher_code && (
                                <Box component="span" sx={{ display: 'block', fontSize: '0.7rem', color: 'success.main' }}>
                                  Voucher: {p.voucher_code}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: 'none' }}>
                              {p.order_code || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ padding: '0.5rem', borderBottom: 'none' }}>
                              <Box component="span" sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.1/0.4rem',
                                borderRadius: '4px',
                                background: p.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: p.status === 'completed' ? 'success.main' : 'error.main',
                                textTransform: 'uppercase'
                              }}>
                                {p.status === 'completed' ? 'Hoàn thành' : p.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ padding: '0.5rem', color: 'text.secondary', borderBottom: 'none' }}>
                              {new Date(p.purchase_date).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>Chưa có giao dịch nào.</Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <Button
                  onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'completed')}
                  disabled={updatingOrderStatus || viewingOrder.status === 'completed'}
                  sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center', background: '#10b981', '&:hover': { background: '#059669' } }}
                >
                  Đánh dấu Hoàn thành
                </Button>
                <Button
                  onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'pending')}
                  disabled={updatingOrderStatus || viewingOrder.status === 'pending'}
                  sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center', borderColor: 'warning.main', color: 'warning.main', '&:hover': { background: 'rgba(245, 158, 11, 0.08)' } }}
                >
                  Đánh dấu Chờ xử lý
                </Button>
                <Button
                  onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'failed')}
                  disabled={updatingOrderStatus || viewingOrder.status === 'failed'}
                  sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center', borderColor: 'error.main', color: 'error.main', '&:hover': { background: 'rgba(239, 68, 68, 0.08)' } }}
                >
                  Đánh dấu Thất bại
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: VIEW USER PROFILE DETAILS */}
      <Dialog
        open={!!viewingUser}
        onClose={() => setViewingUser(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Thông tin Hồ sơ & Bảo mật Người dùng
          </Typography>
          <Box component="button" onClick={() => setViewingUser(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          {viewingUser && (
            <Box>
              <Grid container spacing={3} sx={{ marginBottom: '1.5rem' }}>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Họ Tên</Typography>
                  <Typography component="strong" sx={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>{viewingUser.full_name}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Email</Typography>
                  <Typography component="strong" sx={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>{viewingUser.email}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Vai trò</Typography>
                  <Box component="span" sx={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: viewingUser.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: viewingUser.role === 'admin' ? '#a855f7' : 'text.secondary',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                  }}>
                    {viewingUser.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Số Dư Ví Wallet</Typography>
                  <Typography component="strong" sx={{ fontSize: '1.1rem', color: 'success.main', fontWeight: 700 }}>${viewingUser.balance.toFixed(2)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Số điện thoại</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{viewingUser.phone_number || 'Chưa thiết lập'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Ngày sinh</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{viewingUser.date_of_birth || 'Chưa thiết lập'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Địa chỉ</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{viewingUser.address || 'Chưa thiết lập'}</Typography>
                </Grid>
              </Grid>

              {/* Masked Sensitive Fields Section */}
              <Box sx={{ ...glassPanelSx, padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.15)' }}>
                <Typography variant="h3" sx={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Dữ liệu nhạy cảm & Ranh giới bảo mật
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Box>
                    <Typography component="label" sx={{ fontSize: '0.7rem', display: 'inline-block', marginRight: '0.5rem', color: 'text.secondary' }}>Mã băm mật khẩu (Bảo mật)</Typography>
                    <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Được lưu dưới dạng mã băm; không thể hiển thị</Box>
                    <InputBase
                      readOnly
                      value="************************************************"
                      sx={{ ...inputSx, fontSize: '0.8rem', height: '32px', fontFamily: 'monospace', marginTop: '0.25rem' }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography component="label" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Mã băm API Key / License Key</Typography>
                      <Box
                        component="button"
                        onClick={() => toggleShowSensitive('apiKey')}
                        sx={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'primary.main', fontSize: '0.75rem' }}
                      >
                        {showSensitives['apiKey'] ? <><EyeOff size={12} /> Ẩn</> : <><Eye size={12} /> Hiện</>}
                      </Box>
                    </Box>
                    <InputBase
                      readOnly
                      value={showSensitives['apiKey'] ? `lt_98a723bcdeff12019ab98273641abc65d9e8f172` : `************************************************`}
                      sx={{ ...inputSx, fontSize: '0.8rem', height: '32px', fontFamily: 'monospace', marginTop: '0.25rem' }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: '1rem' }}>
                <Button
                  onClick={() => handleToggleSoftDeleteUser(viewingUser)}
                  sx={{
                    ...btnSecondarySx,
                    flex: 1,
                    justifyContent: 'center',
                    borderColor: viewingUser.is_deleted ? 'success.main' : 'error.main',
                    color: viewingUser.is_deleted ? 'success.main' : 'error.main',
                    '&:hover': {
                      background: viewingUser.is_deleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                    }
                  }}
                >
                  {viewingUser.is_deleted ? 'Khôi phục tài khoản' : 'Tạm ngưng tài khoản'}
                </Button>
                <Button
                  onClick={() => { setViewingUser(null); handleStartEditUser(viewingUser); }}
                  sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}
                >
                  Chỉnh sửa hồ sơ
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT USER PROFILE */}
      <Dialog
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Chỉnh sửa tài khoản
          </Typography>
          <Box component="button" onClick={() => setEditingUser(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          {editingUser && (
            <Box component="form" onSubmit={handleUpdateUser} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Họ và tên *</Typography>
                <InputBase required value={editUserFullName} onChange={e => setEditUserFullName(e.target.value)} sx={inputSx} />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Vai trò *</Typography>
                  <FormControl sx={{ width: '100%' }}>
                    <Select
                      value={editUserRole}
                      onChange={e => setEditUserRole(e.target.value)}
                      sx={selectSx}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="user">User (Khách mua)</MenuItem>
                      <MenuItem value="admin">Admin (Quản trị viên)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Số dư ví (USD) *</Typography>
                  <InputBase type="number" inputProps={{ step: '0.01' }} required value={editUserBalance} onChange={e => setEditUserBalance(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Số Điện Thoại</Typography>
                  <InputBase value={editUserPhone} onChange={e => setEditUserPhone(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Ngày Sinh</Typography>
                  <InputBase placeholder="e.g. 1995-10-15" value={editUserDOB} onChange={e => setEditUserDOB(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Địa Chỉ</Typography>
                <InputBase multiline rows={2} value={editUserAddress} onChange={e => setEditUserAddress(e.target.value)} sx={inputSx} />
              </Box>

              <Box sx={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <Button type="button" onClick={() => setEditingUser(null)} sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}>Hủy</Button>
                <Button type="submit" disabled={updatingUser} sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}>
                  {updatingUser ? 'Đang lưu...' : 'Lưu thông tin'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CREATE / EDIT VOUCHER */}
      <Dialog
        open={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '550px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {editingVoucher ? 'Chỉnh sửa Chiến dịch Voucher' : 'Tạo Chiến dịch Voucher Mới'}
          </Typography>
          <Box component="button" onClick={() => setShowVoucherModal(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <Box component="form" onSubmit={handleCreateOrUpdateVoucher} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Mã Promo Code *</Typography>
                <InputBase
                  required
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  placeholder="Ví dụ: TRADING30"
                  disabled={editingVoucher !== null}
                  sx={{ ...inputSx, '& input': { textTransform: 'uppercase', fontFamily: 'monospace', padding: 0 } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tên chiến dịch *</Typography>
                <InputBase required value={voucherName} onChange={e => setVoucherName(e.target.value)} sx={inputSx} placeholder="Ví dụ: Summer Sale 2026" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Loại chiết khấu *</Typography>
                <FormControl sx={{ width: '100%' }}>
                  <Select
                    value={voucherDiscountType}
                    onChange={e => setVoucherDiscountType(e.target.value)}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                    <MenuItem value="fixed">Số tiền mặt định mức ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Giá trị giảm *</Typography>
                <InputBase type="number" inputProps={{ step: '0.01', min: 0 }} required value={voucherDiscountValue} onChange={e => setVoucherDiscountValue(e.target.value)} sx={inputSx} placeholder="Ví dụ: 20 hoặc 50.00" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Ngày bắt đầu *</Typography>
                <InputBase type="datetime-local" required value={voucherStartDate} onChange={e => setVoucherStartDate(e.target.value)} sx={{ ...inputSx, '& input': { colorScheme: 'dark', padding: 0 } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Ngày kết thúc *</Typography>
                <InputBase type="datetime-local" required value={voucherEndDate} onChange={e => setVoucherEndDate(e.target.value)} sx={{ ...inputSx, '& input': { colorScheme: 'dark', padding: 0 } }} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Giới hạn số lượt dùng (Tùy chọn)</Typography>
                <InputBase type="number" inputProps={{ min: 1 }} value={voucherUsageLimit} onChange={e => setVoucherUsageLimit(e.target.value)} sx={inputSx} placeholder="Ví dụ: 100 (Để trống = Vô hạn)" />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Sản phẩm áp dụng (Tùy chọn ID)</Typography>
                <InputBase value={voucherProductScope} onChange={e => setVoucherProductScope(e.target.value)} sx={inputSx} placeholder="Mã UUID sản phẩm (Trống = Toàn sàn)" />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="voucherIsActive"
                checked={voucherIsActive}
                onChange={e => setVoucherIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <Typography component="label" htmlFor="voucherIsActive" sx={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Kích hoạt chiến dịch / voucher ngay
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: '1rem' }}>
              <Button type="button" onClick={() => setShowVoucherModal(false)} sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}>Hủy</Button>
              <Button type="submit" disabled={submittingVoucher} sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}>
                {submittingVoucher ? 'Đang lưu...' : 'Lưu Voucher'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* MODAL: VIEW TOP UP DETAILS */}
      <Dialog
        open={!!viewingTopUp}
        onClose={() => setViewingTopUp(null)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '650px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Chi tiết nạp tiền (Quyền Admin)
          </Typography>
          <Box component="button" onClick={() => setViewingTopUp(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0, scrollbarWidth: 'none', msOverflowStyle: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {viewingTopUp && (
            <Box>
              <Grid container spacing={3} sx={{ marginBottom: '1.5rem' }}>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Giao Dịch ID</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 700 }}>{viewingTopUp.id}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Trạng thái</Typography>
                  <Box component="span" sx={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '10px',
                    background: viewingTopUp.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: viewingTopUp.status === 'completed' ? 'success.main' : 'warning.main',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                  }}>
                    {viewingTopUp.status === 'completed' ? 'Hoàn thành' : viewingTopUp.status === 'pending' ? 'Chờ xử lý' : viewingTopUp.status === 'failed' ? 'Thất bại' : 'Đã hủy'}
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Khách Hàng</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{viewingTopUp.user?.full_name || 'Khách'}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{viewingTopUp.user?.email}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Ngày Tạo</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{new Date(viewingTopUp.created_at).toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Nội dung chuyển khoản</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'monospace', color: 'primary.main', fontWeight: 700 }}>{viewingTopUp.payment_reference}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>ACB Transaction ID</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 700 }}>{viewingTopUp.acb_transaction_id || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Số Tiền USD</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>${viewingTopUp.amount.toFixed(2)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textTransform: 'uppercase' }}>Số Tiền Quy Đổi VND</Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: 'success.main', fontWeight: 700 }}>{viewingTopUp.amount_vnd.toLocaleString()} đ</Typography>
                </Grid>
              </Grid>

              {viewingTopUp.error_message && (
                <Box sx={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', fontSize: '0.85rem', color: 'error.main', marginBottom: '1.5rem' }}>
                  <Typography component="strong" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Lỗi/Lưu chú:</Typography> {viewingTopUp.error_message}
                </Box>
              )}

              {viewingTopUp.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  <Button
                    onClick={() => handleManualCreditTopUp(viewingTopUp)}
                    sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center', background: '#10b981', whiteSpace: 'nowrap', '&:hover': { background: '#059669' } }}
                  >
                    Cộng tiền thủ công (Audited)
                  </Button>
                  <Button
                    onClick={() => handleCancelTopUpAdmin(viewingTopUp)}
                    sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center', borderColor: 'error.main', color: 'error.main', whiteSpace: 'nowrap', '&:hover': { background: 'rgba(239,68,68,0.08)' } }}
                  >
                    Hủy Giao Dịch
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', width: '100%' }}>
                <Button
                  onClick={() => { setViewingTopUp(null); handleStartEditTopUp(viewingTopUp); }}
                  sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center', whiteSpace: 'nowrap' }}
                >
                  Chỉnh Sửa Trạng Thái
                </Button>
                <Button
                  onClick={() => setViewingTopUp(null)}
                  sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center', whiteSpace: 'nowrap' }}
                >
                  Đóng
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT TOP UP FIELDS */}
      <Dialog
        open={!!editingTopUp}
        onClose={() => setEditingTopUp(null)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Chỉnh sửa giao dịch Top-Up
          </Typography>
          <Box component="button" onClick={() => setEditingTopUp(null)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          {editingTopUp && (
            <Box component="form" onSubmit={handleUpdateTopUp} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Box>
                <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Trạng thái giao dịch</Typography>
                <FormControl sx={{ width: '100%' }}>
                  <Select
                    value={editTopUpStatus}
                    onChange={e => setEditTopUpStatus(e.target.value)}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="failed">Thất bại</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </FormControl>
                <Typography sx={{ fontSize: '0.72rem', color: 'warning.main', marginTop: '0.25rem', display: 'block' }}>
                  * Lưu ý: Thay đổi trạng thái tại đây sẽ KHÔNG tự động cộng/trừ số dư ví của khách hàng. Hãy dùng chức năng "Cộng tiền thủ công" bên ngoài nếu muốn thực hiện cộng ví.
                </Typography>
              </Box>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>ACB Transaction ID</Typography>
                <InputBase value={editTopUpTransactionId} onChange={e => setEditTopUpTransactionId(e.target.value)} sx={inputSx} placeholder="e.g. FT12345678" />
              </Box>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Thời gian thanh toán</Typography>
                <InputBase type="datetime-local" value={editTopUpPaidAt} onChange={e => setEditTopUpPaidAt(e.target.value)} sx={{ ...inputSx, '& input': { colorScheme: 'dark', padding: 0 } }} />
              </Box>

              <Box>
                <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Lưu chú lỗi / Ghi chú</Typography>
                <InputBase multiline rows={3} value={editTopUpErrorMessage} onChange={e => setEditTopUpErrorMessage(e.target.value)} sx={inputSx} placeholder="Ghi chú lý do thất bại..." />
              </Box>

              <Box sx={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <Button type="button" onClick={() => setEditingTopUp(null)} sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}>Hủy</Button>
                <Button type="submit" disabled={updatingTopUp} sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}>
                  {updatingTopUp ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD TOP UP (ADMIN) */}
      <Dialog
        open={showAddTopUpModal}
        onClose={() => setShowAddTopUpModal(false)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Tạo giao dịch Top-Up mới
          </Typography>
          <Box component="button" onClick={() => setShowAddTopUpModal(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <Box component="form" onSubmit={handleCreateTopUpAdmin} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Box>
              <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Chọn Khách Hàng *</Typography>
              <FormControl sx={{ width: '100%' }}>
                <Select
                  value={topUpTargetUserId}
                  onChange={e => setTopUpTargetUserId(e.target.value)}
                  sx={selectSx}
                  MenuProps={menuProps}
                >
                  <MenuItem value="">-- Chọn khách hàng --</MenuItem>
                  {usersList.map(u => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.full_name} ({u.email}) - Ví: ${u.balance.toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>Số tiền nạp (USD) *</Typography>
              <InputBase type="number" inputProps={{ step: '0.01', min: '0.01' }} required value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} sx={inputSx} placeholder="0.00" />
              {topUpAmount && !isNaN(parseFloat(topUpAmount)) && (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', marginTop: '0.25rem' }}>
                  Quy đổi: <Typography component="strong" sx={{ color: 'success.main', fontSize: '0.75rem', fontWeight: 700 }}>{(parseFloat(topUpAmount) * exchangeRate).toLocaleString()} VND</Typography>
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Button type="button" onClick={() => setShowAddTopUpModal(false)} sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}>Hủy</Button>
              <Button type="submit" disabled={submittingTopUp} sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}>
                {submittingTopUp ? 'Đang tạo...' : 'Tạo Top-Up'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* MODAL: REPLACE PHYSICAL CODE FILE */}
      <Dialog
        open={!!replacingProductId}
        onClose={() => {
          if (!uploadingReplacingFile) {
            setReplacingProductId(null);
            setReplacingSelectedFile(null);
          }
        }}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              maxHeight: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Thay thế file code / binary
          </Typography>
          <Box component="button" onClick={() => {
            if (!uploadingReplacingFile) {
              setReplacingProductId(null);
              setReplacingSelectedFile(null);
            }
          }} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          padding: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setReplacingFileDragOver(true);
              }}
              onDragLeave={() => setReplacingFileDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setReplacingFileDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setReplacingSelectedFile(file);
                }
              }}
              onClick={() => replaceFileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: replacingFileDragOver ? 'primary.main' : 'rgba(255,255,255,0.1)',
                padding: '2rem',
                textAlign: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                background: replacingFileDragOver ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  background: 'rgba(99,102,241,0.04)'
                }
              }}
            >
              <Upload size={32} style={{ marginBottom: '0.75rem', color: '#6b7280' }} />
              <Typography sx={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                Kéo thả file vào đây
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                hoặc click để chọn file từ máy tính (.ex5, .mq5, .zip)
              </Typography>
            </Box>

            <input
              type="file"
              ref={replaceFileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setReplacingSelectedFile(file);
                }
              }}
            />

            {replacingSelectedFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem' }}>
                <FileCode size={24} color="#6366f1" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replacingSelectedFile.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {(replacingSelectedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
                <Button
                  type="button"
                  onClick={() => setReplacingSelectedFile(null)}
                  disabled={uploadingReplacingFile}
                  sx={{ ...btnSecondarySx, padding: '0.35rem 0.6rem', fontSize: '0.75rem', height: '30px' }}
                >
                  Xóa
                </Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Button
                type="button"
                onClick={() => {
                  setReplacingProductId(null);
                  setReplacingSelectedFile(null);
                }}
                disabled={uploadingReplacingFile}
                sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (replacingSelectedFile && replacingProductId) {
                    try {
                      setUploadingReplacingFile(true);
                      await handleUploadFileDirect(replacingProductId, replacingSelectedFile);
                      setReplacingProductId(null);
                      setReplacingSelectedFile(null);
                    } catch (err) {
                      // Handled by handleUploadFileDirect
                    } finally {
                      setUploadingReplacingFile(false);
                    }
                  }
                }}
                disabled={!replacingSelectedFile || uploadingReplacingFile}
                sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}
              >
                {uploadingReplacingFile ? 'Đang tải lên...' : 'Tải lên'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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
        title={confirmingUserAction?.is_deleted ? 'Khôi phục tài khoản người dùng?' : 'Tạm ngưng tài khoản người dùng?'}
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

      <ConfirmationDialog
        open={!!confirmingTopUpManualCredit}
        title="Cộng tiền thủ công?"
        message={
          <>
            <strong>CRITICAL WARNING:</strong> Thao tác nạp tiền thủ công sẽ cộng trực tiếp số dư ví và đánh dấu giao dịch này là hoàn tất.
            <br />
            Nạp nợ ví cho <strong style={{ color: '#fff' }}>{confirmingTopUpManualCredit?.user?.full_name}</strong> số tiền nạp:
            <span style={{ color: '#10b981', fontWeight: 'bold' }}> ${confirmingTopUpManualCredit?.amount.toFixed(2)}</span>.
            Bạn có chắc chắn muốn thực hiện?
          </>
        }
        confirmLabel="Có"
        cancelLabel="Hủy"
        loading={confirmingTopUpManualCreditLoading}
        onConfirm={handleConfirmManualCreditTopUp}
        onCancel={() => {
          if (!confirmingTopUpManualCreditLoading) setConfirmingTopUpManualCredit(null);
        }}
      />

      <ConfirmationDialog
        open={!!confirmingTopUpCancel}
        title="Hủy giao dịch Top-Up?"
        message={
          <>
            Bạn có chắc chắn muốn hủy yêu cầu nạp tiền này? (Mã: <strong style={{ color: '#fff' }}>{confirmingTopUpCancel?.payment_reference}</strong>)
          </>
        }
        confirmLabel="Có"
        cancelLabel="Hủy"
        loading={confirmingTopUpCancelLoading}
        onConfirm={handleConfirmCancelTopUpAdmin}
        onCancel={() => {
          if (!confirmingTopUpCancelLoading) setConfirmingTopUpCancel(null);
        }}
      />

      <ConfirmationDialog
        open={!!confirmingTopUpDelete}
        title="Xóa bản ghi Top-Up?"
        message={
          <>
            Bạn có chắc chắn muốn xóa bản ghi yêu cầu nạp tiền này không? Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        loading={confirmingTopUpDeleteLoading}
        onConfirm={handleConfirmDeleteTopUp}
        onCancel={() => {
          if (!confirmingTopUpDeleteLoading) setConfirmingTopUpDelete(null);
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default Admin;
