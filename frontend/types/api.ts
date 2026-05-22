export type ProductStatus = "ON_SALE" | "SOLD_OUT" | "COMING_SOON" | "HIDDEN";
export type ProductSort = "latest" | "priceAsc" | "priceDesc" | "releaseDateDesc";
export type MemberRole = "ROLE_MEMBER" | "ROLE_ADMIN";
export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "FAILED"
  | "EXPIRED";
export type PaymentProvider = "TOSS" | "NAVER_PAY" | "KAKAO_PAY";
export type PaymentStatus = "READY" | "IN_PROGRESS" | "APPROVED" | "FAILED" | "CANCELED";

export interface ApiError {
  code: string;
  message: string;
  fieldErrors: Array<{ field: string; message: string }>;
  timestamp: string;
}

export interface MemberResponse {
  id: number;
  email: string;
  name: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  series: string;
  releaseDate: string | null;
  stockQuantity: number;
  imageUrl: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  series: string;
  releaseDate?: string | null;
  stockQuantity: number;
  imageUrl?: string | null;
  status?: ProductStatus;
}

export type ProductUpdateRequest = Partial<ProductCreateRequest>;

export interface ProductSearchParams {
  keyword?: string;
  category?: string;
  series?: string;
  status?: Exclude<ProductStatus, "HIDDEN">;
  inStockOnly?: boolean;
  sort?: ProductSort;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  price: number;
  productStatus: ProductStatus;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

export interface DeliveryAddress {
  id: number;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAddressRequest {
  label?: string | null;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address1: string;
  address2?: string | null;
}

export interface OrderItem {
  id: number;
  productId: number;
  productNameSnapshot: string;
  orderPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderUid: string;
  status: OrderStatus;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  expiresAt: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder extends Order {
  memberId: number;
  memberEmail: string;
  memberName: string;
  courierCompany: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface AdminDashboardOrderResponse {
  id: number;
  orderUid: string;
  memberEmail: string;
  memberName: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
}

export interface AdminDashboardProductResponse {
  id: number;
  name: string;
  price: number;
  category: string;
  series: string;
  stockQuantity: number;
  status: ProductStatus;
}

export interface AdminDashboardResponse {
  todayOrderCount: number;
  todaySalesAmount: number;
  paymentPendingOrderCount: number;
  paidOrderCount: number;
  preparingOrderCount: number;
  shippedOrderCount: number;
  lowStockProductCount: number;
  recentOrders: AdminDashboardOrderResponse[];
  lowStockProducts: AdminDashboardProductResponse[];
}

export interface PaymentConfirmRequest {
  orderId: number;
  provider: PaymentProvider;
  paymentKey: string;
  providerOrderId: string;
  amount: number;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  approvedAt: string;
}
