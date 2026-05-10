export type Category = 'pants' | 'shirt' | 'basic-tops' | 'sets' | 'sweatshirts' | 'shorts' | 'accessories' | 'jackets';
export type Gender = 'man' | 'woman' | 'unisex';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  images: string[];
  sizes: string[];
  colors?: {
    name: string;
    hex: string;
    image: string;
  }[];
  gender: Gender;
  status?: 'sale' | 'sold' | 'new' | 'none';
  createdAt: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color?: string;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Admin {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  orderId?: string;
  phone: string;
  message: string;
  createdAt: any;
}
