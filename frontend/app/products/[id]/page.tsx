"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMessage(null);
    api
      .product(params.id)
      .then(setProduct)
      .catch((error) => setMessage(error instanceof Error ? error.message : "상품 조회 실패"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function addToCart() {
    if (!product || adding) {
      return;
    }

    setAdding(true);
    setMessage(null);
    try {
      await api.addCartItem({ productId: product.id, quantity });
      setMessage("장바구니에 담았습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 추가 실패");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <div className="alert">상품을 불러오는 중입니다.</div>;
  }

  if (!product) {
    return <Message message={message ?? "표시할 상품이 없습니다."} />;
  }

  return (
    <div className="split">
      <section className="card">
        <div className="product-image">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 100vw, 640px" unoptimized />
          ) : (
            <span>이미지 없음</span>
          )}
        </div>
      </section>
      <section className="stack">
        <div>
          <div className="row">
            <h1>{product.name}</h1>
            <StatusBadge value={product.status} />
          </div>
          <p className="muted">{product.description}</p>
        </div>
        <div className="card">
          <div className="card-body stack">
            <div className="row">
              <span>가격</span>
              <strong>{formatPrice(product.price)}</strong>
            </div>
            <div className="row">
              <span>카테고리</span>
              <span>{product.category}</span>
            </div>
            <div className="row">
              <span>시리즈</span>
              <span>{product.series}</span>
            </div>
            <div className="row">
              <span>재고</span>
              <span>{product.stockQuantity}</span>
            </div>
            <label>
              수량
              <input
                className="input"
                min={1}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <button className="button primary" onClick={addToCart} disabled={adding || product.status === "HIDDEN"}>
              장바구니 담기
            </button>
            <Message message={message} />
          </div>
        </div>
      </section>
    </div>
  );
}
