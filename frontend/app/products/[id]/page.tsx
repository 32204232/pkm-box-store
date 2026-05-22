"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";

function formatReleaseDate(value: string | null) {
  if (!value) {
    return "미정";
  }

  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

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
      setMessage("올바르지 않은 상품 번호입니다.");
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
    return (
      <div className="product-detail-state">
        <div className="alert">상품을 불러오는 중입니다.</div>
      </div>
    );
  }

  if (!product) {
    return <Message message={message ?? "표시할 상품이 없습니다."} />;
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-layout">
        <section className="product-detail-media" aria-label="상품 이미지">
          <div className="product-detail-image">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 100vw, 620px" unoptimized />
            ) : (
              <div className="product-detail-placeholder">
                <span>PKM</span>
                <strong>Sealed Box</strong>
              </div>
            )}
          </div>
        </section>

        <aside className="product-detail-panel" aria-label="상품 구매 정보">
          <div className="product-detail-heading">
            <div className="product-detail-kicker">
              <span>{product.category}</span>
              <span>{product.series}</span>
            </div>
            <div className="product-detail-title-row">
              <h1>{product.name}</h1>
              <StatusBadge value={product.status} />
            </div>
            <p>{product.description}</p>
          </div>

          <div className="product-price-block">
            <span>현재 가격</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>

          <div className="product-status-strip">
            <div>
              <span>판매 상태</span>
              <strong>{product.status}</strong>
            </div>
            <div>
              <span>재고</span>
              <strong>{product.stockQuantity}개</strong>
            </div>
          </div>

          <label className="quantity-control product-quantity-selector">
            <span>수량 선택</span>
            <input
              className="input"
              min={1}
              max={Math.max(product.stockQuantity, 1)}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>

          {!isPurchasable && <div className="alert product-detail-alert">현재 구매할 수 없는 상품입니다.</div>}

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

          <div className="product-meta-grid" aria-label="상품 세부 정보">
            <div>
              <span>카테고리</span>
              <strong>{product.category}</strong>
            </div>
            <div>
              <span>시리즈</span>
              <strong>{product.series}</strong>
            </div>
            <div>
              <span>출시일</span>
              <strong>{formatReleaseDate(product.releaseDate)}</strong>
            </div>
            <div>
              <span>재고</span>
              <strong>{product.stockQuantity}개</strong>
            </div>
          </div>
        </aside>
      </div>

      <section className="product-detail-sections">
        <div className="product-info-section">
          <h2>상품 설명</h2>
          <p>{product.description}</p>
        </div>
        <div className="product-info-section">
          <h2>배송 안내</h2>
          <ul>
            <li>결제 완료 후 배송 준비가 시작됩니다.</li>
            <li>관리자 운송장 등록 후 주문 상세에서 배송 정보를 확인할 수 있습니다.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
