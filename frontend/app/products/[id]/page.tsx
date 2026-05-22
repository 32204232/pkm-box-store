"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = useMemo(() => Number(params.id), [params.id]);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setMessage("올바르지 않은 상품번호입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    api
      .product(productId)
      .then(setProduct)
      .catch((error) => setMessage(error instanceof Error ? error.message : "상품 조회 실패"))
      .finally(() => setLoading(false));
  }, [productId]);

  const isPurchasable = product?.status === "ON_SALE" && product.stockQuantity > 0;
  const submitting = adding || buying;

  async function addToCart() {
    if (!product || submitting || !isPurchasable) {
      return;
    }

    setAdding(true);
    setMessage(null);
    setCartAdded(false);
    try {
      await api.addCartItem({ productId: product.id, quantity });
      setMessage("장바구니에 담았습니다.");
      setCartAdded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 추가 실패");
    } finally {
      setAdding(false);
    }
  }

  async function buyNow() {
    if (!product || submitting || !isPurchasable) {
      return;
    }

    setBuying(true);
    setMessage(null);
    setCartAdded(false);
    try {
      await api.addCartItem({ productId: product.id, quantity });
      router.push("/cart");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "바로 구매 준비 실패");
      setBuying(false);
    }
  }

  if (loading) {
    return <div className="alert">상품을 불러오는 중입니다.</div>;
  }

  if (!product) {
    return <Message message={message ?? "표시할 상품이 없습니다."} />;
  }

  return (
    <div className="product-detail-layout">
      <section className="card product-detail-media">
        <div className="product-detail-image">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 100vw, 560px" unoptimized />
          ) : (
            <span>이미지 없음</span>
          )}
        </div>
      </section>

      <section className="product-detail-info">
        <div className="product-detail-heading">
          <div className="product-detail-title-row">
            <h1>{product.name}</h1>
            <StatusBadge value={product.status} />
          </div>
          <p>{product.description}</p>
        </div>

        <div className="card">
          <div className="card-body stack">
            <div className="product-purchase-summary">
              <span className="muted">판매가</span>
              <strong className="product-detail-price">{formatPrice(product.price)}</strong>
            </div>

            <div className="product-meta-grid">
              <div>
                <span className="muted">카테고리</span>
                <strong>{product.category}</strong>
              </div>
              <div>
                <span className="muted">시리즈</span>
                <strong>{product.series}</strong>
              </div>
              <div>
                <span className="muted">재고</span>
                <strong>{product.stockQuantity}개</strong>
              </div>
              <div>
                <span className="muted">판매 상태</span>
                <strong>{product.status}</strong>
              </div>
            </div>

            <label className="quantity-control">
              <span>수량</span>
              <input
                className="input"
                min={1}
                max={Math.max(product.stockQuantity, 1)}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>

            {!isPurchasable && (
              <div className="alert">현재 구매할 수 없는 상품입니다.</div>
            )}

            <div className="product-action-group">
              <button className="button product-action-secondary" type="button" onClick={addToCart} disabled={submitting || !isPurchasable}>
                {adding ? "담는 중..." : "장바구니 담기"}
              </button>
              <button className="button primary product-action-primary" type="button" onClick={buyNow} disabled={submitting || !isPurchasable}>
                {buying ? "이동 중..." : "바로 구매하기"}
              </button>
            </div>

            <Message message={message} />
            {cartAdded && (
              <Link className="button primary product-cart-link" href="/cart">
                장바구니로 이동
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body stack">
            <strong>상품 설명</strong>
            <p className="muted product-description">{product.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
