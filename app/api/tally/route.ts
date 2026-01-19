import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// 1. Supabase 연결 설정 (제거됨)
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// 2. [치트키] Tally가 "보내도 돼?" 하고 물어볼 때(OPTIONS) "응!"이라고 답하는 함수
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: { 'Allow': 'POST' } });
}

// 3. 진짜 데이터를 받을 때(POST) 실행되는 함수
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🔥 Tally 데이터 도착함:", body); // 로그 확인용 이모지 추가

    // 구글 시트 마이그레이션으로 인해 Supabase 저장은 제거함
    // Tally -> Google Sheets 연동은 Tally 자체 통합 기능을 사용하시기 바랍니다.

    return NextResponse.json({ message: 'Success (Logged)' }, { status: 200 });

  } catch (error) {
    console.error("❌ 서버 에러:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// Vercel 연결 테스트용 주석