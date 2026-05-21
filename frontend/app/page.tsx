"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { Product } from "@/types/api";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .products()
      .then(setProducts)
      .catch((error) => setMessage(error instanceof Error ? error.message : "상품 목록 조회 실패"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <div className="section-header">
        <div>
          <h1>상품 목록</h1>
          <p>한국어판 포켓몬 카드 박스만 표시합니다.</p>
        </div>
      </div>
      <Message message={message} />
      {loading ? (
        <div className="alert">상품 목록을 불러오고 있습니다.</div>
      ) : products.length === 0 ? (
        <div className="alert">표시할 상품이 없습니다.</div>
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
