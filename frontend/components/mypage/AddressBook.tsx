"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { DeliveryAddress, DeliveryAddressRequest } from "@/types/api";

const DAUM_POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type DaumPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void; onclose?: () => void }) => {
        open: () => void;
      };
    };
  }
}

const emptyForm: DeliveryAddressRequest = {
  label: "",
  receiverName: "",
  receiverPhone: "",
  zipCode: "",
  address1: "",
  address2: "",
  isDefault: false
};

function formatAddress(address: DeliveryAddress) {
  return `[${address.zipCode}] ${address.address1} ${address.address2 ?? ""}`.trim();
}

function loadDaumPostcodeScript() {
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${DAUM_POSTCODE_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("우편번호 스크립트를 불러오지 못했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = DAUM_POSTCODE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("우편번호 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

export function AddressBook() {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [form, setForm] = useState<DeliveryAddressRequest>(emptyForm);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [defaultingId, setDefaultingId] = useState<number | null>(null);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isEditMode = editingAddressId !== null;
  const defaultAddress = addresses.find((address) => address.isDefault) ?? null;
  const savedAddresses = addresses.filter((address) => !address.isDefault);

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

  function closeModal() {
    if (saving) {
      return;
    }
    resetForm();
    setModalOpen(false);
  }

  function startCreate() {
    setMessage(null);
    setForm(emptyForm);
    setEditingAddressId(null);
    setModalOpen(true);
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
      address2: address.address2 ?? "",
      isDefault: address.isDefault
    });
    setModalOpen(true);
  }

  async function openPostcodeSearch() {
    setPostcodeLoading(true);
    setMessage(null);
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) {
        throw new Error("우편번호 검색을 열 수 없습니다.");
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          setForm((current) => ({
            ...current,
            zipCode: data.zonecode,
            address1: data.roadAddress || data.jibunAddress || data.address
          }));
        }
      }).open();
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} 직접 입력을 사용해 주세요.` : "우편번호 검색 실패. 직접 입력을 사용해 주세요.");
    } finally {
      setPostcodeLoading(false);
    }
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
      address2: form.address2 || null,
      isDefault: Boolean(form.isDefault)
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
      setModalOpen(false);
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
        setModalOpen(false);
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
    <div className="mypage-section">
      <div className="mypage-page-head">
        <div>
          <h1>주소록</h1>
          <p>주문에 사용할 배송지를 저장하고 기본 배송지를 설정합니다.</p>
        </div>
        <button className="button mypage-outline-button" type="button" onClick={startCreate}>
          + 새 주소 추가하기
        </button>
      </div>
      <Message message={message} />

      {loading ? (
        <div className="alert">배송지 목록을 불러오고 있습니다.</div>
      ) : (
        <section className="mypage-address-list" aria-label="저장된 배송지">
          <div className="mypage-address-group">
            <h2>기본 배송지</h2>
            {defaultAddress ? (
              <AddressCard
                address={defaultAddress}
                defaultingId={defaultingId}
                deletingId={deletingId}
                saving={saving}
                onDelete={deleteAddress}
                onEdit={startEdit}
                onSetDefault={setDefaultAddress}
              />
            ) : (
              <div className="mypage-empty">기본 배송지가 없습니다.</div>
            )}
          </div>

          <div className="mypage-address-group">
            <h2>저장된 주소</h2>
            {savedAddresses.length === 0 ? (
              <div className="mypage-empty">저장된 추가 주소가 없습니다.</div>
            ) : (
              savedAddresses.map((address) => (
                <AddressCard
                  address={address}
                  defaultingId={defaultingId}
                  deletingId={deletingId}
                  key={address.id}
                  saving={saving}
                  onDelete={deleteAddress}
                  onEdit={startEdit}
                  onSetDefault={setDefaultAddress}
                />
              ))
            )}
          </div>
        </section>
      )}

      {modalOpen && (
        <div className="mypage-modal-overlay" role="presentation" onMouseDown={closeModal}>
          <form className="mypage-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
            <div className="mypage-modal-head">
              <strong>{isEditMode ? "배송지 수정" : "새 주소 추가"}</strong>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="닫기">
                닫기
              </button>
            </div>
            <label>
              배송지명
              <input className="input" value={form.label ?? ""} onChange={(event) => setForm({ ...form, label: event.target.value })} />
            </label>
            <label>
              수령인
              <input className="input" value={form.receiverName} onChange={(event) => setForm({ ...form, receiverName: event.target.value })} required />
            </label>
            <label>
              연락처
              <input className="input" value={form.receiverPhone} onChange={(event) => setForm({ ...form, receiverPhone: event.target.value })} required />
            </label>
            <label>
              우편번호
              <div className="postcode-row">
                <input className="input" value={form.zipCode} onChange={(event) => setForm({ ...form, zipCode: event.target.value })} required />
                <button type="button" onClick={openPostcodeSearch} disabled={postcodeLoading}>
                  {postcodeLoading ? "검색 중" : "우편번호"}
                </button>
              </div>
            </label>
            <label>
              주소
              <input className="input" value={form.address1} onChange={(event) => setForm({ ...form, address1: event.target.value })} required />
            </label>
            <label>
              상세주소
              <input className="input" value={form.address2 ?? ""} onChange={(event) => setForm({ ...form, address2: event.target.value })} />
            </label>
            <label className="check-row">
              <input checked={Boolean(form.isDefault)} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} type="checkbox" />
              기본 배송지로 설정
            </label>
            <button className="button primary mypage-modal-submit" disabled={saving}>
              {saving ? "저장 중..." : isEditMode ? "수정 저장" : "배송지 추가"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

type AddressCardProps = {
  address: DeliveryAddress;
  defaultingId: number | null;
  deletingId: number | null;
  saving: boolean;
  onDelete: (addressId: number) => void;
  onEdit: (address: DeliveryAddress) => void;
  onSetDefault: (addressId: number) => void;
};

function AddressCard({ address, defaultingId, deletingId, saving, onDelete, onEdit, onSetDefault }: AddressCardProps) {
  return (
    <article className={address.isDefault ? "mypage-address-card is-default" : "mypage-address-card"}>
      <div>
        <div className="mypage-address-title">
          <strong>{address.receiverName}</strong>
          {address.isDefault && <span>기본 배송지</span>}
          {address.label && <small>{address.label}</small>}
        </div>
        <p>{address.receiverPhone}</p>
        <p>{formatAddress(address)}</p>
      </div>
      <div className="mypage-address-actions">
        {!address.isDefault && (
          <button className="button" type="button" onClick={() => onSetDefault(address.id)} disabled={defaultingId === address.id}>
            기본 배송지
          </button>
        )}
        <button className="button" type="button" onClick={() => onEdit(address)} disabled={saving}>
          수정
        </button>
        <button className="button danger" type="button" onClick={() => onDelete(address.id)} disabled={deletingId === address.id}>
          삭제
        </button>
      </div>
    </article>
  );
}
