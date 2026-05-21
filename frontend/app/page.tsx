"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { Product } from "@/types/api";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .products()
      .then(setProducts)
      .catch((error) => setMessage(error.message));
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
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
