import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 연결 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. [치트키] Tally가 "보내도 돼?" 하고 물어볼 때(OPTIONS) "응!"이라고 답하는 함수
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: { 'Allow': 'POST' } });
}

// 3. 진짜 데이터를 받을 때(POST) 실행되는 함수
export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    console.log("🔥 Tally 데이터 도착함:", body); // 로그 확인용 이모지 추가

    // Supabase에 저장
    const { error } = await supabase
      .from('tally_raw')
      .insert([
        {
          form_id: body.data?.formId,
          submission_id: body.eventId,
          payload: body,
        },
      ]);

    if (error) {
      console.error("❌ 저장 실패:", error);
      return NextResponse.json({ message: 'Error', error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 });

  } catch (error) {
    console.error("❌ 서버 에러:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// Vercel 연결 테스트용 주석