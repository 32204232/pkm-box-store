"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { Product, ProductSearchParams, ProductStatus } from "@/types/api";

type ProductListStatus = Exclude<ProductStatus, "HIDDEN"> | "";
type HomeTab = "recommend" | "ranking" | "event";

const initialFilters: ProductSearchParams = {
  keyword: "",
  category: "",
  series: "",
  inStockOnly: false,
  sort: "latest"
};

function readFiltersFromLocation(): ProductSearchParams {
  if (typeof window === "undefined") {
    return initialFilters;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const status = searchParams.get("status") as ProductListStatus | null;
  const sort = searchParams.get("sort");
  const nextStatus = status === "ON_SALE" || status === "SOLD_OUT" || status === "COMING_SOON" ? status : undefined;

  return {
    keyword: searchParams.get("keyword") ?? "",
    category: searchParams.get("category") ?? "",
    series: searchParams.get("series") ?? "",
    status: nextStatus,
    inStockOnly: searchParams.get("inStockOnly") === "true",
    sort: sort === "priceAsc" || sort === "priceDesc" || sort === "releaseDateDesc" ? sort : "latest"
  };
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductSearchParams>(initialFilters);
  const [homeTab, setHomeTab] = useState<HomeTab>("recommend");

  useEffect(() => {
    setFilters(readFiltersFromLocation());

    function handleSearch(event: Event) {
      const keyword = event instanceof CustomEvent ? String(event.detail?.keyword ?? "") : "";

      setFilters((current) => ({ ...current, keyword }));
      setHomeTab("recommend");
    }

    window.addEventListener("pkm-product-search", handleSearch);

    return () => window.removeEventListener("pkm-product-search", handleSearch);
  }, []);

  useEffect(() => {
    setLoading(true);
    setMessage(null);
    api
      .products(filters)
      .then(setProducts)
      .catch((error) => setMessage(error instanceof Error ? error.message : "상품 목록 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    function syncTabFromHash() {
      setHomeTab(window.location.hash === "#ranking" ? "ranking" : "recommend");
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  const categoryTiles = useMemo(() => {
    const byCategory = new Map<string, Product>();

    products.forEach((product) => {
      if (!byCategory.has(product.category)) {
        byCategory.set(product.category, product);
      }
    });

    return Array.from(byCategory.entries()).slice(0, 8);
  }, [products]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.status === "ON_SALE" && product.stockQuantity > 0).slice(0, 4),
    [products]
  );

  const bannerProduct = useMemo(
    () => featuredProducts.find((product) => product.imageUrl) ?? products.find((product) => product.imageUrl) ?? products[0] ?? null,
    [featuredProducts, products]
  );

  const recommendationProducts = useMemo(() => products.slice(0, 12), [products]);

  const rankingProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          const aPurchasable = a.status === "ON_SALE" && a.stockQuantity > 0 ? 1 : 0;
          const bPurchasable = b.status === "ON_SALE" && b.stockQuantity > 0 ? 1 : 0;

          if (aPurchasable !== bPurchasable) {
            return bPurchasable - aPurchasable;
          }

          if (a.stockQuantity !== b.stockQuantity) {
            return b.stockQuantity - a.stockQuantity;
          }

          return b.price - a.price;
        })
        .slice(0, 12),
    [products]
  );

  const eventProducts = useMemo(
    () => products.filter((product) => product.status === "COMING_SOON" || (product.status === "ON_SALE" && product.stockQuantity > 0)).slice(0, 8),
    [products]
  );

  function updateFilter(next: Partial<ProductSearchParams>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  function selectCategory(category: string) {
    updateFilter({ category });
    setHomeTab("recommend");
  }

  return (
    <div className="stack home-page">
      <section className="home-tab-bar" aria-label="홈 탭">
        <button className={homeTab === "recommend" ? "home-tab is-active" : "home-tab"} type="button" onClick={() => setHomeTab("recommend")}>
          추천
        </button>
        <button className={homeTab === "ranking" ? "home-tab is-active" : "home-tab"} type="button" onClick={() => setHomeTab("ranking")}>
          랭킹
        </button>
        <button className={homeTab === "event" ? "home-tab is-active" : "home-tab"} type="button" onClick={() => setHomeTab("event")}>
          이벤트
        </button>
      </section>

      <section className="home-main-banner" aria-label="메인 배너">
        <div className="home-main-banner-copy">
          <span>{bannerProduct?.status === "COMING_SOON" ? "COMING SOON" : "PICK"}</span>
          <h2>{bannerProduct ? bannerProduct.name : "이번 주 추천 카드 박스"}</h2>
          <p>{bannerProduct ? `${bannerProduct.series} · ${bannerProduct.category}` : "신규 박스 입고와 재고 있는 인기 상품을 확인해 보세요."}</p>
        </div>
        <div className="home-main-banner-visual">
          {bannerProduct?.imageUrl ? (
            <Image src={bannerProduct.imageUrl} alt={bannerProduct.name} fill sizes="(max-width: 760px) 100vw, 460px" unoptimized />
          ) : (
            <div className="home-main-banner-placeholder">
              <span>PKM</span>
              <strong>Card Box Select</strong>
            </div>
          )}
        </div>
      </section>

      <Message message={message} />
      {loading ? (
        <div className="alert">상품 목록을 불러오고 있습니다.</div>
      ) : products.length === 0 ? (
        <div className="alert">
          조건에 맞는 상품이 없습니다.
          {(filters.keyword || filters.category || filters.series || filters.status || filters.inStockOnly) && (
            <button className="home-reset-button" type="button" onClick={resetFilters}>
              전체 상품 보기
            </button>
          )}
        </div>
      ) : homeTab === "recommend" ? (
        <section id="shop" className="home-panel" aria-label="추천 상품">
          <div className="home-section-head">
            <div>
              <span>DISCOVER</span>
              <h2>카테고리 바로가기</h2>
            </div>
            <p>현재 상품 데이터 기준</p>
          </div>

          <div className="home-category-grid">
            {categoryTiles.map(([category, product]) => (
              <button key={category} className="home-category-tile" type="button" onClick={() => selectCategory(category)}>
                <span>{category}</span>
                <strong>{product.series}</strong>
                {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <em>PKM</em>}
              </button>
            ))}
          </div>

          <section className="home-featured-section" aria-label="주목받는 상품">
            <div className="home-section-head">
              <div>
                <span>PICK</span>
                <h2>주목받는 상품</h2>
              </div>
              <p>{featuredProducts.length}개 상품</p>
            </div>
            <div className="grid shop-product-grid home-featured-grid">
              {(featuredProducts.length > 0 ? featuredProducts : recommendationProducts.slice(0, 4)).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <div className="shop-list-head">
            <div>
              <h2>추천 상품</h2>
              <p>{products.length}개 상품</p>
            </div>
            {(filters.keyword || filters.category || filters.series || filters.status || filters.inStockOnly) && (
              <button className="home-reset-button" type="button" onClick={resetFilters}>
                전체 상품 보기
              </button>
            )}
          </div>

          <div className="grid shop-product-grid">
            {recommendationProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : homeTab === "ranking" ? (
        <section id="ranking" className="home-panel" aria-label="추천 랭킹">
          <div className="home-section-head">
            <div>
              <span>RANKING</span>
              <h2>추천 랭킹</h2>
            </div>
            <p>판매 중 상품과 재고를 우선한 현재 상품 기준</p>
          </div>

          <div className="grid shop-product-grid home-ranking-grid">
            {rankingProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} rank={index + 1} />
            ))}
          </div>
        </section>
      ) : (
        <section className="home-panel" aria-label="이벤트">
          <div className="home-section-head">
            <div>
              <span>EVENT</span>
              <h2>이벤트</h2>
            </div>
            <p>현재 상품 상태 기준</p>
          </div>
          <div className="home-event-banner">
            <strong>신규 박스 입고와 판매 예정 상품을 확인해 보세요.</strong>
            <p>관리자 배너 관리는 추후 별도 작업으로 연결할 수 있도록 홈 배너 구조만 먼저 준비했습니다.</p>
          </div>
          {eventProducts.length > 0 ? (
            <div className="grid shop-product-grid">
              {eventProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="alert">표시할 이벤트 상품이 없습니다.</div>
          )}
        </section>
      )}
    </div>
  );
}
