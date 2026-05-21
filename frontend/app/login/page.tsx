"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
