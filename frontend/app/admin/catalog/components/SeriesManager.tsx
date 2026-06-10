"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Series } from "@/types/api";
import {
  activeLabel,
  buildBasicCatalogRequest,
  emptyBasicCatalogForm,
  formFromBasicCatalogItem,
  sortByDisplayOrder,
  type BasicCatalogForm,
  validateBasicCatalogForm
} from "./catalogForm";

type SeriesManagerProps = {
  onMessage: (message: string | null) => void;
};

export function SeriesManager({ onMessage }: SeriesManagerProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [form, setForm] = useState<BasicCatalogForm>(emptyBasicCatalogForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isEditMode = editingId !== null;
  const sortedSeries = sortByDisplayOrder(series);

  async function loadSeries() {
    setLoading(true);
    try {
      setSeries(await api.getAdminSeries());
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "시리즈 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeries();
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

  function startEdit(item: Series) {
    setForm(formFromBasicCatalogItem(item));
    setEditingId(item.id);
    setEditingName(item.name);
    setFormOpen(true);
    onMessage(null);
  }

  function cancelForm() {
    resetForm();
    setFormOpen(false);
    onMessage(isEditMode ? "시리즈 수정을 취소했습니다." : null);
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
        await api.updateAdminSeries(editingId, buildBasicCatalogRequest(form));
        onMessage("시리즈 수정을 저장했습니다.");
      } else {
        await api.createAdminSeries(buildBasicCatalogRequest(form));
        onMessage("시리즈를 생성했습니다.");
      }
      resetForm();
      setFormOpen(false);
      await loadSeries();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : isEditMode ? "시리즈 수정에 실패했습니다." : "시리즈 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: Series) {
    if (togglingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      item.active ? "이 시리즈를 숨김 처리할까요?\n숨김 처리해도 기존 상품의 참조는 유지됩니다." : "이 시리즈를 다시 활성화할까요?"
    );
    if (!confirmed) {
      return;
    }

    setTogglingId(item.id);
    onMessage(null);

    try {
      await api.updateAdminSeries(item.id, {
        ...buildBasicCatalogRequest(formFromBasicCatalogItem(item)),
        active: !item.active
      });
      onMessage(item.active ? "시리즈를 숨김 처리했습니다." : "시리즈를 활성화했습니다.");
      await loadSeries();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "시리즈 상태 변경에 실패했습니다.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="admin-catalog-panel" aria-label="시리즈 관리">
      <div className="admin-catalog-toolbar">
        <div>
          <h2>시리즈</h2>
          <p>상품군에서 재사용하는 시리즈를 관리합니다.</p>
        </div>
        <div className="admin-catalog-toolbar-actions">
          <span>{series.length}개</span>
          <button className="button admin-catalog-add-button" type="button" onClick={openCreateForm}>
            + 시리즈 추가
          </button>
        </div>
      </div>

      {formOpen && (
        <form className="admin-catalog-inline-form" onSubmit={submit}>
          <div className="admin-catalog-form-head">
            <div>
              <h3>{isEditMode ? "시리즈 수정" : "새 시리즈 추가"}</h3>
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
              <input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="scarlet-violet" />
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
          <div className="admin-catalog-empty">시리즈를 불러오고 있습니다.</div>
        ) : sortedSeries.length === 0 ? (
          <div className="admin-catalog-empty">
            <strong>아직 등록된 시리즈가 없습니다.</strong>
            <span>상단의 추가 버튼으로 새 시리즈를 등록하세요.</span>
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
              {sortedSeries.map((item) => (
                <tr key={item.id}>
                  <td className="admin-catalog-id-cell">{item.id}</td>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td className="admin-catalog-slug-cell">{item.slug}</td>
                  <td className="catalog-description">{item.description ?? "-"}</td>
                  <td>{item.displayOrder}</td>
                  <td>
                    <span className={`catalog-status-badge ${item.active ? "active" : "inactive"}`}>{activeLabel(item.active)}</span>
                  </td>
                  <td>
                    <div className="admin-catalog-actions">
                      <button className="button admin-catalog-row-button" type="button" onClick={() => startEdit(item)} disabled={submitting}>
                        수정
                      </button>
                      <button
                        className={item.active ? "button danger admin-catalog-row-button" : "button admin-catalog-row-button"}
                        type="button"
                        onClick={() => toggleActive(item)}
                        disabled={togglingId === item.id}
                      >
                        {togglingId === item.id ? "처리 중..." : item.active ? "숨김" : "활성화"}
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
