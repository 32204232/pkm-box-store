"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function sendCode() {
    if (sendingCode || !email.trim()) {
      return;
    }

    setSendingCode(true);
    setMessage(null);
    setVerificationToken("");
    try {
      await api.sendEmailVerification({ email, purpose: "PASSWORD_RESET" });
      setMessage("가입된 이메일이라면 인증번호가 발송됩니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "인증번호 발송 실패");
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCode() {
    if (verifyingCode || !email.trim() || !code.trim()) {
      return;
    }

    setVerifyingCode(true);
    setMessage(null);
    try {
      const response = await api.verifyEmailVerification({ email, purpose: "PASSWORD_RESET", code });
      setVerificationToken(response.verificationToken);
      setMessage("이메일 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.");
    } catch (error) {
      setVerificationToken("");
      setMessage(error instanceof Error ? error.message : "인증번호 확인 실패");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !verificationToken) {
      if (!verificationToken) {
        setMessage("이메일 인증을 완료해 주세요.");
      }
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.resetPassword({ email, verificationToken, newPassword });
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "비밀번호 재설정 실패");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-content" aria-label="비밀번호 재설정">
        <div className="auth-brand">
          <Link href="/" className="auth-logo">
            PKM Box Store
          </Link>
          <p>비밀번호 재설정</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>이메일</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setVerificationToken("");
              }}
              placeholder="예: pkm@example.com"
              autoComplete="email"
            />
          </label>
          <div className="auth-inline-action">
            <button type="button" className="button" onClick={sendCode} disabled={sendingCode || !email.trim()}>
              {sendingCode ? "발송 중..." : "인증번호 발송"}
            </button>
          </div>
          <label>
            <span>인증번호</span>
            <input
              className="auth-input"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setVerificationToken("");
              }}
              placeholder="6자리 인증번호"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={!email.trim()}
            />
          </label>
          <div className="auth-inline-action">
            <button
              type="button"
              className="button"
              onClick={verifyCode}
              disabled={verifyingCode || !email.trim() || !code.trim()}
            >
              {verifyingCode ? "확인 중..." : "인증 확인"}
            </button>
          </div>
          <label>
            <span>새 비밀번호</span>
            <input
              className="auth-input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="새 비밀번호를 입력해 주세요"
              autoComplete="new-password"
              disabled={!verificationToken}
            />
          </label>
          <button className="button primary auth-submit" disabled={submitting || !verificationToken}>
            {submitting ? "변경 중..." : "비밀번호 재설정"}
          </button>
          <Message message={message} />
        </form>

        <div className="auth-links" aria-label="회원 메뉴">
          <Link href="/login">로그인으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
