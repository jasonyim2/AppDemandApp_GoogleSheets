import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 문을 엽니다 (환경변수 키 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. Tally에서 신호(POST)가 오면 이 함수가 실행됩니다.
export async function POST(request: Request) {
  try {
    const body = await request.json(); // Tally가 보낸 내용을 뜯어봅니다.

    console.log("Tally 데이터 수신:", body);

    // 3. Supabase의 'tally_raw' 테이블에 데이터를 집어넣습니다.
    const { error } = await supabase
      .from('tally_raw')
      .insert([
        {
          form_id: body.data?.formId,      // 설문지 ID
          submission_id: body.eventId,     // 제출 ID
          payload: body,                   // ★ 핵심: 설문 원본 통째로 저장!
        },
      ]);

    if (error) {
      console.error("저장 실패:", error);
      return NextResponse.json({ message: 'Error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}