"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { Category, Product, ProductLanguage, ProductSeries, ProductStatus, ProductType, ProductUpdateRequest } from "@/types/api";

type ProductForm = {
  name: string;
  description: string;
  price: number;
  retailPrice: string;
  category: string;
  series: string;
  categoryId: string;
  productTypeId: string;
  seriesId: string;
  language: ProductLanguage;
  releaseDate: string;
  stockQuantity: number;
  imageUrl: string;
  status: ProductStatus;
};

const statuses: ProductStatus[] = ["ON_SALE", "SOLD_OUT", "COMING_SOON", "HIDDEN"];
const languages: Array<{ value: ProductLanguage; label: string }> = [
  { value: "KOREAN", label: "한국어판" },
  { value: "JAPANESE", label: "일본어판" },
  { value: "ENGLISH", label: "영어판" }
];
const statusLabels: Record<ProductStatus, string> = {
  ON_SALE: "판매중",
  SOLD_OUT: "품절",
  COMING_SOON: "준비중",
  HIDDEN: "숨김"
};
const allowedImageExtensions = ".jpg,.jpeg,.png,.webp";

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: 0,
  retailPrice: "",
  category: "",
  series: "",
  categoryId: "",
  productTypeId: "",
  seriesId: "",
  language: "KOREAN",
  releaseDate: "",
  stockQuantity: 0,
  imageUrl: "",
  status: "ON_SALE"
};

function toNullableNumber(value: string) {
  return value ? Number(value) : null;
}

function sortCatalog<T extends { id: number; displayOrder: number; active: boolean }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }
    return left.displayOrder - right.displayOrder || left.id - right.id;
  });
}

function catalogOptionLabel(item: { name: string; active: boolean }) {
  return `${item.name}${item.active ? "" : " (비활성)"}`;
}

function languageLabel(value: ProductLanguage | null) {
  return languages.find((language) => language.value === value)?.label ?? "-";
}

function displayCategory(product: Product) {
  return product.categoryName ?? product.category ?? "-";
}

function displayProductType(product: Product) {
  return product.productTypeName ?? "-";
}

function displaySeries(product: Product) {
  return product.seriesName ?? product.series ?? "-";
}

