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

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  category: "",
  series: "",
  releaseDate: "",
  stockQuantity: 0,
  imageUrl: "",
  status: "ON_SALE" as ProductStatus
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hidingProductId, setHidingProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isEditMode = editingProductId !== null;

  async function loadProducts() {
    try {
      setProducts(await api.adminProducts());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setSelectedImage(null);
    setEditingProductId(null);
  }

  function startEdit(product: Product) {
    setEditingProductId(product.id);
    setSelectedImage(null);
    setMessage(null);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      series: product.series,
      releaseDate: product.releaseDate ?? "",
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl ?? "",
      status: product.status
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage("수정을 취소했습니다.");
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    setSelectedImage(event.target.files?.[0] ?? null);
  }

  async function uploadImage() {
    if (!selectedImage || uploading) {
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const response = await api.uploadImage(selectedImage);
      setForm((current) => ({ ...current, imageUrl: response.imageUrl }));
      setMessage("이미지를 업로드했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const body = {
      ...form,
      releaseDate: form.releaseDate || null,
      imageUrl: form.imageUrl || null
    };

    try {
      if (editingProductId !== null) {
        await api.updateProduct(editingProductId, body);
        setMessage("상품 수정을 저장했습니다.");
      } else {
        await api.createProduct(body);
        setMessage("상품을 등록했습니다.");
      }
      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEditMode ? "상품 수정에 실패했습니다." : "상품 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function hideProduct(id: number) {
    if (hidingProductId !== null) {
      return;
    }

    setHidingProductId(id);
    setMessage(null);
    try {
      await api.hideProduct(id);
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 숨김 처리에 실패했습니다.");
    } finally {
      setHidingProductId(null);
    }
  }

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>관리자 상품 관리</h1>
            <p>상품 등록, 수정, 이미지 업로드와 숨김 처리를 관리합니다.</p>
          </div>
        </div>
        <Message message={message} />
        <div className="admin-products-layout">
          <form className="card admin-product-form-card" onSubmit={submit}>
            <div className="card-body form admin-product-form">
              <div className="admin-product-mode">
                <div>
                  <span className="badge">{isEditMode ? "수정 모드" : "등록 모드"}</span>
                  <strong>{isEditMode ? "상품 정보를 수정합니다." : "새 상품을 등록합니다."}</strong>
                  <p>{isEditMode ? "수정 후 저장하거나 취소해서 등록 모드로 돌아갈 수 있습니다." : "필수 정보를 입력한 뒤 상품을 등록하세요."}</p>
                </div>
                {isEditMode && (
                  <button className="button admin-product-cancel-edit" type="button" onClick={cancelEdit} disabled={submitting}>
                    수정 취소
                  </button>
                )}
              </div>

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

              <div className="admin-product-image-section">
                <div className="admin-product-section-title">
                  <strong>상품 이미지</strong>
                  <p>이미지 파일을 업로드하거나 이미지 URL을 직접 입력할 수 있습니다.</p>
                </div>
                <label>
                  이미지 파일
                  <input className="input" type="file" accept={allowedImageExtensions} onChange={selectImage} />
                  <span className="muted">허용 확장자: jpg, jpeg, png, webp</span>
                </label>
                <button className="button admin-product-upload-button" type="button" onClick={uploadImage} disabled={uploading || !selectedImage}>
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
                  <div className="product-image admin-product-preview">
                    <Image src={form.imageUrl} alt="상품 이미지 미리보기" fill sizes="320px" unoptimized />
                  </div>
                )}
              </div>

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
              <button className="button primary admin-product-submit" disabled={submitting}>
                {submitting ? "저장 중..." : isEditMode ? "수정 저장" : "상품 등록"}
              </button>
            </div>
          </form>

          <section className="admin-products-list">
            <div className="admin-products-list-header">
              <div>
                <h2>상품 목록</h2>
                <p>숨김 상품을 포함해 상품을 선택, 수정, 숨김 처리할 수 있습니다.</p>
              </div>
              <strong>{products.length}개</strong>
            </div>
            <div className="table-wrap admin-products-table-wrap">
              {loading ? (
                <div className="alert admin-products-empty">상품 목록을 불러오고 있습니다.</div>
              ) : products.length === 0 ? (
                <div className="alert admin-products-empty">등록된 상품이 없습니다.</div>
              ) : (
                <table className="table admin-products-table">
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th>가격</th>
                      <th>재고</th>
                      <th>상태</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <span className="muted">{product.category} / {product.series}</span>
                        </td>
                        <td>
                          <strong>{formatPrice(product.price)}</strong>
                        </td>
                        <td>{product.stockQuantity}</td>
                        <td>
                          <StatusBadge value={product.status} />
                        </td>
                        <td>
                          <div className="admin-products-actions">
                            <button className="button" type="button" onClick={() => startEdit(product)} disabled={submitting}>
                              수정
                            </button>
                            <button
                              className="button danger admin-products-hide-button"
                              type="button"
                              onClick={() => hideProduct(product.id)}
                              disabled={hidingProductId === product.id}
                            >
                              {hidingProductId === product.id ? "처리 중..." : "숨김"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
