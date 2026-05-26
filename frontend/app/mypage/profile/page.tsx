"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import type { MemberResponse } from "@/types/api";

type ProfileForm = {
  name: string;
  profileImageUrl: string;
  bio: string;
};

type ProfileField = "profileImageUrl" | "name" | "bio";

const emptyForm: ProfileForm = {
  name: "",
  profileImageUrl: "",
  bio: ""
};

export default function MypageProfilePage() {
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<ProfileField | null>(null);

  useEffect(() => {
    api
      .me()
      .then((response) => {
        setMember(response);
        setForm({
          name: response.name,
          profileImageUrl: response.profileImageUrl ?? "",
          bio: response.bio ?? ""
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "프로필 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await api.updateMyProfile({
        name: form.name,
        profileImageUrl: form.profileImageUrl || null,
        bio: form.bio || null
      });
      setMember(response);
      setForm({
        name: response.name,
        profileImageUrl: response.profileImageUrl ?? "",
        bio: response.bio ?? ""
      });
      setEditingField(null);
      setMessage("프로필을 수정했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필 수정 실패");
    } finally {
      setSaving(false);
    }
  }

  function openEditor(field: ProfileField) {
    if (member) {
      setForm({
        name: member.name,
        profileImageUrl: member.profileImageUrl ?? "",
        bio: member.bio ?? ""
      });
    }
    setMessage(null);
    setEditingField(field);
  }

  function closeEditor() {
    if (saving) {
      return;
    }
    if (member) {
      setForm({
        name: member.name,
        profileImageUrl: member.profileImageUrl ?? "",
        bio: member.bio ?? ""
      });
    }
    setEditingField(null);
  }

  async function removeProfileImage() {
    if (!member || saving) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.updateMyProfile({
        name: member.name,
        profileImageUrl: null,
        bio: member.bio
      });
      setMember(response);
      setForm({
        name: response.name,
        profileImageUrl: response.profileImageUrl ?? "",
        bio: response.bio ?? ""
      });
      setMessage("프로필 이미지를 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필 이미지 삭제 실패");
    } finally {
      setSaving(false);
    }
  }

  const modalTitle =
    editingField === "profileImageUrl" ? "프로필 이미지 변경" : editingField === "name" ? "이름 변경" : editingField === "bio" ? "소개 변경" : "";

  return (
    <div className="mypage-section">
      <div className="mypage-page-head">
        <div>
          <h1>프로필 관리</h1>
          <p>마이페이지에 표시할 이름과 소개를 관리합니다.</p>
        </div>
      </div>
      <Message message={message} />

      <section className="mypage-profile-card mypage-profile-edit-card">
        <div className="mypage-avatar">
          {form.profileImageUrl ? <img src={form.profileImageUrl} alt="" /> : <span>{(form.name || member?.email || "P").slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <strong>{loading ? "불러오는 중..." : form.name || "PKM 회원"}</strong>
          <p>{member?.email ?? "-"}</p>
          <div className="mypage-profile-inline-actions">
            <button className="button" type="button" onClick={() => openEditor("profileImageUrl")} disabled={loading}>
              이미지 변경
            </button>
            <button className="button" type="button" onClick={removeProfileImage} disabled={loading || saving || !member?.profileImageUrl}>
              삭제
            </button>
          </div>
        </div>
      </section>

      <section className="mypage-card">
        <div className="mypage-card-head">
          <div>
            <span>PROFILE</span>
            <h2>프로필 정보</h2>
          </div>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>프로필 이름</span>
            <strong>{member?.name ?? "-"}</strong>
          </div>
          <button className="button" type="button" onClick={() => openEditor("name")} disabled={loading}>
            변경
          </button>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>이름</span>
            <strong>{member?.name ?? "-"}</strong>
          </div>
          <button className="button" type="button" onClick={() => openEditor("name")} disabled={loading}>
            변경
          </button>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>소개</span>
            <strong>{member?.bio || "나를 소개하세요"}</strong>
          </div>
          <button className="button" type="button" onClick={() => openEditor("bio")} disabled={loading}>
            변경
          </button>
        </div>
      </section>

      <section className="mypage-card">
        <div className="mypage-card-head">
          <div>
            <span>BLOCK</span>
            <h2>프로필 차단/해제</h2>
          </div>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>차단한 프로필</span>
            <strong>관리할 차단 프로필이 없습니다.</strong>
          </div>
        </div>
      </section>

      <section className="mypage-card">
        <div className="mypage-card-head">
          <div>
            <span>VISIBILITY</span>
            <h2>프로필 공개 범위</h2>
          </div>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>관심 브랜드에서 숨기기</span>
            <strong>지원 예정 기능입니다.</strong>
          </div>
          <button className="mypage-switch" type="button" disabled aria-label="관심 브랜드에서 숨기기">
            <span />
          </button>
        </div>
      </section>

      {editingField && (
        <div className="mypage-modal-overlay" role="presentation" onMouseDown={closeEditor}>
          <form className="mypage-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
            <div className="mypage-modal-head">
              <strong>{modalTitle}</strong>
              <button type="button" onClick={closeEditor} disabled={saving} aria-label="닫기">
                닫기
              </button>
            </div>
            {editingField === "profileImageUrl" && (
              <label>
                프로필 이미지 URL
                <input
                  className="input"
                  value={form.profileImageUrl}
                  onChange={(event) => setForm({ ...form, profileImageUrl: event.target.value })}
                  maxLength={500}
                  placeholder="https://..."
                />
              </label>
            )}
            {editingField === "name" && (
              <label>
                이름
                <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required />
              </label>
            )}
            {editingField === "bio" && (
              <label>
                소개
                <textarea
                  className="textarea"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  maxLength={300}
                  placeholder="나를 소개하세요"
                />
              </label>
            )}
            <button className="button primary mypage-modal-submit" disabled={saving || loading}>
              {saving ? "저장 중..." : "변경 저장"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
