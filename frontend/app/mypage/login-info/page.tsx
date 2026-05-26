"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";
import { getCurrentEmail } from "@/store/auth";
import type { MemberResponse } from "@/types/api";

export default function MypageLoginInfoPage() {
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    api
      .me()
      .then(setMember)
      .catch((error) => setMessage(error instanceof Error ? error.message : "회원 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordModalOpen(false);
      setMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "비밀번호 변경 실패");
    } finally {
      setSubmitting(false);
    }
  }

  function closePasswordModal() {
    if (submitting) {
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalOpen(false);
  }

  return (
    <div className="mypage-section">
      <div className="mypage-page-head">
        <div>
          <h1>로그인 정보</h1>
          <p>이메일 주소와 비밀번호를 관리합니다.</p>
        </div>
      </div>
      <Message message={message} />

      <section className="mypage-card">
        <div className="mypage-info-row">
          <div>
            <span>이메일 주소</span>
            <strong>{loading ? "불러오는 중..." : member?.email ?? getCurrentEmail() ?? "-"}</strong>
          </div>
          <button className="button" type="button" disabled>
            변경 불가
          </button>
        </div>
        <div className="mypage-info-row">
          <div>
            <span>비밀번호</span>
            <strong>••••••••••</strong>
          </div>
          <button className="button" type="button" onClick={() => setPasswordModalOpen(true)}>
            변경
          </button>
        </div>
      </section>

      {passwordModalOpen && (
        <div className="mypage-modal-overlay" role="presentation" onMouseDown={closePasswordModal}>
          <form className="mypage-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
            <div className="mypage-modal-head">
              <strong>비밀번호 변경</strong>
              <button type="button" onClick={closePasswordModal} disabled={submitting} aria-label="닫기">
                닫기
              </button>
            </div>
            <label>
              현재 비밀번호
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              새 비밀번호
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="button primary mypage-modal-submit" disabled={submitting}>
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
