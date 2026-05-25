"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";

const RECENT_VIEWED_KEY = "pkm_recent_viewed_products";

function formatProductStatusLabel(product: Product) {
  if (product.status === "ON_SALE" && product.stockQuantity > 0) {
    return "구매 가능";
  }

  switch (product.status) {
    case "ON_SALE":
      return "재고 없음";
    case "SOLD_OUT":
      return "품절";
    case "COMING_SOON":
      return "판매 예정";
    case "HIDDEN":
      return "비공개";
    default:
      return product.status;
  }
}

export function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  function rememberProduct() {
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
        ...viewed.filter((item: { id: number }) => item.id !== product.id)
      ].slice(0, 10);

      window.localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(next));
    } catch {
      // Recent-viewed storage is optional UI state.
    }
  }

  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-card-link" aria-label={`${product.name} 상세 보기`} onClick={rememberProduct}>
        <div className="product-image">
          {rank !== undefined && <span className="product-card-rank">{rank}</span>}
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 50vw, 220px" unoptimized />
          ) : (
            <div className="product-image-placeholder">
              <span>PKM</span>
              <strong>Box Image</strong>
            </div>
          )}
        </div>
        <div className="product-card-body">
          <div className="product-card-kicker">
            <span>{product.category}</span>
            <span>{formatProductStatusLabel(product)}</span>
          </div>
          <div className="product-card-info">
            <strong className="product-card-title">{product.name}</strong>
            <span className="product-card-meta">{product.series}</span>
          </div>
          <div className="product-card-footer">
            <div className="product-card-price">
              <span className="product-card-price-label">즉시 구매가</span>
              <span className="price">{formatPrice(product.price)}</span>
            </div>
            <span className="product-card-stock">재고 {product.stockQuantity}개</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
