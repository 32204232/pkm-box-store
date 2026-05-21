"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Product, ProductStatus } from "@/types/api";

const statuses: ProductStatus[] = ["ON_SALE", "SOLD_OUT", "COMING_SOON", "HIDDEN"];
const allowedImageExtensions = ".jpg,.jpeg,.png,.webp";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    series: "",
    releaseDate: "",
    stockQuantity: 0,
    imageUrl: "",
    status: "ON_SALE" as ProductStatus
  });

  async function loadProducts() {
    try {
      setProducts(await api.products());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 조회 실패");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    setSelectedImage(event.target.files?.[0] ?? null);
  }

  async function uploadImage() {
    if (!selectedImage) {
      setMessage("업로드할 이미지 파일을 선택하세요.");
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const response = await api.uploadImage(selectedImage);
      setForm((current) => ({ ...current, imageUrl: response.imageUrl }));
      setMessage("이미지를 업로드했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createProduct({
        ...form,
        releaseDate: form.releaseDate || null,
        imageUrl: form.imageUrl || null
      });
      setMessage("상품을 등록했습니다.");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 등록 실패");
    }
  }

  async function hideProduct(id: number) {
    await api.hideProduct(id);
    await loadProducts();
  }

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <h1>관리자 상품 관리</h1>
        </div>
        <Message message={message} />
        <div className="split">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>상품</th>
                  <th>상태</th>
                  <th>가격</th>
                  <th>재고</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      <StatusBadge value={product.status} />
                    </td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.stockQuantity}</td>
                    <td>
                      <button className="button danger" onClick={() => hideProduct(product.id)}>
                        숨김
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="card" onSubmit={submit}>
            <div className="card-body form">
              <strong>상품 등록</strong>
              <label>
                상품명
                <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                설명
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>
              <label>
                가격
                <input
                  className="input"
                  type="number"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                />
              </label>
              <label>
                카테고리
                <input
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                />
              </label>
              <label>
                시리즈
                <input className="input" value={form.series} onChange={(event) => setForm({ ...form, series: event.target.value })} />
              </label>
              <label>
                출시일
                <input
                  className="input"
                  type="date"
                  value={form.releaseDate}
                  onChange={(event) => setForm({ ...form, releaseDate: event.target.value })}
                />
              </label>
              <label>
                재고
                <input
                  className="input"
                  type="number"
                  value={form.stockQuantity}
                  onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })}
                />
              </label>
              <label>
                이미지 파일
                <input className="input" type="file" accept={allowedImageExtensions} onChange={selectImage} />
                <span className="muted">허용 확장자: jpg, jpeg, png, webp</span>
              </label>
              <button className="button" type="button" onClick={uploadImage} disabled={uploading || !selectedImage}>
                {uploading ? "업로드 중..." : "이미지 업로드"}
              </button>
              <label>
                이미지 URL
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                />
              </label>
              {form.imageUrl && (
                <div className="product-image">
                  <Image src={form.imageUrl} alt="상품 이미지 미리보기" fill sizes="320px" unoptimized />
                </div>
              )}
              <label>
                상태
                <select
                  className="select"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button className="button primary">등록</button>
            </div>
          </form>
        </div>
      </div>
    </RequireAuth>
  );
}
