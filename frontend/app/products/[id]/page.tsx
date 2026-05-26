"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { ProductCard } from "@/components/ProductCard";
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

function ProductDetailImage({ product, sizes }: { product: Product; sizes: string }) {
  return (
    <div className="product-detail-image">
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt={product.name} fill sizes={sizes} unoptimized />
      ) : (
        <div className="product-detail-placeholder">
          <span>PKM</span>
          <strong>Sealed Box</strong>
        </div>
      )}
    </div>
  );
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

    let ignore = false;
    const currentProduct = product;

    async function loadRelatedProducts() {
      setRelatedLoading(true);
      try {
        const seriesProducts = await api.products({ series: currentProduct.series, sort: "latest" });
        let candidates = seriesProducts.filter((item) => item.id !== currentProduct.id);

        if (candidates.length < 6) {
          const categoryProducts = await api.products({ category: currentProduct.category, sort: "latest" });
          const seenIds = new Set(candidates.map((item) => item.id));
          candidates = [
            ...candidates,
            ...categoryProducts.filter((item) => item.id !== currentProduct.id && !seenIds.has(item.id))
          ];
        }

        if (!ignore) {
          setRelatedProducts(candidates.slice(0, 6));
        }
      } catch {
        if (!ignore) {
          setRelatedProducts([]);
        }
      } finally {
        if (!ignore) {
          setRelatedLoading(false);
        }
      }
    }

    loadRelatedProducts();

    return () => {
      ignore = true;
    };
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
  const hasValidQuantity = product ? Number.isInteger(quantity) && quantity >= 1 && quantity <= product.stockQuantity : false;
  const submitting = adding || buying;

  async function addToCart() {
    if (!product || submitting || !isPurchasable || !hasValidQuantity) {
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
    if (!product || submitting || !isPurchasable || !hasValidQuantity) {
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
        <main className="product-detail-main">
          <section className="product-detail-gallery" aria-label="상품 이미지">
            <div className="product-detail-gallery-head">
              <span>PKM BOX SELECT</span>
              <strong>{product.series}</strong>
            </div>
            <div className="product-detail-media">
              <ProductDetailImage product={product} sizes="(max-width: 760px) 100vw, 760px" />
            </div>
            {product.imageUrl && (
              <div className="product-detail-thumbnail-row" aria-label="상품 썸네일">
                <div className="product-detail-thumbnail is-active">
                  <Image src={product.imageUrl} alt={`${product.name} 썸네일`} fill sizes="72px" unoptimized />
                </div>
              </div>
            )}
          </section>

          <section className="product-detail-information" aria-label="상품 상세 정보">
            <div className="product-info-block product-info-block-primary">
              <div className="product-info-block-head">
                <span>DETAIL</span>
                <h2>상품 정보</h2>
              </div>
              <p>{product.description}</p>
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
                  <span>판매 상태</span>
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
          </section>

          <section className="product-image-section" aria-label="상품 이미지 상세">
            <div className="product-section-head">
              <span>IMAGE</span>
              <h2>상품 이미지</h2>
            </div>
            <div className="product-image-showcase">
              <ProductDetailImage product={product} sizes="(max-width: 760px) 100vw, 720px" />
            </div>
          </section>

          <section className="product-guide-section" aria-label="상품 안내">
            <div className="product-section-head">
              <span>ORDER NOTE</span>
              <h2>상품 안내</h2>
            </div>
            <div className="product-guide-grid">
              <div>
                <span>재고 상태</span>
                <strong>{product.stockQuantity > 0 ? `${product.stockQuantity}개 구매 가능` : "재고 없음"}</strong>
              </div>
              <div>
                <span>판매 상태</span>
                <strong>{formatProductStatusLabel(product.status)}</strong>
              </div>
              <div>
                <span>배송 안내</span>
                <strong>일반 배송 / 결제 후 배송 준비</strong>
              </div>
              <div>
                <span>배송 처리</span>
                <strong>주문 확인 후 관리자 배송 처리</strong>
              </div>
            </div>
          </section>

          <section className="product-series-section" aria-label="시리즈와 카테고리 정보">
            <div className="product-section-head">
              <span>SERIES</span>
              <h2>시리즈 정보</h2>
            </div>
            <div className="product-series-grid">
              <div className="product-series-card">
                <div className="product-series-mark" aria-hidden="true">
                  TCG
                </div>
                <div>
                  <span>Pokemon TCG</span>
                  <h3>{product.series}</h3>
                  <p>{product.category} 카테고리에서 함께 비교할 수 있는 포켓몬 카드 박스 상품입니다.</p>
                </div>
              </div>
              <div className="product-series-card">
                <div className="product-series-mark" aria-hidden="true">
                  BOX
                </div>
                <div>
                  <span>Category</span>
                  <h3>{product.category}</h3>
                  <p>출시일과 재고를 확인한 뒤 수집 목적에 맞게 구매 수량을 선택해 주세요.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="product-related-section" aria-label="함께 본 상품">
            <div className="product-related-head">
              <div>
                <span>RELATED</span>
                <h2>함께 본 상품</h2>
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
              <div className="product-related-empty">같은 시리즈 또는 카테고리의 다른 상품이 아직 없습니다.</div>
            )}
          </section>
        </main>

        <aside className="product-detail-panel" aria-label="상품 구매 정보">
          <div className="product-detail-buybox">
            <div className="product-price-block">
              <span>판매가</span>
              <strong>{formatPrice(product.price)}</strong>
            </div>

            <div className="product-detail-heading">
              <div className="product-detail-kicker">
                <span>{product.category}</span>
                <span>{formatProductStatusLabel(product.status)}</span>
              </div>
              <div className="product-detail-title-row">
                <h1>{product.name}</h1>
              </div>
              <p>{product.description}</p>
            </div>

            <div className="product-purchase-summary" aria-label="구매 요약">
              <div>
                <span>판매 상태</span>
                <strong>{formatProductStatusLabel(product.status)}</strong>
              </div>
              <div>
                <span>재고</span>
                <strong>{product.stockQuantity}개</strong>
              </div>
            </div>

            <div className="product-delivery-line">
              <span>배송 안내</span>
              <strong>일반 배송 / 결제 후 배송 준비</strong>
            </div>

            <div className="product-panel-meta" aria-label="상품 기본 정보">
              <div>
                <span>카테고리</span>
                <strong>{product.category}</strong>
              </div>
              <div>
                <span>시리즈</span>
                <strong>{product.series}</strong>
              </div>
              <div>
                <span>재고</span>
                <strong>{product.stockQuantity}개</strong>
              </div>
              <div>
                <span>출시일</span>
                <strong>{formatReleaseDate(product.releaseDate)}</strong>
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
            {isPurchasable && !hasValidQuantity && <div className="alert product-detail-alert">구매 수량은 1개 이상, 재고 이하로 선택해 주세요.</div>}

            <div className="product-action-group">
              <button className="button primary product-action-primary" type="button" onClick={buyNow} disabled={submitting || !isPurchasable || !hasValidQuantity}>
                {buying ? "이동 중..." : "바로 구매하기"}
              </button>
              <button className="button product-action-secondary" type="button" onClick={addToCart} disabled={submitting || !isPurchasable || !hasValidQuantity}>
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
    </div>
  );
}
