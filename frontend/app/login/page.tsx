"use client";

import { FormEvent, useEffect, useState } from "react";
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
    <div className="stack">
      <div className="section-header">
        <h1>로그인</h1>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          이메일
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          비밀번호
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button primary" disabled={submitting}>
          로그인
        </button>
        <Message message={message} />
      </form>
    </div>
  );
}
