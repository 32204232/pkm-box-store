import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/api";
import type { Product } from "@/types/api";
import { StatusBadge } from "./StatusBadge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <Link href={`/products/${product.id}`} className="product-image">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 100vw, 240px" unoptimized />
        ) : (
          <span>이미지 없음</span>
        )}
      </Link>
      <div className="card-body stack">
        <div>
          <div className="row">
            <strong>{product.name}</strong>
            <StatusBadge value={product.status} />
          </div>
          <p className="muted">{product.series}</p>
        </div>
        <div className="row">
          <span className="price">{formatPrice(product.price)}</span>
          <Link className="button" href={`/products/${product.id}`}>
            상세
          </Link>
        </div>
      </div>
    </article>
  );
}
