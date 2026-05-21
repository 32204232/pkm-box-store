"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getCurrentRole, isLoggedIn, onAuthChanged } from "@/store/auth";
import type { MemberRole } from "@/types/api";

type RequireAuthProps = {
  children: ReactNode;
  requireRole?: MemberRole;
};

export function RequireAuth({ children, requireRole }: RequireAuthProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  function checkAuth() {
    const loggedIn = isLoggedIn();
    const role = getCurrentRole();

    if (!loggedIn) {
      setAllowed(false);
      setChecked(true);
      router.replace("/login");
      return;
    }

    if (requireRole && role !== requireRole) {
      setAllowed(false);
      setChecked(true);
      router.replace("/");
      return;
    }

    setAllowed(true);
    setChecked(true);
  }

  useEffect(() => {
    checkAuth();
    return onAuthChanged(checkAuth);
  }, [requireRole]);

  if (!checked) {
    return <div className="alert">인증 상태를 확인하고 있습니다.</div>;
  }

  if (!allowed) {
    return <div className="alert">접근 권한을 확인하고 있습니다.</div>;
  }

  return <>{children}</>;
}
