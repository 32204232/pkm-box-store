"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.signup({ email, password, name });
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입 실패");
    }
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>회원가입</h1>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          이름
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
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
        <button className="button primary">가입</button>
        <Message message={message} />
      </form>
    </div>
  );
}
