"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { DeliveryAddress, Order, Product } from "@/types/api";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const TOSS_ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
const DAUM_POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type AddressForm = {
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
};

type DaumPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void; onclose?: () => void }) => {
        open: () => void;
      };
    };
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getOrderName(order: Order) {
  const [firstItem] = order.items;
  const firstName = firstItem?.productNameSnapshot ?? "주문 상품";
  const otherCount = order.items.length - 1;

  return otherCount > 0 ? `${firstName} 외 ${otherCount}개` : firstName;
}

function getOrderStatusLabel(status: Order["status"]) {
  switch (status) {
    case "PAYMENT_PENDING":
      return "결제 대기";
    case "PAID":
      return "결제 완료";
    case "PREPARING":
      return "배송 준비";
    case "SHIPPED":
      return "배송 중";
    case "DELIVERED":
      return "배송 완료";
    case "CANCELED":
      return "취소 완료";
    case "FAILED":
      return "결제 실패";
    case "EXPIRED":
      return "주문 만료";
    default:
      return status;
  }
}

export default function OrderPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [changingAddress, setChangingAddress] = useState(false);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    receiverName: "",
    receiverPhone: "",
    zipCode: "",
    address1: "",
    address2: "",
    isDefault: false
  });

  useEffect(() => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setMessage("올바르지 않은 주문번호입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    api
      .order(orderId)
      .then(setOrder)
      .catch((error) => setMessage(error instanceof Error ? error.message : "주문 정보를 조회하지 못했습니다."))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    api
      .deliveryAddresses()
      .then((response) => {
        setAddresses(response);
        const defaultAddress = response.find((item) => item.isDefault) ?? response[0];
        setSelectedAddressId(defaultAddress?.id ?? null);
      })
      .catch(() => setAddresses([]));
  }, []);

  useEffect(() => {
    api
      .products({ sort: "latest" })
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  function formatDeliveryAddress(address: DeliveryAddress) {
    return `[${address.zipCode}] ${address.address1} ${address.address2 ?? ""}`.trim();
  }

  async function changeOrderDeliveryAddress(deliveryAddressId: number) {
    if (!order || changingAddress || paying || canceling) {
      return;
    }
    if (order.status !== "PAYMENT_PENDING") {
      setMessage("결제 대기 상태의 주문만 배송지를 변경할 수 있습니다.");
      return;
    }

    setChangingAddress(true);
    setMessage(null);
    try {
      const updatedOrder = await api.updateOrderDeliveryAddress(order.id, { deliveryAddressId });
      setOrder(updatedOrder);
      setSelectedAddressId(deliveryAddressId);
      setAddressModalOpen(false);
      setAddAddressOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 배송지 변경에 실패했습니다.");
    } finally {
      setChangingAddress(false);
    }
  }

  function resetAddressForm() {
    setAddressForm({
      receiverName: "",
      receiverPhone: "",
      zipCode: "",
      address1: "",
      address2: "",
      isDefault: false
    });
  }

  function loadDaumPostcodeScript() {
    if (window.daum?.Postcode) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${DAUM_POSTCODE_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("우편번호 스크립트를 불러오지 못했습니다.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = DAUM_POSTCODE_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("우편번호 스크립트를 불러오지 못했습니다."));
      document.head.appendChild(script);
    });
  }

  async function openPostcodeSearch() {
    setPostcodeLoading(true);
    setMessage(null);
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) {
        throw new Error("우편번호 검색을 열 수 없습니다.");
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          setAddressForm((current) => ({
            ...current,
            zipCode: data.zonecode,
            address1: data.roadAddress || data.jibunAddress || data.address
          }));
        }
      }).open();
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} 직접 입력을 사용해 주세요.` : "우편번호 검색 실패. 직접 입력을 사용해 주세요.");
    } finally {
      setPostcodeLoading(false);
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || savingAddress || changingAddress) {
      return;
    }
    if (order.status !== "PAYMENT_PENDING") {
      setMessage("결제 대기 상태의 주문만 배송지를 변경할 수 있습니다.");
      return;
    }

    setSavingAddress(true);
    setMessage(null);
    try {
      const savedAddress = await api.createDeliveryAddress({
        receiverName: addressForm.receiverName,
        receiverPhone: addressForm.receiverPhone,
        zipCode: addressForm.zipCode,
        address1: addressForm.address1,
        address2: addressForm.address2
      });

      if (addressForm.isDefault) {
        await api.setDefaultDeliveryAddress(savedAddress.id);
      }

      const updatedOrder = await api.updateOrderDeliveryAddress(orderId, { deliveryAddressId: savedAddress.id });
      const nextAddresses = await api.deliveryAddresses();
      setAddresses(nextAddresses);
      setOrder(updatedOrder);
      setSelectedAddressId(savedAddress.id);
      setAddAddressOpen(false);
      setAddressModalOpen(false);
      resetAddressForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "배송지 저장 실패");
    } finally {
      setSavingAddress(false);
    }
  }

  async function startPayment() {
    if (!order || paying || canceling || changingAddress) {
      return;
    }

    if (order.status !== "PAYMENT_PENDING") {
      setMessage("결제 대기 상태의 주문만 결제를 진행할 수 있습니다.");
      return;
    }

    if (!TOSS_CLIENT_KEY) {
      setMessage("Toss Payments 클라이언트 키가 설정되지 않았습니다.");
      return;
    }

    if (!TOSS_ORDER_ID_PATTERN.test(order.orderUid)) {
      setMessage("Toss Payments 주문번호 형식이 올바르지 않습니다.");
      return;
    }

    setPaying(true);
    setMessage("Toss Payments 결제창을 여는 중입니다.");

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const successUrl = new URL("/payments/success", window.location.origin);
      successUrl.searchParams.set("internalOrderId", String(order.id));
      const failUrl = new URL("/payments/fail", window.location.origin);
      failUrl.searchParams.set("internalOrderId", String(order.id));

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: order.totalPrice
        },
        orderId: order.orderUid,
        orderName: getOrderName(order),
        customerName: order.receiverName,
        successUrl: successUrl.toString(),
        failUrl: failUrl.toString(),
        card: {
          flowMode: "DEFAULT",
          useEscrow: false,
          useCardPoint: false,
          useAppCardOnly: false
        }
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제창 호출에 실패했습니다.");
      setPaying(false);
    }
  }

  async function cancelPayment() {
    if (!order || paying || canceling || changingAddress) {
      return;
    }

    setCanceling(true);
    setMessage(null);
    try {
      await api.failPayment(order.id);
      router.push("/orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 취소에 실패했습니다.");
      setCanceling(false);
    }
  }

  const canChangeDeliveryAddress = order?.status === "PAYMENT_PENDING" && !paying && !canceling && !changingAddress;
  const canPay = order?.status === "PAYMENT_PENDING" && !paying && !canceling && !changingAddress;
  const productMetaById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  return (
    <RequireAuth>
      <div className="payment-page">
        <div className="payment-page-head">
          <h1>배송/결제</h1>
          <p>주문 정보와 배송지를 확인한 뒤 결제를 진행해 주세요.</p>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">주문 정보를 불러오고 있습니다.</div>
        ) : !order ? (
          <div className="alert">표시할 주문 정보가 없습니다.</div>
        ) : (
          <div className="payment-checkout">
            <section className="checkout-section payment-address-section">
              <div className="payment-card-header">
                <strong>배송 주소</strong>
                <button
                  className="checkout-text-button"
                  type="button"
                  onClick={() => {
                    if (!canChangeDeliveryAddress) {
                      setMessage("결제 대기 상태의 주문만 배송지를 변경할 수 있습니다.");
                      return;
                    }
                    setAddressModalOpen(true);
                  }}
                  disabled={!canChangeDeliveryAddress}
                >
                  {changingAddress ? "변경 중..." : "주소 변경"}
                </button>
              </div>
              <div className="payment-info-list">
                <div>
                  <span>받는 분</span>
                  <strong>{order.receiverName}</strong>
                </div>
                <div>
                  <span>연락처</span>
                  <strong>{order.receiverPhone}</strong>
                </div>
                <div>
                  <span>주소</span>
                  <strong>{order.address}</strong>
                </div>
                <div>
                  <span>배송 요청사항</span>
                  <strong>요청사항 없음</strong>
                </div>
              </div>
            </section>

            <section className="checkout-section payment-products-section">
              <div className="payment-card-header">
                <strong>주문 상품 및 쿠폰</strong>
                <span>{order.items.length}건</span>
              </div>
              <div className="payment-item-list">
                {order.items.map((item) => {
                  const product = productMetaById.get(item.productId);
                  return (
                    <article className="payment-item-card" key={item.id}>
                      <div className="payment-item-image">
                        {product?.imageUrl ? (
                          <Image src={product.imageUrl} alt={item.productNameSnapshot} fill sizes="86px" unoptimized />
                        ) : (
                          <span>PKM</span>
                        )}
                      </div>
                      <div className="payment-item-info">
                        <strong>{item.productNameSnapshot}</strong>
                        <span>{product ? `${product.category} · ${product.series}` : "주문 상품"}</span>
                        <em>일반 배송 · 수량 {item.quantity}개</em>
                      </div>
                      <div className="payment-item-price">
                        <span>상품 금액</span>
                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="payment-coupon-disabled">
                <span>쿠폰</span>
                <strong>사용 가능한 쿠폰이 없습니다.</strong>
              </div>
            </section>

            <section className="checkout-section payment-method-section">
              <div className="payment-card-header">
                <strong>결제 방법</strong>
              </div>
              <div className="payment-method-note">
                <strong>Toss Payments</strong>
                <span>결제 수단은 Toss Payments 결제창에서 선택됩니다.</span>
              </div>
            </section>

            <section className="checkout-section payment-summary-section">
              <div className="payment-card-header">
                <div>
                  <strong>최종 주문 정보</strong>
                  <p>주문번호 {order.orderUid}</p>
                </div>
                <span className="payment-status-chip">{getOrderStatusLabel(order.status)}</span>
              </div>
              <div className="payment-price-list">
                <div>
                  <span>총 상품 금액</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>
                <div>
                  <span>배송비</span>
                  <strong>무료</strong>
                </div>
                <div>
                  <span>할인 금액</span>
                  <strong>{formatPrice(0)}</strong>
                </div>
                <div className="payment-price-total">
                  <span>총 결제 금액</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>
              </div>
              <div className="payment-order-meta">
                <div>
                  <span>주문 상태</span>
                  <strong>{getOrderStatusLabel(order.status)}</strong>
                </div>
                <div>
                  <span>만료 시간</span>
                  <strong>{formatDateTime(order.expiresAt)}</strong>
                </div>
              </div>
            </section>

            {addressModalOpen && (
              <div className="checkout-modal-backdrop" role="presentation" onClick={() => setAddressModalOpen(false)}>
                <div className="checkout-modal address-book-modal" role="dialog" aria-modal="true" aria-label="주소록" onClick={(event) => event.stopPropagation()}>
                  <div className="checkout-modal-head">
                    <strong>주소록</strong>
                    <button type="button" onClick={() => setAddressModalOpen(false)}>닫기</button>
                  </div>
                  <button className="address-add-button" type="button" onClick={() => setAddAddressOpen(true)} disabled={changingAddress}>
                    + 새 주소 추가하기
                  </button>
                  <div className="address-book-list">
                    {addresses.length > 0 ? (
                      addresses.map((address) => (
                        <button
                          key={address.id}
                          className={selectedAddressId === address.id ? "address-book-item is-selected" : "address-book-item"}
                          type="button"
                          onClick={() => void changeOrderDeliveryAddress(address.id)}
                          disabled={changingAddress}
                        >
                          <span>
                            <strong>{address.receiverName}</strong>
                            {address.isDefault && <em>기본 배송지</em>}
                          </span>
                          <small>{formatDeliveryAddress(address)}</small>
                          <small>{address.receiverPhone}</small>
                        </button>
                      ))
                    ) : (
                      <p className="checkout-empty-text">저장된 배송지가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {addAddressOpen && (
              <div className="checkout-modal-backdrop" role="presentation" onClick={() => setAddAddressOpen(false)}>
                <form className="checkout-modal address-form-modal" role="dialog" aria-modal="true" aria-label="주소 추가하기" onSubmit={saveAddress} onClick={(event) => event.stopPropagation()}>
                  <div className="checkout-modal-head">
                    <button type="button" onClick={() => setAddAddressOpen(false)}>이전</button>
                    <strong>주소 추가하기</strong>
                    <button type="button" onClick={() => setAddAddressOpen(false)}>닫기</button>
                  </div>
                  <label>
                    이름
                    <input
                      className="input"
                      value={addressForm.receiverName}
                      placeholder="수령인의 이름"
                      onChange={(event) => setAddressForm((current) => ({ ...current, receiverName: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    휴대폰 번호
                    <input
                      className="input"
                      value={addressForm.receiverPhone}
                      placeholder="- 없이 입력"
                      onChange={(event) => setAddressForm((current) => ({ ...current, receiverPhone: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    우편번호
                    <div className="postcode-row">
                      <input
                        className="input"
                        value={addressForm.zipCode}
                        placeholder="우편번호를 검색하세요"
                        onChange={(event) => setAddressForm((current) => ({ ...current, zipCode: event.target.value }))}
                        required
                      />
                      <button type="button" onClick={openPostcodeSearch} disabled={postcodeLoading}>
                        {postcodeLoading ? "검색 중" : "우편번호"}
                      </button>
                    </div>
                  </label>
                  <label>
                    주소
                    <input
                      className="input"
                      value={addressForm.address1}
                      placeholder="우편번호 검색 후 자동입력됩니다"
                      onChange={(event) => setAddressForm((current) => ({ ...current, address1: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    상세 주소
                    <input
                      className="input"
                      value={addressForm.address2}
                      placeholder="건물, 아파트, 동/호수 입력"
                      onChange={(event) => setAddressForm((current) => ({ ...current, address2: event.target.value }))}
                    />
                  </label>
                  <label className="default-address-check">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))}
                    />
                    기본 배송지로 설정
                  </label>
                  <button className="button primary address-save-button" disabled={savingAddress || changingAddress}>
                    {savingAddress || changingAddress ? "저장 중..." : "저장하기"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {order && (
          <div className="checkout-bottom-cta checkout-bottom-cta-payment">
            <div className="checkout-bottom-cta-inner">
              {order.status === "PAYMENT_PENDING" && (
                <button className="checkout-bottom-secondary-button" type="button" onClick={cancelPayment} disabled={paying || canceling || changingAddress}>
                  {canceling ? "취소 처리 중..." : "결제 취소"}
                </button>
              )}
              <button className="button primary checkout-bottom-button payment-primary-button" type="button" onClick={startPayment} disabled={!canPay}>
                {paying ? "결제 준비 중..." : `${formatPrice(order.totalPrice)} · 결제하기`}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
