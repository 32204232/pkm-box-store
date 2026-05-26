"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { ProductCard } from "@/components/ProductCard";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { Cart, CartItem, Product } from "@/types/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [quantityModalItem, setQuantityModalItem] = useState<CartItem | null>(null);
  const [quantityDraft, setQuantityDraft] = useState(1);
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

  async function loadRecommendedProducts() {
    try {
      const response = await api.products({ sort: "latest" });
      setRecommendedProducts(response.filter((product) => product.status === "ON_SALE" && product.stockQuantity > 0));
    } catch {
      setRecommendedProducts([]);
    }
  }

  useEffect(() => {
    loadCart();
    loadRecommendedProducts();
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

  async function clearCartItems() {
    if (removingItemId !== null || isCartEmpty) {
      return;
    }

    setRemovingItemId(-1);
    setMessage(null);
    try {
      await api.clearCart();
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 비우기 실패");
    } finally {
      setRemovingItemId(null);
    }
  }

  async function confirmQuantityChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quantityModalItem || quantityDraft < 1) {
      return;
    }

    await updateQuantity(quantityModalItem.id, quantityDraft);
    setQuantityModalItem(null);
  }

  function openQuantityModal(item: CartItem) {
    setQuantityModalItem(item);
    setQuantityDraft(item.quantity);
  }

  async function createOrder() {
    if (creatingOrder) {
      return;
    }

    setCreatingOrder(true);
    setMessage(null);
    try {
      const order = await api.createOrder({ deferDeliveryAddress: true });
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
  const hasCartItems = Boolean(cart && cart.items.length > 0);
  const allSelected = Boolean(cart?.items.length) && selectedItemIds.length === cart?.items.length;
  const selectedItems = cart?.items.filter((item) => selectedItemIds.includes(item.id)) ?? [];
  const selectedCount = selectedItems.length;
  const productMetaById = useMemo(() => new Map(recommendedProducts.map((product) => [product.id, product])), [recommendedProducts]);

  return (
    <RequireAuth>
      <div className="cart-page">
        <div className="cart-page-head">
          <h1>장바구니</h1>
          <p>주문 전 상품과 수량을 확인해 주세요.</p>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert cart-state-card">장바구니를 불러오고 있습니다.</div>
        ) : isCartEmpty ? (
          <>
            <div className="cart-empty-state">
              <strong>장바구니가 비어 있습니다.</strong>
              <p>마음에 드는 포켓몬 카드 박스를 장바구니에 담아보세요.</p>
              <Link className="button primary" href="/#shop">
                상품 보러가기
              </Link>
            </div>
            <RecommendedProducts products={recommendedProducts} />
          </>
        ) : (
          <div className="cart-checkout">
            <div className="cart-layout cart-layout-single">
              <section className="cart-items-panel">
                <div className="cart-delivery-count-card">
                  <div>
                    <span>일반 배송</span>
                    <strong>장바구니 상품</strong>
                  </div>
                  <em>총 {cart?.items.length ?? 0}개</em>
                </div>

                <div className="cart-toolbar">
                  <label className="cart-select-all">
                    <input type="checkbox" checked={allSelected} onChange={toggleAllItems} disabled={isCartEmpty} />
                    <span>전체 선택</span>
                  </label>
                  <div className="cart-toolbar-actions">
                    <button type="button" onClick={removeSelectedItems} disabled={selectedItemIds.length === 0 || removingItemId !== null}>
                      선택 삭제
                    </button>
                    <button type="button" onClick={clearCartItems} disabled={isCartEmpty || removingItemId !== null}>
                      전체 비우기
                    </button>
                  </div>
                </div>

                <div className="cart-item-list">
                  {cart.items.map((item) => {
                    const productMeta = productMetaById.get(item.productId);
                    return (
                      <article className="cart-item-card" key={item.id}>
                        <label className="cart-item-check" aria-label={`${item.productName} 선택`}>
                          <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                        </label>
                        <div className="cart-item-image">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.productName} fill sizes="112px" unoptimized />
                          ) : (
                            <span>
                              <strong>PKM</strong>
                            </span>
                          )}
                        </div>
                        <div className="cart-item-info">
                          <strong>{item.productName}</strong>
                          <span>{productMeta ? `${productMeta.category} · ${productMeta.series}` : "상품 정보"}</span>
                          <small>일반 배송</small>
                          <div className="cart-item-mobile-price">{formatPrice(item.lineTotal)}</div>
                        </div>
                        <div className="cart-item-detail">
                          <div>
                            <span>수량</span>
                            <strong>{item.quantity}개</strong>
                          </div>
                          <div>
                            <span>상품금액</span>
                            <strong>{formatPrice(item.price)}</strong>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <strong>{formatPrice(item.lineTotal)}</strong>
                          <div>
                            <button type="button" onClick={() => openQuantityModal(item)}>
                              옵션/수량 변경
                            </button>
                            <button
                              type="button"
                              onClick={createOrder}
                              disabled={creatingOrder || isCartEmpty}
                              title="현재 백엔드는 개별 상품 주문이 아닌 장바구니 전체 주문만 지원합니다."
                            >
                              전체 주문하기
                            </button>
                            <button type="button" onClick={() => removeItem(item.id)} disabled={removingItemId === item.id}>
                              삭제
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <section className="checkout-section cart-selected-summary">
                  <div className="cart-summary-header">
                    <div>
                      <strong>선택 주문정보</strong>
                      <p>배송 주소와 결제 수단은 다음 배송/결제 화면에서 입력합니다.</p>
                    </div>
                  </div>
                  <div className="cart-total-box">
                    <div className="row">
                      <span>선택 상품</span>
                      <strong>{selectedCount}건</strong>
                    </div>
                    <div className="row">
                      <span>총 상품금액</span>
                      <strong>{formatPrice(cart.totalPrice)}</strong>
                    </div>
                    <div className="row">
                      <span>배송비</span>
                      <strong>별도 배송비 없음</strong>
                    </div>
                    <div className="row cart-total-price">
                      <span>총 결제 예정 금액</span>
                      <strong>{formatPrice(cart.totalPrice)}</strong>
                    </div>
                  </div>
                </section>
              </section>
            </div>

            <RecommendedProducts products={recommendedProducts} />

            {quantityModalItem && (
              <div className="cart-modal-backdrop" role="presentation" onClick={() => setQuantityModalItem(null)}>
                <form className="cart-quantity-modal" role="dialog" aria-modal="true" aria-label="옵션/수량 변경" onSubmit={confirmQuantityChange} onClick={(event) => event.stopPropagation()}>
                  <div className="cart-modal-head">
                    <strong>옵션/수량 변경</strong>
                    <button type="button" onClick={() => setQuantityModalItem(null)}>
                      닫기
                    </button>
                  </div>
                  <div className="cart-modal-product">
                    <div className="cart-item-image">
                      {quantityModalItem.imageUrl ? (
                        <Image src={quantityModalItem.imageUrl} alt={quantityModalItem.productName} fill sizes="88px" unoptimized />
                      ) : (
                        <span>
                          <strong>PKM</strong>
                        </span>
                      )}
                    </div>
                    <div>
                      <strong>{quantityModalItem.productName}</strong>
                      <span>{formatPrice(quantityModalItem.price)}</span>
                      <em>일반 배송</em>
                    </div>
                  </div>
                  <label className="cart-modal-quantity">
                    수량 선택
                    <input className="input" min={1} type="number" value={quantityDraft} onChange={(event) => setQuantityDraft(Number(event.target.value))} />
                  </label>
                  <button className="button primary cart-modal-submit" disabled={updatingItemId === quantityModalItem.id || quantityDraft < 1}>
                    {updatingItemId === quantityModalItem.id ? "변경 중..." : "확인"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {hasCartItems && (
          <div className="checkout-bottom-cta checkout-bottom-cta-cart">
            <div className="checkout-bottom-cta-inner checkout-bottom-cta-inner-wide">
              <button className="button primary checkout-bottom-button cart-order-button" type="button" onClick={createOrder} disabled={creatingOrder}>
                {creatingOrder ? "주문 생성 중..." : `${formatPrice(cart!.totalPrice)} · 전체 주문하기`}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

function RecommendedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="cart-recommend-section">
      <div className="cart-recommend-head">
        <h2>추천 상품</h2>
        <p>함께 볼 만한 상품</p>
      </div>
      <div className="cart-recommend-grid">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
