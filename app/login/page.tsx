'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
      <p>관리자 페이지로 이동 중...</p>
    </div>
  );
}