function productToUpdateRequest(product: Product, status: ProductStatus): ProductUpdateRequest {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    retailPrice: product.retailPrice,
    category: product.category,
    series: product.series,
    categoryId: product.categoryId,
    productTypeId: product.productTypeId,
    seriesId: product.seriesId,
    language: product.language,
    releaseDate: product.releaseDate,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    status
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [seriesList, setSeriesList] = useState<ProductSeries[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingProductId, setChangingProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState("");
  const [productTypeIdFilter, setProductTypeIdFilter] = useState("");
  const [seriesIdFilter, setSeriesIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const isEditMode = editingProductId !== null;

  const sortedCategories = useMemo(() => sortCatalog(categories), [categories]);
  const sortedProductTypes = useMemo(() => sortCatalog(productTypes), [productTypes]);
  const sortedSeries = useMemo(() => sortCatalog(seriesList), [seriesList]);

  const formProductTypes = useMemo(() => {
    if (!form.categoryId) {
      return [];
    }
    return sortedProductTypes.filter((productType) => productType.categoryId === Number(form.categoryId));
  }, [form.categoryId, sortedProductTypes]);

  const filterProductTypes = useMemo(() => {
    if (!categoryIdFilter) {
      return sortedProductTypes;
    }
    return sortedProductTypes.filter((productType) => productType.categoryId === Number(categoryIdFilter));
  }, [categoryIdFilter, sortedProductTypes]);

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(
        await api.adminProducts({
          keyword: keywordFilter,
          category: categoryFilter,
          series: seriesFilter,
          categoryId: categoryIdFilter ? Number(categoryIdFilter) : undefined,
          productTypeId: productTypeIdFilter ? Number(productTypeIdFilter) : undefined,
          seriesId: seriesIdFilter ? Number(seriesIdFilter) : undefined,
          status: statusFilter ? (statusFilter as ProductStatus) : undefined,
          lowStockOnly
        })
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const [categoryResponse, productTypeResponse, seriesResponse] = await Promise.all([
        api.getAdminCategories(),
        api.getAdminProductTypes(),
        api.getAdminSeries()
      ]);
      setCategories(categoryResponse);
      setProductTypes(productTypeResponse);
      setSeriesList(seriesResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "카탈로그 목록 조회에 실패했습니다.");
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCatalog();
  }, []);

  function resetFilters() {
    setKeywordFilter("");
    setCategoryFilter("");
    setSeriesFilter("");
    setCategoryIdFilter("");
    setProductTypeIdFilter("");
    setSeriesIdFilter("");
    setStatusFilter("");
    setLowStockOnly(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setSelectedImage(null);
    setEditingProductId(null);
    setEditingProductName("");
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
    setMessage(null);
  }

  function startEdit(product: Product) {
    setEditingProductId(product.id);
    setEditingProductName(product.name);
    setSelectedImage(null);
    setFormOpen(true);
    setMessage(null);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      retailPrice: product.retailPrice === null ? "" : String(product.retailPrice),
      category: product.category,
      series: product.series,
      categoryId: product.categoryId === null ? "" : String(product.categoryId),
      productTypeId: product.productTypeId === null ? "" : String(product.productTypeId),
      seriesId: product.seriesId === null ? "" : String(product.seriesId),
      language: product.language ?? "KOREAN",
      releaseDate: product.releaseDate ?? "",
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl ?? "",
      status: product.status
    });
  }

  function cancelForm() {
    resetForm();
    setFormOpen(false);
    setMessage(isEditMode ? "수정을 취소했습니다." : null);
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

  function changeCategory(value: string) {
    const category = categories.find((item) => item.id === Number(value));
    const nextProductTypeId =
      value && form.productTypeId && productTypes.some((productType) => productType.id === Number(form.productTypeId) && productType.categoryId === Number(value))
        ? form.productTypeId
        : "";

    setForm({
      ...form,
      categoryId: value,
      productTypeId: nextProductTypeId,
      category: category?.name ?? form.category
    });
  }

  function changeSeries(value: string) {
    const series = seriesList.find((item) => item.id === Number(value));
    setForm({
      ...form,
      seriesId: value,
      series: series?.name ?? form.series
    });
  }

  function changeCategoryFilter(value: string) {
    setCategoryIdFilter(value);
    if (productTypeIdFilter && !productTypes.some((productType) => productType.id === Number(productTypeIdFilter) && productType.categoryId === Number(value))) {
      setProductTypeIdFilter("");
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "상품명을 입력해 주세요.";
    }

    if (!form.description.trim()) {
      return "상품 설명을 입력해 주세요.";
    }

    if (form.productTypeId && !form.categoryId) {
      return "상품 유형을 선택하려면 카테고리를 먼저 선택해 주세요.";
    }

    if (
      form.productTypeId &&
      !productTypes.some((productType) => productType.id === Number(form.productTypeId) && productType.categoryId === Number(form.categoryId))
    ) {
      return "선택한 상품 유형이 카테고리에 속하지 않습니다.";
    }

    const categoryName = categories.find((category) => category.id === Number(form.categoryId))?.name ?? form.category.trim();
    const seriesName = seriesList.find((series) => series.id === Number(form.seriesId))?.name ?? form.series.trim();

    if (!categoryName) {
      return "카테고리를 선택하거나 레거시 카테고리 값을 입력해 주세요.";
    }

    if (!seriesName) {
      return "시리즈를 선택하거나 레거시 시리즈 값을 입력해 주세요.";
    }

    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const selectedCategory = categories.find((category) => category.id === Number(form.categoryId));
    const selectedSeries = seriesList.find((series) => series.id === Number(form.seriesId));
    const body = {
      ...form,
      retailPrice: form.retailPrice.trim() ? Number(form.retailPrice) : null,
      category: selectedCategory?.name ?? form.category.trim(),
      series: selectedSeries?.name ?? form.series.trim(),
      categoryId: toNullableNumber(form.categoryId),
      productTypeId: toNullableNumber(form.productTypeId),
      seriesId: toNullableNumber(form.seriesId),
      language: form.language,
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
      setFormOpen(false);
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEditMode ? "상품 수정에 실패했습니다." : "상품 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function hideProduct(product: Product) {
    if (changingProductId !== null) {
      return;
    }

    if (!window.confirm("이 상품을 숨김 처리할까요?")) {
      return;
    }

    setChangingProductId(product.id);
    setMessage(null);
    try {
      await api.hideProduct(product.id);
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 숨김 처리에 실패했습니다.");
    } finally {
      setChangingProductId(null);
    }
  }

  async function activateProduct(product: Product) {
    if (changingProductId !== null) {
      return;
    }

    if (!window.confirm("이 상품을 다시 활성화할까요?")) {
      return;
    }

    setChangingProductId(product.id);
    setMessage(null);
    try {
      await api.updateProduct(product.id, productToUpdateRequest(product, "ON_SALE"));
      await loadProducts();
      setMessage("상품을 활성화했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 활성화에 실패했습니다.");
    } finally {
      setChangingProductId(null);
    }
  }

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack admin-products-page">
        <div className="section-header admin-products-header">
          <div>
            <h1>관리자 상품 관리</h1>
            <p>상품 등록, 수정, 이미지 업로드와 숨김 처리를 관리합니다.</p>
          </div>
        </div>

        <Message message={message} />

        <form
          className="admin-products-filter"
          onSubmit={(event) => {
            event.preventDefault();
            loadProducts();
          }}
        >
          <label>
            상품명 검색
            <input className="input" value={keywordFilter} onChange={(event) => setKeywordFilter(event.target.value)} placeholder="상품명" />
          </label>
          <label>
            Category
            <select className="select" value={categoryIdFilter} onChange={(event) => changeCategoryFilter(event.target.value)}>
              <option value="">전체</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {catalogOptionLabel(category)}
                </option>
              ))}
            </select>
          </label>
          <label>
            ProductType
            <select className="select" value={productTypeIdFilter} onChange={(event) => setProductTypeIdFilter(event.target.value)}>
              <option value="">전체</option>
              {filterProductTypes.map((productType) => (
                <option key={productType.id} value={productType.id}>
                  {catalogOptionLabel(productType)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Series
            <select className="select" value={seriesIdFilter} onChange={(event) => setSeriesIdFilter(event.target.value)}>
              <option value="">전체</option>
              {sortedSeries.map((series) => (
                <option key={series.id} value={series.id}>
                  {catalogOptionLabel(series)}
                </option>
              ))}
            </select>
          </label>
          <label>
            상태
            <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">전체</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            레거시 카테고리
            <input className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} placeholder="부스터 박스" />
          </label>
          <label>
            레거시 시리즈
            <input className="input" value={seriesFilter} onChange={(event) => setSeriesFilter(event.target.value)} placeholder="스칼렛" />
          </label>
          <label className="admin-products-check-row">
            <input type="checkbox" checked={lowStockOnly} onChange={(event) => setLowStockOnly(event.target.checked)} />
            재고 부족만
          </label>
          <div className="admin-products-filter-actions">
            <button className="button primary admin-products-small-button" type="submit">
              검색
            </button>
            <button className="button admin-products-small-button" type="button" onClick={resetFilters}>
              초기화
            </button>
          </div>
        </form>

        <section className="admin-products-panel">
          <div className="admin-products-toolbar">
            <div>
              <h2>상품 목록</h2>
              <p>숨김 상품을 포함해 상품을 선택, 수정, 숨김 처리할 수 있습니다.</p>
            </div>
            <div className="admin-products-toolbar-actions">
              <span>총 {products.length}개</span>
              <button className="button admin-products-add-button" type="button" onClick={openCreateForm}>
                + 상품 등록
              </button>
            </div>
          </div>

          {formOpen && (
            <form className="admin-products-form-panel" onSubmit={submit}>
              <div className="admin-products-form-head">
                <div>
                  <h3>{isEditMode ? "상품 수정" : "새 상품 등록"}</h3>
                  <p>{isEditMode ? `수정 중: ${editingProductName}` : "필수 정보를 입력해 상품을 등록합니다."}</p>
                </div>
              </div>

              <section className="admin-products-form-section">
                <h4>기본 정보</h4>
                <div className="admin-products-form-grid admin-products-basic-grid">
                  <label>
                    상품명
                    <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  </label>
                  <label>
                    상태
                    <select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })}>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-products-wide-field">
                    설명
                    <textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  </label>
                </div>
              </section>

              <section className="admin-products-form-section">
                <h4>가격 정보</h4>
                <div className="admin-products-form-grid">
                  <label>
                    판매가
                    <input className="input" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
                  </label>
                  <label>
                    정가
                    <input
                      className="input"
                      type="number"
                      value={form.retailPrice}
                      onChange={(event) => setForm({ ...form, retailPrice: event.target.value })}
                      placeholder="선택 입력"
                    />
                  </label>
                </div>
              </section>

              <section className="admin-products-form-section">
                <h4>분류 정보</h4>
                {catalogLoading && <div className="admin-products-inline-alert">카탈로그 목록을 불러오고 있습니다.</div>}
                <div className="admin-products-form-grid admin-products-catalog-grid">
                  <label>
                    Category
                    <select className="select" value={form.categoryId} onChange={(event) => changeCategory(event.target.value)}>
                      <option value="">선택 안 함</option>
                      {sortedCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {catalogOptionLabel(category)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ProductType
                    <select
                      className="select"
                      value={form.productTypeId}
                      onChange={(event) => setForm({ ...form, productTypeId: event.target.value })}
                      disabled={!form.categoryId}
                    >
                      <option value="">{form.categoryId ? "선택 안 함" : "카테고리를 먼저 선택하세요"}</option>
                      {formProductTypes.map((productType) => (
                        <option key={productType.id} value={productType.id}>
                          {catalogOptionLabel(productType)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Series
                    <select className="select" value={form.seriesId} onChange={(event) => changeSeries(event.target.value)}>
                      <option value="">선택 안 함</option>
                      {sortedSeries.map((series) => (
                        <option key={series.id} value={series.id}>
                          {catalogOptionLabel(series)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Language
                    <select className="select" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value as ProductLanguage })}>
                      {languages.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <details className="admin-products-legacy-fields" open={!form.categoryId || !form.seriesId}>
                  <summary>레거시 문자열 값</summary>
                  <div className="admin-products-form-grid">
                    <label>
                      기존 카테고리 문자열
                      <input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                    </label>
                    <label>
                      기존 시리즈 문자열
                      <input className="input" value={form.series} onChange={(event) => setForm({ ...form, series: event.target.value })} />
                    </label>
                  </div>
                </details>
              </section>

              <section className="admin-products-form-section">
                <h4>재고/이미지</h4>
                <div className="admin-products-form-grid admin-products-inventory-grid">
                  <label>
                    재고 수량
                    <input
                      className="input"
                      type="number"
                      value={form.stockQuantity}
                      onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    출시일
                    <input className="input" type="date" value={form.releaseDate} onChange={(event) => setForm({ ...form, releaseDate: event.target.value })} />
                  </label>
                  <label className="admin-products-wide-field">
                    이미지 URL
                    <input className="input" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
                  </label>
                  <label>
                    이미지 파일
                    <input className="input" type="file" accept={allowedImageExtensions} onChange={selectImage} />
                  </label>
                  <div className="admin-products-upload-cell">
                    <button className="button admin-products-small-button" type="button" onClick={uploadImage} disabled={uploading || !selectedImage}>
                      {uploading ? "업로드 중..." : "이미지 업로드"}
                    </button>
                  </div>
                </div>
                {form.imageUrl && (
                  <div className="product-image admin-product-preview admin-products-preview">
                    <Image src={form.imageUrl} alt="상품 이미지 미리보기" fill sizes="220px" unoptimized />
                  </div>
                )}
              </section>

              <div className="admin-products-form-actions">
                <button className="button admin-products-small-button" type="button" onClick={cancelForm} disabled={submitting}>
                  취소
                </button>
                <button className="button primary admin-products-small-button" disabled={submitting}>
                  {submitting ? "저장 중..." : isEditMode ? "저장" : "상품 등록"}
                </button>
              </div>
            </form>
          )}

          <div className="table-wrap admin-products-table-wrap">
            {loading ? (
              <div className="admin-products-empty">상품 목록을 불러오고 있습니다.</div>
            ) : products.length === 0 ? (
              <div className="admin-products-empty">
                <strong>등록된 상품이 없습니다.</strong>
                <span>상단의 “+ 상품 등록” 버튼으로 상품을 등록하세요.</span>
              </div>
            ) : (
              <table className="table admin-products-table">
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>분류</th>
                    <th>언어</th>
                    <th>가격</th>
                    <th>재고</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className={editingProductId === product.id ? "admin-products-selected-row" : ""}>
                      <td className="admin-products-name-cell">
                        <strong>{product.name}</strong>
                      </td>
                      <td className="admin-products-category-cell">
                        <strong>{displayCategory(product)}</strong>
                        <span>{displayProductType(product)}</span>
                        <span>{displaySeries(product)}</span>
                      </td>
                      <td>{languageLabel(product.language)}</td>
                      <td className="admin-products-price-cell">
                        <strong>{formatPrice(product.price)}</strong>
                        <span>정가 {product.retailPrice === null ? "-" : formatPrice(product.retailPrice)}</span>
                      </td>
                      <td>{product.stockQuantity}</td>
                      <td>
                        <span className={`admin-products-badge ${product.status.toLowerCase().replace("_", "-")}`}>{statusLabels[product.status]}</span>
                      </td>
                      <td>
                        <div className="admin-products-actions">
                          <button className="button admin-products-row-button" type="button" onClick={() => startEdit(product)} disabled={submitting}>
                            수정
                          </button>
                          {product.status === "HIDDEN" ? (
                            <button
                              className="button admin-products-row-button"
                              type="button"
                              onClick={() => activateProduct(product)}
                              disabled={changingProductId === product.id}
                            >
                              {changingProductId === product.id ? "처리 중..." : "활성화"}
                            </button>
                          ) : (
                            <button
                              className="button danger admin-products-row-button"
                              type="button"
                              onClick={() => hideProduct(product)}
                              disabled={changingProductId === product.id}
                            >
                              {changingProductId === product.id ? "처리 중..." : "숨김"}
                            </button>
                          )}
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
    </RequireAuth>
  );
}
