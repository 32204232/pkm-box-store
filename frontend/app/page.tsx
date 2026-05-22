"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { Product, ProductSearchParams, ProductSort, ProductStatus } from "@/types/api";

type ProductListStatus = Exclude<ProductStatus, "HIDDEN"> | "";

const initialFilters: ProductSearchParams = {
  keyword: "",
  category: "",
  series: "",
  inStockOnly: false,
  sort: "latest"
};

const statusTabs: Array<{ label: string; value: ProductListStatus }> = [
  { label: "전체", value: "" },
  { label: "판매중", value: "ON_SALE" },
  { label: "판매 예정", value: "COMING_SOON" },
  { label: "품절", value: "SOLD_OUT" }
];

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState("");
  const [filters, setFilters] = useState<ProductSearchParams>(initialFilters);

  useEffect(() => {
    setLoading(true);
    setMessage(null);
    api
      .products(filters)
      .then(setProducts)
      .catch((error) => setMessage(error instanceof Error ? error.message : "상품 목록 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, [filters]);

  function searchProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, keyword: keywordInput }));
  }

  function updateFilter(next: Partial<ProductSearchParams>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function resetFilters() {
    setKeywordInput("");
    setFilters(initialFilters);
  }

  return (
    <div className="stack home-page">
      <section className="home-hero" aria-label="스토어 소개">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">Limited Korean Card Boxes</p>
          <h1>박스 단위로 고르는 한국어판 포켓몬 카드</h1>
          <p className="home-hero-copy">신상품, 재입고, 판매 상태를 한눈에 확인하고 원하는 박스를 빠르게 찾아보세요.</p>
          <div className="home-hero-actions" aria-label="추천 탐색">
            <button className="home-hero-chip" type="button" onClick={() => updateFilter({ status: "ON_SALE", inStockOnly: true })}>
              바로 구매 가능
            </button>
            <button className="home-hero-chip" type="button" onClick={() => updateFilter({ sort: "releaseDateDesc" })}>
              최신 출시순
            </button>
            <button className="home-hero-chip" type="button" onClick={() => updateFilter({ status: "COMING_SOON" })}>
              입고 예정
            </button>
          </div>
        </div>
        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-card home-hero-card-main">
            <span>PKM</span>
            <strong>Sealed Box</strong>
          </div>
          <div className="home-hero-card home-hero-card-side">
            <span>RESTOCK</span>
            <strong>Collector grade</strong>
          </div>
        </div>
      </section>

      <section className="shop-filter-bar" aria-label="상품 검색 및 필터">
        <div className="shop-status-tabs" aria-label="판매 상태 필터">
          {statusTabs.map((tab) => {
            const active = (filters.status ?? "") === tab.value;

            return (
              <button
                key={tab.value || "all"}
                className={active ? "shop-status-tab is-active" : "shop-status-tab"}
                type="button"
                onClick={() => updateFilter({ status: tab.value || undefined })}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form className="shop-search" onSubmit={searchProducts}>
          <input
            className="shop-search-input"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="상품명, 시리즈, 설명 검색"
            aria-label="상품 검색어"
          />
          <button className="button primary shop-search-button" type="submit">
            검색
          </button>
        </form>

        <div className="filter-chip-row">
          <label className="filter-chip">
            <span>카테고리</span>
            <input
              value={filters.category ?? ""}
              onChange={(event) => updateFilter({ category: event.target.value })}
              placeholder="전체"
            />
          </label>
          <label className="filter-chip">
            <span>시리즈</span>
            <input
              value={filters.series ?? ""}
              onChange={(event) => updateFilter({ series: event.target.value })}
              placeholder="전체"
            />
          </label>
          <label className="filter-stock-toggle">
            <input
              type="checkbox"
              checked={Boolean(filters.inStockOnly)}
              onChange={(event) => updateFilter({ inStockOnly: event.target.checked })}
            />
            <span>재고 있음</span>
          </label>
          <button className="filter-reset-button" type="button" onClick={resetFilters}>
            초기화
          </button>
        </div>
      </section>

      <div className="shop-list-head">
        <div>
          <h2>Shop</h2>
          <p>{loading ? "상품을 불러오는 중입니다." : `${products.length}개 상품`}</p>
        </div>
        <label className="shop-sort-control">
          <span>정렬</span>
          <select
            value={filters.sort ?? "latest"}
            onChange={(event) => updateFilter({ sort: event.target.value as ProductSort })}
          >
            <option value="latest">최신순</option>
            <option value="priceAsc">낮은 가격순</option>
            <option value="priceDesc">높은 가격순</option>
            <option value="releaseDateDesc">출시일 최신순</option>
          </select>
        </label>
      </div>

      <Message message={message} />
      {loading ? (
        <div className="alert">상품 목록을 불러오고 있습니다.</div>
      ) : products.length === 0 ? (
        <div className="alert">조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div className="grid shop-product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
