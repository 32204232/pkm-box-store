"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { ProductCard } from "@/components/ProductCard";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";

const RECENT_VIEWED_KEY = "pkm_recent_viewed_products";

function formatReleaseDate(value: string | null) {
  if (!value) {
    return "미정";
  }

  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

function formatProductStatusLabel(value: Product["status"]) {
  switch (value) {
    case "ON_SALE":
      return "판매중";
    case "SOLD_OUT":
      return "품절";
    case "COMING_SOON":
      return "판매 예정";
    case "HIDDEN":
      return "비공개";
    default:
      return value;
  }
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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

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

  useEffect(() => {
    if (!product) {
      setRelatedProducts([]);
      return;
    }

    setRelatedLoading(true);
    api
      .products({ series: product.series, sort: "latest" })
      .then((products) => setRelatedProducts(products.filter((item) => item.id !== product.id).slice(0, 6)))
      .catch(() => setRelatedProducts([]))
      .finally(() => setRelatedLoading(false));
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    try {
      const current = window.localStorage.getItem(RECENT_VIEWED_KEY);
      const viewed = current ? JSON.parse(current) : [];
      const next = [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        },
        ...(Array.isArray(viewed) ? viewed.filter((item: { id: number }) => item.id !== product.id) : [])
      ].slice(0, 10);

      window.localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(next));
    } catch {
      // Recent-viewed storage is optional UI state.
    }
  }, [product]);

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
        <section className="product-detail-gallery" aria-label="상품 이미지">
          <div className="product-detail-gallery-head">
            <span>PKM BOX SELECT</span>
            <strong>{product.series}</strong>
          </div>
          <div className="product-detail-media">
            <div className="product-detail-image">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 100vw, 680px" unoptimized />
              ) : (
                <div className="product-detail-placeholder">
                  <span>PKM</span>
                  <strong>Sealed Box</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="product-detail-panel" aria-label="상품 구매 정보">
          <div className="product-detail-buybox">
            <div className="product-detail-heading">
              <div className="product-detail-kicker">
                <span>{product.category}</span>
                <span>{formatProductStatusLabel(product.status)}</span>
              </div>
              <div className="product-detail-title-row">
                <h1>{product.name}</h1>
                <StatusBadge value={product.status} />
              </div>
              <p>{product.description}</p>
            </div>

            <div className="product-price-block">
              <span>즉시 구매가</span>
              <strong>{formatPrice(product.price)}</strong>
            </div>

            <div className="product-purchase-summary" aria-label="구매 요약">
              <div>
                <span>판매 상태</span>
                <strong>{formatProductStatusLabel(product.status)}</strong>
              </div>
              <div>
                <span>남은 수량</span>
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
              <button className="button primary product-action-primary" type="button" onClick={buyNow} disabled={submitting || !isPurchasable}>
                {buying ? "이동 중..." : "바로 구매하기"}
              </button>
              <button className="button product-action-secondary" type="button" onClick={addToCart} disabled={submitting || !isPurchasable}>
                {adding ? "담는 중..." : "장바구니 담기"}
              </button>
            </div>

            <Message message={message} />
            {cartAdded && (
              <Link className="button primary product-cart-link" href="/cart">
                장바구니로 이동
              </Link>
            )}
          </div>
        </aside>
      </div>

      <section className="product-detail-information" aria-label="상품 상세 정보">
        <div className="product-info-block product-info-block-primary">
          <div className="product-info-block-head">
            <span>DETAIL</span>
            <h2>상품 정보</h2>
          </div>
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
              <span>상품 상태</span>
              <strong>{formatProductStatusLabel(product.status)}</strong>
            </div>
            <div>
              <span>재고</span>
              <strong>{product.stockQuantity}개</strong>
            </div>
            <div>
              <span>상품 번호</span>
              <strong>#{product.id}</strong>
            </div>
          </div>
        </div>
        <div className="product-info-block">
          <div className="product-info-block-head">
            <span>NOTE</span>
            <h2>주문 안내</h2>
          </div>
          <ul>
            <li>결제 완료 후 배송 준비가 시작됩니다.</li>
            <li>관리자 운송장 등록 후 주문 상세에서 배송 정보를 확인할 수 있습니다.</li>
          </ul>
        </div>
      </section>

      <section className="product-market-section" aria-label="거래 정보">
        <div className="product-market-head">
          <div>
            <span>MARKET</span>
            <h2>거래</h2>
          </div>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        <div className="product-market-grid">
          <div>
            <span>현재 판매가</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <div>
            <span>판매 상태</span>
            <strong>{formatProductStatusLabel(product.status)}</strong>
          </div>
          <div>
            <span>구매 가능 재고</span>
            <strong>{product.stockQuantity}개</strong>
          </div>
        </div>
        <p className="product-market-note">
          최근 체결 거래 데이터는 아직 제공되지 않습니다. 실제 체결 내역 API가 추가되면 이 영역에 거래가, 수량, 체결 시간을 표시할 수 있습니다.
        </p>
      </section>

      <section className="product-series-section" aria-label="브랜드와 시리즈">
        <div className="product-series-card">
          <div className="product-series-mark" aria-hidden="true">
            PKM
          </div>
          <div>
            <span>BRAND</span>
            <h2>PKM Box Store</h2>
            <p>{product.category}를 중심으로 선별한 포켓몬 카드 박스 셀렉션입니다.</p>
          </div>
        </div>
        <div className="product-series-card">
          <div className="product-series-mark" aria-hidden="true">
            BOX
          </div>
          <div>
            <span>SERIES</span>
            <h2>{product.series}</h2>
            <p>같은 시리즈의 박스를 함께 비교해 보고 수집 방향에 맞게 선택할 수 있습니다.</p>
          </div>
        </div>
      </section>

      <section className="product-related-section" aria-label="같은 시리즈 상품">
        <div className="product-related-head">
          <div>
            <span>RELATED</span>
            <h2>같은 시리즈 상품</h2>
          </div>
          <Link href="/">스토어 보기</Link>
        </div>
        {relatedLoading ? (
          <div className="alert">관련 상품을 불러오고 있습니다.</div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid product-related-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        ) : (
          <div className="product-related-empty">같은 시리즈의 다른 상품이 아직 없습니다.</div>
        )}
      </section>
    </div>
  );
}
