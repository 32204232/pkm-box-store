"use client";

import Image from "next/image";
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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);

  async function loadCart() {
    try {
      const response = await api.cart();
      setCart(response);
      setSelectedItemIds(response.items.map((item) => item.id));
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

  async function removeSelectedItems() {
    if (removingItemId !== null || selectedItemIds.length === 0) {
      return;
    }

    setRemovingItemId(-1);
    setMessage(null);
    try {
      await Promise.all(selectedItemIds.map((id) => api.deleteCartItem(id)));
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "선택 상품 삭제 실패");
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
      const checkoutAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
      if (!checkoutAddress) {
        setMessage("배송/결제를 진행하려면 먼저 배송지를 등록해 주세요.");
        setCreatingOrder(false);
        return;
      }

      const orderRequest = { deliveryAddressId: checkoutAddress.id };
      const order = await api.createOrder(orderRequest);
      router.push(`/orders/${order.id}/payment`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 생성 실패");
      setCreatingOrder(false);
    }
  }

  function toggleItem(id: number) {
    setSelectedItemIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  }

  function toggleAllItems() {
    if (!cart) {
      return;
    }

    setSelectedItemIds((current) => (current.length === cart.items.length ? [] : cart.items.map((item) => item.id)));
  }

  const isCartEmpty = !cart || cart.items.length === 0;
  const allSelected = Boolean(cart?.items.length) && selectedItemIds.length === cart?.items.length;
  const checkoutAddress = addresses.find((item) => item.isDefault) ?? addresses[0];

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
          <form className="cart-checkout" onSubmit={createOrder}>
            <div className="cart-layout">
              <section className="cart-items-panel">
                <div className="cart-panel-header">
                  <div>
                    <h2>장바구니 상품</h2>
                    <p>주문은 현재 장바구니 전체 상품 기준으로 생성됩니다.</p>
                  </div>
                  <strong>{cart?.totalQuantity ?? 0}개</strong>
                </div>

                <div className="cart-toolbar">
                  <label className="cart-select-all">
                    <input type="checkbox" checked={allSelected} onChange={toggleAllItems} disabled={isCartEmpty} />
                    <span>전체 선택</span>
                  </label>
                  <button type="button" onClick={removeSelectedItems} disabled={selectedItemIds.length === 0 || removingItemId !== null}>
                    선택 삭제
                  </button>
                </div>

                <div className="cart-item-list">
                  {cart?.items.map((item) => (
                    <article className="cart-item-card" key={item.id}>
                      <label className="cart-item-check" aria-label={`${item.productName} 선택`}>
                        <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                      </label>
                      <div className="cart-item-image">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.productName} fill sizes="96px" unoptimized /> : <span>PKM</span>}
                      </div>
                      <div className="cart-item-info">
                        <strong>{item.productName}</strong>
                        <span>일반 배송</span>
                        <div className="cart-item-price-row">
                          <span>상품금액</span>
                          <strong>{formatPrice(item.price)}</strong>
                        </div>
                        <label className="cart-item-quantity">
                          수량
                          <input
                            className="input cart-quantity-input"
                            min={1}
                            type="number"
                            value={item.quantity}
                            disabled={updatingItemId === item.id}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                          />
                        </label>
                      </div>
                      <div className="cart-item-actions">
                        <button type="button" onClick={() => removeItem(item.id)} disabled={removingItemId === item.id}>
                          삭제
                        </button>
                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </div>
                    </article>
                  ))}
                  {isCartEmpty && <div className="alert cart-empty">장바구니가 비어 있습니다.</div>}
                </div>
              </section>

              <aside className="cart-summary">
                <section className="checkout-section">
                  <div className="cart-summary-header">
                    <div>
                      <strong>주문 안내</strong>
                      <p>배송 주소는 배송/결제 화면에서 확인합니다.</p>
                    </div>
                  </div>
                  {addressLoading ? (
                    <div className="alert">배송지를 확인하고 있습니다.</div>
                  ) : checkoutAddress ? (
                    <div className="selected-address-card">
                      <div className="selected-address-title">
                        <strong>{checkoutAddress.label || "주문 생성 배송지"}</strong>
                        {checkoutAddress.isDefault && <span className="badge">기본 배송지</span>}
                      </div>
                      <p>배송/결제 단계에서 주소를 다시 확인해 주세요.</p>
                    </div>
                  ) : (
                    <div className="cart-address-empty">
                      <strong>저장된 배송지가 없습니다.</strong>
                      <p>내 배송지에 주소를 등록한 뒤 주문을 생성할 수 있습니다.</p>
                    </div>
                  )}
                </section>

                <section className="checkout-section">
                  <div className="cart-summary-header">
                    <div>
                      <strong>예상 결제금액</strong>
                      <p>쿠폰/포인트 기능은 아직 제공되지 않습니다.</p>
                    </div>
                  </div>
                  <div className="cart-total-box">
                    <div className="row">
                      <span>총 상품 수량</span>
                      <strong>{cart?.totalQuantity ?? 0}개</strong>
                    </div>
                    <div className="row">
                      <span>총 상품금액</span>
                      <strong>{formatPrice(cart?.totalPrice ?? 0)}</strong>
                    </div>
                    <div className="row cart-total-price">
                      <span>예상 결제금액</span>
                      <strong>{formatPrice(cart?.totalPrice ?? 0)}</strong>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            <div className="cart-sticky-order">
              <button className="button primary cart-order-button" disabled={creatingOrder || isCartEmpty}>
                {creatingOrder ? "주문 생성 중..." : `${formatPrice(cart?.totalPrice ?? 0)} · 전체 주문하기`}
              </button>
            </div>
          </form>
        )}
      </div>
    </RequireAuth>
  );
}
