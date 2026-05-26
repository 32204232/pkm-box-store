import { MypageLayout } from "@/components/mypage/MypageLayout";
import { RequireAuth } from "@/components/RequireAuth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MypageLayout>{children}</MypageLayout>
    </RequireAuth>
  );
}
