"use client";

import { FormEvent, useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatDateTime } from "@/lib/api";
import type { DeliveryAddress, DeliveryAddressRequest } from "@/types/api";

const emptyForm: DeliveryAddressRequest = {
  label: "",
  receiverName: "",
  receiverPhone: "",
  zipCode: "",
  address1: "",
  address2: ""
};

export default function MyAddressesPage() {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [form, setForm] = useState<DeliveryAddressRequest>(emptyForm);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [defaultingId, setDefaultingId] = useState<number | null>(null);

  const isEditMode = editingAddressId !== null;

  async function loadAddresses() {
    try {
      setAddresses(await api.deliveryAddresses());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "배송지 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingAddressId(null);
  }

  function startEdit(address: DeliveryAddress) {
    setMessage(null);
    setEditingAddressId(address.id);
    setForm({
      label: address.label ?? "",
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      zipCode: address.zipCode,
      address1: address.address1,
      address2: address.address2 ?? ""
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage(null);
    const body: DeliveryAddressRequest = {
      ...form,
      label: form.label || null,
      address2: form.address2 || null
    };

    try {
      if (editingAddressId !== null) {
        await api.updateDeliveryAddress(editingAddressId, body);
        setMessage("배송지를 수정했습니다.");
      } else {
        await api.createDeliveryAddress(body);
        setMessage("배송지를 추가했습니다.");
      }
      resetForm();
      await loadAddresses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEditMode ? "배송지 수정 실패" : "배송지 추가 실패");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(addressId: number) {
    if (deletingId !== null) {
      return;
    }

    setDeletingId(addressId);
    setMessage(null);
    try {
      await api.deleteDeliveryAddress(addressId);
      if (editingAddressId === addressId) {
        resetForm();
      }
      setMessage("배송지를 삭제했습니다.");
      await loadAddresses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "배송지 삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  async function setDefaultAddress(addressId: number) {
    if (defaultingId !== null) {
      return;
    }

    setDefaultingId(addressId);
    setMessage(null);
    try {
      await api.setDefaultDeliveryAddress(addressId);
      setMessage("기본 배송지를 변경했습니다.");
      await loadAddresses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "기본 배송지 설정 실패");
    } finally {
      setDefaultingId(null);
    }
  }

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>배송지 관리</h1>
            <p>주문에 사용할 배송지를 저장하고 기본 배송지를 설정합니다.</p>
          </div>
        </div>

        <Message message={message} />

        <div className="split">
          <div className="stack">
            {loading ? (
              <div className="alert">배송지 목록을 불러오고 있습니다.</div>
            ) : addresses.length === 0 ? (
              <div className="alert">저장된 배송지가 없습니다.</div>
            ) : (
              addresses.map((address) => (
                <article className="card" key={address.id}>
                  <div className="card-body stack">
                    <div className="row">
                      <strong>{address.label || "배송지"}</strong>
                      {address.isDefault && <span className="badge">기본 배송지</span>}
                    </div>
                    <div>
                      <strong>{address.receiverName}</strong>
                      <br />
                      <span className="muted">{address.receiverPhone}</span>
                    </div>
                    <div>
                      <span>
                        [{address.zipCode}] {address.address1}
                      </span>
                      {address.address2 && (
                        <>
                          <br />
                          <span>{address.address2}</span>
                        </>
                      )}
                    </div>
                    <div className="muted">수정: {formatDateTime(address.updatedAt)}</div>
                    <div className="action-group">
                      <button className="button" type="button" onClick={() => startEdit(address)} disabled={saving}>
                        수정
                      </button>
                      <button
                        className="button"
                        type="button"
                        onClick={() => setDefaultAddress(address.id)}
                        disabled={address.isDefault || defaultingId === address.id}
                      >
                        기본 설정
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => deleteAddress(address.id)}
                        disabled={deletingId === address.id}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <form className="card" onSubmit={submit}>
            <div className="card-body form">
              <div className="row">
                <strong>{isEditMode ? "배송지 수정" : "배송지 추가"}</strong>
                {isEditMode && (
                  <button className="button" type="button" onClick={resetForm} disabled={saving}>
                    취소
                  </button>
                )}
              </div>
              <label>
                배송지명
                <input className="input" value={form.label ?? ""} onChange={(event) => setForm({ ...form, label: event.target.value })} />
              </label>
              <label>
                수령인
                <input
                  className="input"
                  value={form.receiverName}
                  onChange={(event) => setForm({ ...form, receiverName: event.target.value })}
                />
              </label>
              <label>
                연락처
                <input
                  className="input"
                  value={form.receiverPhone}
                  onChange={(event) => setForm({ ...form, receiverPhone: event.target.value })}
                />
              </label>
              <label>
                우편번호
                <input className="input" value={form.zipCode} onChange={(event) => setForm({ ...form, zipCode: event.target.value })} />
              </label>
              <label>
                주소
                <input className="input" value={form.address1} onChange={(event) => setForm({ ...form, address1: event.target.value })} />
              </label>
              <label>
                상세주소
                <input
                  className="input"
                  value={form.address2 ?? ""}
                  onChange={(event) => setForm({ ...form, address2: event.target.value })}
                />
              </label>
              <button className="button primary" disabled={saving}>
                {isEditMode ? "수정 저장" : "배송지 추가"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RequireAuth>
  );
}
