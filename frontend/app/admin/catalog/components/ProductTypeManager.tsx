"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Category, ProductType } from "@/types/api";
import {
  activeLabel,
  buildBasicCatalogRequest,
  categoryOptionLabel,
  formFromProductType,
  sortByDisplayOrder,
  type ProductTypeForm,
  validateBasicCatalogForm
} from "./catalogForm";

type ProductTypeManagerProps = {
  onMessage: (message: string | null) => void;
};

function emptyProductTypeForm(categoryId = 0): ProductTypeForm {
  return {
    categoryId,
    name: "",
    slug: "",
    description: "",
    displayOrder: 0,
    active: true
  };
}

export function ProductTypeManager({ onMessage }: ProductTypeManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [form, setForm] = useState<ProductTypeForm>(emptyProductTypeForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isEditMode = editingId !== null;
  const sortedProductTypes = sortByDisplayOrder(productTypes);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((left, right) => {
      if (left.active !== right.active) {
        return left.active ? -1 : 1;
      }
      return left.displayOrder - right.displayOrder || left.id - right.id;
    });
  }, [categories]);

  const activeCategories = useMemo(() => sortedCategories.filter((category) => category.active), [sortedCategories]);
  const selectedCategory = categories.find((category) => category.id === form.categoryId);

  async function loadCatalog() {
    setLoading(true);
    try {
      const [categoryResponse, productTypeResponse] = await Promise.all([api.getAdminCategories(), api.getAdminProductTypes()]);
      setCategories(categoryResponse);
      setProductTypes(productTypeResponse);

      setForm((current) => {
        if (current.categoryId !== 0 || editingId !== null) {
          return current;
        }

        const firstActiveCategory = categoryResponse.find((category) => category.active);
        return emptyProductTypeForm(firstActiveCategory?.id ?? 0);
      });
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "상품 유형 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  function firstActiveCategoryId(nextCategories = categories) {
    return sortByDisplayOrder(nextCategories).find((category) => category.active)?.id ?? 0;
  }

  function resetForm(nextCategories = categories) {
    setForm(emptyProductTypeForm(firstActiveCategoryId(nextCategories)));
    setEditingId(null);
    setEditingName("");
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
    onMessage(null);
  }

  function startEdit(productType: ProductType) {
    setForm(formFromProductType(productType));
    setEditingId(productType.id);
    setEditingName(productType.name);
    setFormOpen(true);
    onMessage(null);
  }

  function cancelForm() {
    resetForm();
    setFormOpen(false);
    onMessage(isEditMode ? "상품 유형 수정을 취소했습니다." : null);
  }

  function validateForm() {
    const validationMessage = validateBasicCatalogForm(form);
    if (validationMessage) {
      return validationMessage;
    }

    if (!form.categoryId) {
      return "카테고리를 선택해 주세요.";
    }

    const category = categories.find((item) => item.id === form.categoryId);
    if (!category) {
      return "선택한 카테고리를 찾을 수 없습니다.";
    }

    if (!category.active) {
      return "상품 유형 저장은 활성 카테고리만 선택할 수 있습니다. 카테고리를 먼저 활성화하거나 다른 카테고리를 선택해 주세요.";
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
      onMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    onMessage(null);

    const body = {
      categoryId: form.categoryId,
      ...buildBasicCatalogRequest(form)
    };

    try {
      if (editingId !== null) {
        await api.updateAdminProductType(editingId, body);
        onMessage("상품 유형 수정을 저장했습니다.");
      } else {
        await api.createAdminProductType(body);
        onMessage("상품 유형을 생성했습니다.");
      }
      resetForm();
      setFormOpen(false);
      await loadCatalog();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : isEditMode ? "상품 유형 수정에 실패했습니다." : "상품 유형 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(productType: ProductType) {
    if (togglingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      productType.active
        ? "이 상품 유형을 숨김 처리할까요?\n숨김 처리해도 기존 상품의 참조는 유지됩니다."
        : "이 상품 유형을 다시 활성화할까요?"
    );
    if (!confirmed) {
      return;
    }

    setTogglingId(productType.id);
    onMessage(null);

    try {
      await api.updateAdminProductType(productType.id, {
        categoryId: productType.categoryId,
        ...buildBasicCatalogRequest(formFromProductType(productType)),
        active: !productType.active
      });
      onMessage(productType.active ? "상품 유형을 숨김 처리했습니다." : "상품 유형을 활성화했습니다.");
      await loadCatalog();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "상품 유형 상태 변경에 실패했습니다.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="admin-catalog-panel" aria-label="상품 유형 관리">
      <div className="admin-catalog-toolbar">
        <div>
          <h2>상품 유형</h2>
          <p>카테고리별 상품 유형을 관리합니다.</p>
        </div>
        <div className="admin-catalog-toolbar-actions">
          <span>{productTypes.length}개</span>
          <button className="button admin-catalog-add-button" type="button" onClick={openCreateForm}>
            + 상품 유형 추가
          </button>
        </div>
      </div>

      {formOpen && (
        <form className="admin-catalog-inline-form" onSubmit={submit}>
          <div className="admin-catalog-form-head">
            <div>
              <h3>{isEditMode ? "상품 유형 수정" : "새 상품 유형 추가"}</h3>
              <p>{isEditMode ? `수정 중: ${editingName}` : "상품 유형은 활성 카테고리에 연결해서 저장합니다."}</p>
            </div>
          </div>
          <div className="admin-catalog-form-grid admin-catalog-product-type-form-grid">
            <label>
              카테고리
              <select
                className="select"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })}
                disabled={activeCategories.length === 0}
              >
                <option value={0}>카테고리 선택</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryOptionLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              이름
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              slug
              <input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="booster-pack" />
            </label>
            <label className="admin-catalog-description-field">
              설명
              <input className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              순서
              <input
                className="input"
                type="number"
                value={form.displayOrder}
                onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })}
              />
            </label>
            <label className="catalog-active-row">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              활성
            </label>
          </div>
          {selectedCategory && !selectedCategory.active && (
            <div className="catalog-warning">선택한 카테고리가 숨김 상태입니다. 저장하려면 카테고리를 먼저 활성화하거나 다른 카테고리를 선택하세요.</div>
          )}
          <div className="admin-catalog-form-actions">
            <button className="button admin-catalog-small-button" type="button" onClick={cancelForm} disabled={submitting}>
              취소
            </button>
            <button className="button primary admin-catalog-small-button" disabled={submitting || activeCategories.length === 0}>
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap admin-catalog-table-wrap">
        {loading ? (
          <div className="admin-catalog-empty">상품 유형을 불러오고 있습니다.</div>
        ) : sortedProductTypes.length === 0 ? (
          <div className="admin-catalog-empty">
            <strong>아직 등록된 상품 유형이 없습니다.</strong>
            <span>상단의 추가 버튼으로 새 상품 유형을 등록하세요.</span>
          </div>
        ) : (
          <table className="table admin-catalog-table admin-product-type-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>카테고리</th>
                <th>이름</th>
                <th>slug</th>
                <th>설명</th>
                <th>순서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedProductTypes.map((productType) => {
                const category = categories.find((item) => item.id === productType.categoryId);

                return (
                  <tr key={productType.id}>
                    <td className="admin-catalog-id-cell">{productType.id}</td>
                    <td className="admin-catalog-category-cell">
                      <strong>{productType.categoryName}</strong>
                      {category && !category.active && <span>숨김 카테고리</span>}
                    </td>
                    <td>
                      <strong>{productType.name}</strong>
                    </td>
                    <td className="admin-catalog-slug-cell">{productType.slug}</td>
                    <td className="catalog-description">{productType.description ?? "-"}</td>
                    <td>{productType.displayOrder}</td>
                    <td>
                      <span className={`catalog-status-badge ${productType.active ? "active" : "inactive"}`}>{activeLabel(productType.active)}</span>
                    </td>
                    <td>
                      <div className="admin-catalog-actions">
                        <button className="button admin-catalog-row-button" type="button" onClick={() => startEdit(productType)} disabled={submitting}>
                          수정
                        </button>
                        <button
                          className={productType.active ? "button danger admin-catalog-row-button" : "button admin-catalog-row-button"}
                          type="button"
                          onClick={() => toggleActive(productType)}
                          disabled={togglingId === productType.id}
                        >
                          {togglingId === productType.id ? "처리 중..." : productType.active ? "숨김" : "활성화"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
