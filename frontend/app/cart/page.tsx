"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { Cart, DeliveryAddress } from "@/types/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  async function loadCart() {
    try {
      setCart(await api.cart());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function loadAddresses() {
    try {
      const response = await api.deliveryAddresses();
      setAddresses(response);
      const defaultAddress = response.find((item) => item.isDefault);
      setSelectedAddressId(defaultAddress?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "배송지 조회 실패");
    } finally {
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  async function updateQuantity(id: number, quantity: number) {
    if (updatingItemId !== null || quantity < 1) {
      return;
    }

    setUpdatingItemId(id);
    setMessage(null);
    try {
      await api.updateCartItem(id, { quantity });
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수량 변경 실패");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function removeItem(id: number) {
    if (removingItemId !== null) {
      return;
    }

    setRemovingItemId(id);
    setMessage(null);
    try {
      await api.deleteCartItem(id);
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 상품 삭제 실패");
    } finally {
      setRemovingItemId(null);
    }
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingOrder) {
      return;
    }

    setCreatingOrder(true);
    setMessage(null);
    try {
      const orderRequest =
        selectedAddressId !== null
          ? { deliveryAddressId: selectedAddressId }
          : { receiverName, receiverPhone, address };
      const order = await api.createOrder(orderRequest);
      router.push(`/orders/${order.id}/payment`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 생성 실패");
      setCreatingOrder(false);
    }
  }

  const isCartEmpty = !cart || cart.items.length === 0;
  const selectedAddress = addresses.find((item) => item.id === selectedAddressId);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <h1>장바구니</h1>
        </div>
        <Message message={message} />
        {loading ? (
          <div className="alert">장바구니를 불러오고 있습니다.</div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-panel-header">
                <div>
                  <h2>장바구니 상품</h2>
                  <p>주문할 상품과 수량을 확인해 주세요.</p>
                </div>
                <strong>{cart?.totalQuantity ?? 0}개</strong>
              </div>
              <div className="table-wrap cart-table-wrap">
                <table className="table cart-table">
                  <thead>
                    <tr>
                      <th>상품</th>
                      <th>가격</th>
                      <th>수량</th>
                      <th>합계</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart?.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.productName}</strong>
                        </td>
                        <td>{formatPrice(item.price)}</td>
                        <td>
                          <input
                            className="input cart-quantity-input"
                            min={1}
                            type="number"
                            value={item.quantity}
                            disabled={updatingItemId === item.id}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                          />
                        </td>
                        <td>
                          <strong>{formatPrice(item.lineTotal)}</strong>
                        </td>
                        <td>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={removingItemId === item.id}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isCartEmpty && <div className="alert cart-empty">장바구니가 비어 있습니다.</div>}
              </div>
            </section>

            <form className="card cart-summary" onSubmit={createOrder}>
              <div className="card-body form">
                <div className="cart-summary-header">
                  <div>
                    <strong>주문 요약</strong>
                    <p>배송지 확인 후 주문을 생성합니다.</p>
                  </div>
                </div>

                <div className="cart-total-box">
                  <div className="row">
                    <span>총 수량</span>
                    <strong>{cart?.totalQuantity ?? 0}개</strong>
                  </div>
                  <div className="row cart-total-price">
                    <span>총 금액</span>
                    <strong>{formatPrice(cart?.totalPrice ?? 0)}</strong>
                  </div>
                </div>

                <div className="cart-address-section">
                  <label>
                    저장된 배송지
                    <select
                      className="input"
                      value={selectedAddressId ?? ""}
                      disabled={addressLoading}
                      onChange={(event) =>
                        setSelectedAddressId(event.target.value ? Number(event.target.value) : null)
                      }
                    >
                      <option value="">직접 입력</option>
                      {addresses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label || item.receiverName}
                          {item.isDefault ? " (기본)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {addressLoading && <div className="alert">배송지를 불러오고 있습니다.</div>}
                  {!addressLoading && addresses.length === 0 && (
                    <div className="cart-address-empty">
                      <strong>저장된 배송지가 없습니다.</strong>
                      <p>배송지를 미리 등록하면 주문서에서 바로 선택할 수 있습니다.</p>
                      <Link href="/my/addresses" className="button">
                        배송지 관리로 이동
                      </Link>
                    </div>
                  )}
                  {selectedAddress && (
                    <div className="selected-address-card">
                      <div className="selected-address-title">
                        <strong>{selectedAddress.label || "선택한 배송지"}</strong>
                        {selectedAddress.isDefault && <span className="badge">기본 배송지</span>}
                      </div>
                      <p>
                        {selectedAddress.receiverName} / {selectedAddress.receiverPhone}
                      </p>
                      <p>
                        [{selectedAddress.zipCode}] {selectedAddress.address1} {selectedAddress.address2 ?? ""}
                      </p>
                    </div>
                  )}
                </div>

                <div className="cart-direct-address">
                  <strong>직접 입력</strong>
                  <label>
                    수령인
                    <input
                      className="input"
                      value={receiverName}
                      onChange={(event) => setReceiverName(event.target.value)}
                    />
                  </label>
                  <label>
                    연락처
                    <input
                      className="input"
                      value={receiverPhone}
                      onChange={(event) => setReceiverPhone(event.target.value)}
                    />
                  </label>
                  <label>
                    주소
                    <textarea
                      className="textarea"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                </div>

                <button className="button primary cart-order-button" disabled={creatingOrder || isCartEmpty}>
                  {creatingOrder ? "주문 생성 중..." : "주문 생성"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
