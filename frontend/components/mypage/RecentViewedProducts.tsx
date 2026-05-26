"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/api";
import type { RecentViewedProduct } from "./recentViewed";

type RecentViewedProductsProps = {
  products: RecentViewedProduct[];
};

export function RecentViewedProducts({ products }: RecentViewedProductsProps) {
  if (products.length === 0) {
    return <div className="mypage-empty">최근 본 상품이 없습니다.</div>;
  }

  return (
    <div className="mypage-recent-products">
      {products.map((product) => (
        <Link href={`/products/${product.id}`} key={product.id}>
          <span className="mypage-recent-product-image">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill sizes="96px" unoptimized />
            ) : (
              <em>PKM</em>
            )}
          </span>
          <strong>{product.name}</strong>
          <small>{formatPrice(product.price)}</small>
        </Link>
      ))}
    </div>
  );
}
