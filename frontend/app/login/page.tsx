"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";

const AUTH_EXPIRED_MESSAGE_KEY = "pkm_auth_expired_message";
const AUTH_EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요.";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedMessage = window.sessionStorage.getItem(AUTH_EXPIRED_MESSAGE_KEY);

    if (params.get("reason") === "expired") {
      setMessage(storedMessage ?? AUTH_EXPIRED_MESSAGE);
      window.sessionStorage.removeItem(AUTH_EXPIRED_MESSAGE_KEY);
      return;
    }

    if (storedMessage) {
      setMessage(storedMessage);
      window.sessionStorage.removeItem(AUTH_EXPIRED_MESSAGE_KEY);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.login({ email, password });
      router.push("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 실패");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-content" aria-label="로그인">
        <div className="auth-brand">
          <Link href="/" className="auth-logo">
            PKM Box Store
          </Link>
          <p>Card boxes for collectors.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>이메일</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="예: pkm@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="current-password"
            />
          </label>
          <button className="button primary auth-submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
          <Message message={message} />
        </form>

        <div className="auth-links" aria-label="회원 메뉴">
          <span>계정이 아직 없나요?</span>
          <Link href="/signup">회원가입</Link>
          <Link href="/password-reset">비밀번호 찾기</Link>
        </div>
      </section>
    </div>
  );
}
