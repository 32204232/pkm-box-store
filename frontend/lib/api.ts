import { getAccessToken, setAccessToken } from "@/store/auth";
import type {
  AdminOrder,
  Cart,
  CartItem,
  LoginResponse,
  MemberResponse,
  Order,
  OrderStatus,
  PaymentConfirmRequest,
  PaymentResponse,
  Product,
  ProductCreateRequest,
  ProductUpdateRequest
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const requestBody: BodyInit | undefined = isFormData
    ? (options.body as FormData)
    : options.body !== undefined
      ? JSON.stringify(options.body)
      : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: requestBody
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      response.status === 401
        ? "로그인이 필요합니다."
        : response.status === 403
          ? "접근 권한이 없습니다."
          : typeof data === "object" && data !== null && "message" in data
            ? String(data.message)
            : "요청에 실패했습니다.";
    const code = typeof data === "object" && data !== null && "code" in data ? String(data.code) : undefined;
    throw new ApiClientError(message, response.status, code);
  }

  return data as T;
}

export const api = {
  async signup(body: { email: string; password: string; name: string }) {
    return request<MemberResponse>("/api/members/signup", { method: "POST", body, auth: false });
  },

  async login(body: { email: string; password: string }) {
    const response = await request<LoginResponse>("/api/members/login", { method: "POST", body, auth: false });
    setAccessToken(response.accessToken);
    return response;
  },

  products() {
    return request<Product[]>("/api/products", { auth: false });
  },

  product(id: string | number) {
    return request<Product>(`/api/products/${id}`, { auth: false });
  },

  createProduct(body: ProductCreateRequest) {
    return request<Product>("/api/admin/products", { method: "POST", body });
  },

  updateProduct(id: number, body: ProductUpdateRequest) {
    return request<Product>(`/api/admin/products/${id}`, { method: "PATCH", body });
  },

  hideProduct(id: number) {
    return request<void>(`/api/admin/products/${id}`, { method: "DELETE" });
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    return request<{ imageUrl: string }>("/api/admin/images", { method: "POST", body: formData });
  },

  cart() {
    return request<Cart>("/api/cart");
  },

  addCartItem(body: { productId: number; quantity: number }) {
    return request<CartItem>("/api/cart/items", { method: "POST", body });
  },

  updateCartItem(cartItemId: number, body: { quantity: number }) {
    return request<CartItem>(`/api/cart/items/${cartItemId}`, { method: "PATCH", body });
  },

  deleteCartItem(cartItemId: number) {
    return request<void>(`/api/cart/items/${cartItemId}`, { method: "DELETE" });
  },

  clearCart() {
    return request<void>("/api/cart/items", { method: "DELETE" });
  },

  createOrder(body: { receiverName: string; receiverPhone: string; address: string }) {
    return request<Order>("/api/orders", { method: "POST", body });
  },

  orders() {
    return request<Order[]>("/api/orders");
  },

  order(orderId: number) {
    return request<Order>(`/api/orders/${orderId}`);
  },

  confirmPayment(body: PaymentConfirmRequest) {
    return request<PaymentResponse>("/api/payments/confirm", { method: "POST", body });
  },

  failPayment(orderId: number) {
    return request<void>("/api/payments/fail", { method: "POST", body: { orderId } });
  },

  adminOrders() {
    return request<AdminOrder[]>("/api/admin/orders");
  },

  adminOrder(orderId: number) {
    return request<AdminOrder>(`/api/admin/orders/${orderId}`);
  },

  updateAdminOrderStatus(orderId: number, status: OrderStatus) {
    return request<AdminOrder>(`/api/admin/orders/${orderId}/status`, { method: "PATCH", body: { status } });
  }
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
