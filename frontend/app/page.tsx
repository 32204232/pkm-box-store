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
    <div className="stack">
      <div className="section-header">
        <div>
          <h1>상품 목록</h1>
          <p>한국어판 포켓몬 카드 박스를 검색하고 조건별로 확인합니다.</p>
        </div>
      </div>

      <section className="filter-panel" aria-label="상품 검색 및 필터">
        <form className="filter-search" onSubmit={searchProducts}>
          <label>
            <span>검색어</span>
            <input
              className="input"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="상품명 또는 설명"
            />
          </label>
          <button className="button primary" type="submit">
            검색
          </button>
        </form>

        <div className="filter-grid">
          <label>
            <span>카테고리</span>
            <input
              className="input"
              value={filters.category ?? ""}
              onChange={(event) => updateFilter({ category: event.target.value })}
              placeholder="예: 부스터 박스"
            />
          </label>
          <label>
            <span>시리즈</span>
            <input
              className="input"
              value={filters.series ?? ""}
              onChange={(event) => updateFilter({ series: event.target.value })}
              placeholder="예: 스칼렛&바이올렛"
            />
          </label>
          <label>
            <span>판매 상태</span>
            <select
              className="select"
              value={filters.status ?? ""}
              onChange={(event) => updateFilter({ status: (event.target.value as ProductListStatus) || undefined })}
            >
              <option value="">전체</option>
              <option value="ON_SALE">ON_SALE</option>
              <option value="SOLD_OUT">SOLD_OUT</option>
              <option value="COMING_SOON">COMING_SOON</option>
            </select>
          </label>
          <label>
            <span>정렬</span>
            <select
              className="select"
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

        <div className="filter-actions">
          <label className="check-row">
            <input
              type="checkbox"
              checked={Boolean(filters.inStockOnly)}
              onChange={(event) => updateFilter({ inStockOnly: event.target.checked })}
            />
            <span>재고 있는 상품만</span>
          </label>
          <button className="button" type="button" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      </section>

      <Message message={message} />
      {loading ? (
        <div className="alert">상품 목록을 불러오고 있습니다.</div>
      ) : products.length === 0 ? (
        <div className="alert">조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
