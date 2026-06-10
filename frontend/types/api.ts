export type ProductStatus = "ON_SALE" | "SOLD_OUT" | "COMING_SOON" | "HIDDEN";
export type ProductLanguage = "KOREAN" | "JAPANESE" | "ENGLISH";
export type ProductSort = "latest" | "priceAsc" | "priceDesc" | "releaseDateDesc";
export type MemberRole = "ROLE_MEMBER" | "ROLE_ADMIN";
export type EmailVerificationPurpose = "SIGNUP" | "PASSWORD_RESET";
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
export type AdminAuditActionType =
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_HIDDEN"
  | "ORDER_PREPARED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "PAYMENT_CANCELED";
export type AdminAuditTargetType = "PRODUCT" | "ORDER" | "PAYMENT";

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
  profileImageUrl: string | null;
  bio: string | null;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface EmailVerificationSendRequest {
  email: string;
  purpose: EmailVerificationPurpose;
}

export interface EmailVerificationSendResponse {
  expiresAt: string;
  resendAvailableAt: string;
}

export interface EmailVerificationVerifyRequest extends EmailVerificationSendRequest {
  code: string;
}

export interface EmailVerificationVerifyResponse {
  verificationToken: string;
  expiresAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  emailVerificationToken: string;
}

export interface PasswordResetRequest {
  email: string;
  verificationToken: string;
  newPassword: string;
}

export interface MemberProfileUpdateRequest {
  name: string;
  profileImageUrl?: string | null;
  bio?: string | null;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  retailPrice: number | null;
  category: string;
  series: string;
  categoryId: number | null;
  categoryName: string | null;
  productTypeId: number | null;
  productTypeName: string | null;
  seriesId: number | null;
  seriesName: string | null;
  language: ProductLanguage | null;
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
  retailPrice?: number | null;
  category: string;
  series: string;
  categoryId?: number | null;
  productTypeId?: number | null;
  seriesId?: number | null;
  language?: ProductLanguage | null;
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
  categoryId?: number;
  productTypeId?: number;
  seriesId?: number;
  status?: Exclude<ProductStatus, "HIDDEN">;
  inStockOnly?: boolean;
  sort?: ProductSort;
}

export interface AdminProductSearchParams {
  keyword?: string;
  category?: string;
  series?: string;
  categoryId?: number;
  productTypeId?: number;
  seriesId?: number;
  status?: ProductStatus;
  lowStockOnly?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
}

export type CategoryUpdateRequest = CategoryCreateRequest;

export interface ProductType {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export interface ProductTypeCreateRequest {
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
}

export type ProductTypeUpdateRequest = ProductTypeCreateRequest;

export interface Series {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export type ProductSeries = Series;

export interface SeriesCreateRequest {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
}

export type SeriesUpdateRequest = SeriesCreateRequest;

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
  isDefault?: boolean | null;
}

export interface OrderDeliveryAddressUpdateRequest {
  deliveryAddressId?: number | null;
  receiverName?: string;
  receiverPhone?: string;
  zipCode?: string;
  address1?: string;
  address2?: string | null;
}

export interface AdminOrderSearchParams {
  status?: OrderStatus;
  memberEmail?: string;
  startDate?: string;
  endDate?: string;
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
  zipCode: string | null;
  address1: string | null;
  address2: string | null;
  courierCompany: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
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

export interface AdminAuditLogResponse {
  id: number;
  adminId: number;
  adminEmail: string;
  actionType: AdminAuditActionType;
  targetType: AdminAuditTargetType;
  targetId: number;
  description: string;
  createdAt: string;
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
