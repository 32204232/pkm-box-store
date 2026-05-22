import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";
import { StatusBadge } from "./StatusBadge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-card-link" aria-label={`${product.name} 상세 보기`}>
        <div className="product-image">
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
            <span>{product.status === "ON_SALE" && product.stockQuantity > 0 ? "구매 가능" : "구매 제한"}</span>
          </div>
          <div className="product-card-info">
            <strong className="product-card-title">{product.name}</strong>
            <span className="product-card-meta">{product.series}</span>
          </div>
          <div className="product-card-footer">
            <div>
              <span className="product-card-price-label">즉시 구매가</span>
              <span className="price">{formatPrice(product.price)}</span>
            </div>
            <StatusBadge value={product.status} />
          </div>
          <span className="product-card-stock">재고 {product.stockQuantity}개</span>
        </div>
      </Link>
    </article>
  );
}
