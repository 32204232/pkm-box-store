"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/types/api";
import {
  activeLabel,
  buildBasicCatalogRequest,
  emptyBasicCatalogForm,
  formFromBasicCatalogItem,
  sortByDisplayOrder,
  type BasicCatalogForm,
  validateBasicCatalogForm
} from "./catalogForm";

type CategoryManagerProps = {
  onMessage: (message: string | null) => void;
};

export function CategoryManager({ onMessage }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<BasicCatalogForm>(emptyBasicCatalogForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isEditMode = editingId !== null;
  const sortedCategories = sortByDisplayOrder(categories);

  async function loadCategories() {
    setLoading(true);
    try {
      setCategories(await api.getAdminCategories());
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "카테고리 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setForm(emptyBasicCatalogForm);
    setEditingId(null);
    setEditingName("");
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
    onMessage(null);
  }

  function startEdit(category: Category) {
    setForm(formFromBasicCatalogItem(category));
    setEditingId(category.id);
    setEditingName(category.name);
    setFormOpen(true);
    onMessage(null);
  }

  function cancelForm() {
    resetForm();
    setFormOpen(false);
    onMessage(isEditMode ? "카테고리 수정을 취소했습니다." : null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const validationMessage = validateBasicCatalogForm(form);
    if (validationMessage) {
      onMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    onMessage(null);

    try {
      if (editingId !== null) {
        await api.updateAdminCategory(editingId, buildBasicCatalogRequest(form));
        onMessage("카테고리 수정을 저장했습니다.");
      } else {
        await api.createAdminCategory(buildBasicCatalogRequest(form));
        onMessage("카테고리를 생성했습니다.");
      }
      resetForm();
      setFormOpen(false);
      await loadCategories();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : isEditMode ? "카테고리 수정에 실패했습니다." : "카테고리 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(category: Category) {
    if (togglingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      category.active
        ? "이 카테고리를 숨김 처리할까요?\n숨김 처리해도 기존 상품의 참조는 유지됩니다."
        : "이 카테고리를 다시 활성화할까요?"
    );
    if (!confirmed) {
      return;
    }

    setTogglingId(category.id);
    onMessage(null);

    try {
      await api.updateAdminCategory(category.id, {
        ...buildBasicCatalogRequest(formFromBasicCatalogItem(category)),
        active: !category.active
      });
      onMessage(category.active ? "카테고리를 숨김 처리했습니다." : "카테고리를 활성화했습니다.");
      await loadCategories();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "카테고리 상태 변경에 실패했습니다.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="admin-catalog-panel" aria-label="카테고리 관리">
      <div className="admin-catalog-toolbar">
        <div>
          <h2>카테고리</h2>
          <p>상품의 큰 분류를 관리합니다.</p>
        </div>
        <div className="admin-catalog-toolbar-actions">
          <span>{categories.length}개</span>
          <button className="button admin-catalog-add-button" type="button" onClick={openCreateForm}>
            + 카테고리 추가
          </button>
        </div>
      </div>

      {formOpen && (
        <form className="admin-catalog-inline-form" onSubmit={submit}>
          <div className="admin-catalog-form-head">
            <div>
              <h3>{isEditMode ? "카테고리 수정" : "새 카테고리 추가"}</h3>
              <p>{isEditMode ? `수정 중: ${editingName}` : "slug는 소문자 영문, 숫자, hyphen(-) 조합을 사용합니다."}</p>
            </div>
          </div>
          <div className="admin-catalog-form-grid">
            <label>
              이름
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              slug
              <input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="booster-box" />
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
          <div className="admin-catalog-form-actions">
            <button className="button admin-catalog-small-button" type="button" onClick={cancelForm} disabled={submitting}>
              취소
            </button>
            <button className="button primary admin-catalog-small-button" disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap admin-catalog-table-wrap">
        {loading ? (
          <div className="admin-catalog-empty">카테고리를 불러오고 있습니다.</div>
        ) : sortedCategories.length === 0 ? (
          <div className="admin-catalog-empty">
            <strong>아직 등록된 카테고리가 없습니다.</strong>
            <span>상단의 추가 버튼으로 새 카테고리를 등록하세요.</span>
          </div>
        ) : (
          <table className="table admin-catalog-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>slug</th>
                <th>설명</th>
                <th>순서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category) => (
                <tr key={category.id}>
                  <td className="admin-catalog-id-cell">{category.id}</td>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td className="admin-catalog-slug-cell">{category.slug}</td>
                  <td className="catalog-description">{category.description ?? "-"}</td>
                  <td>{category.displayOrder}</td>
                  <td>
                    <span className={`catalog-status-badge ${category.active ? "active" : "inactive"}`}>{activeLabel(category.active)}</span>
                  </td>
                  <td>
                    <div className="admin-catalog-actions">
                      <button className="button admin-catalog-row-button" type="button" onClick={() => startEdit(category)} disabled={submitting}>
                        수정
                      </button>
                      <button
                        className={category.active ? "button danger admin-catalog-row-button" : "button admin-catalog-row-button"}
                        type="button"
                        onClick={() => toggleActive(category)}
                        disabled={togglingId === category.id}
                      >
                        {togglingId === category.id ? "처리 중..." : category.active ? "숨김" : "활성화"}
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
  );
}
