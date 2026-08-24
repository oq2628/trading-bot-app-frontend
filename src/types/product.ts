export interface ProductVariant {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  original_price: number | null;
  duration_days: number | null;
  duration_months: number | null;
  is_lifetime: boolean;
  is_deleted: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  created_at: string;
  variants?: ProductVariant[];
}
