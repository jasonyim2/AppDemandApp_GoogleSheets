'use client';

import { useEffect, useState, use } from 'react';
// import { supabase } from '@/lib/supabase'; // Removed
import { useRouter } from 'next/navigation';

const GOOGLE_SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  // 발송 중인지 확인하는 상태 (로딩바용)
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!GOOGLE_SHEET_ID || !GOOGLE_API_KEY) {
        alert("Google Sheets 환경변수 설정이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Tally_raw!A:X?key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.values && json.values.length > 1) {
          // 데이터 매핑 (admin/page.tsx와 동일한 로직)
          const mappedData = json.values.slice(1).map((row: string[], index: number) => ({
            id: row[0] || `sheet-row-${index}`,
            created_at: row[1],
            respondent_name: row[2],
            respondent_email: row[3],
            respondent_phone: row[4],
            app_title: row[5],
            pain_point: row[6],
            solution_wish: row[7],
            automation_wish: row[8],
            it_knowledge: row[9],
            job_status: row[10],
            age_group: row[11],
            device_usage: row[12],
            extra_request: row[13],
            reference_url: row[14],
            contact_method: row[15],
            admin_reply_memo: row[16]
          }));

          // ID로 찾기
          const foundItem = mappedData.find((item: any) => item.id === id);

          if (foundItem) {
            setData(foundItem);
            setReplySubject(`[답변] ${foundItem.respondent_name}님의 앱 아이디어에 대한 피드백입니다.`);
          } else {
            console.error('ID not found');
          }
        }
      } catch (error) {
        console.error('에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ▼▼▼ [핵심] 이메일 발송 함수 (이제 진짜 작동합니다!) ▼▼▼
  const handleSendEmail = async () => {
    if (!confirm('정말로 이 내용을 고객님께 발송하시겠습니까?')) return;

    setIsSending(true); // 로딩 시작

    try {
      // 우리가 만든 우체국(API)으로 편지를 보냅니다.
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.respondent_email, // 받는 사람
          subject: replySubject,     // 제목
          text: replyBody,           // 본문
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('성공! 이메일이 고객에게 안전하게 발송되었습니다. 🚀\n(참고: 구글 시트에는 저장되지 않습니다.)');
      } else {
        alert('실패했습니다. 관리자에게 문의하세요.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSending(false); // 로딩 끝
    }
  };
  // ▲▲▲▲▲▲

  if (loading) return <div className="p-10">데이터를 불러오는 중...</div>;
  if (!data) return <div className="p-10">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50 text-black pb-20">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-500 hover:text-black flex items-center gap-2 font-bold"
        >
          ← 목록으로 돌아가기
        </button>

        <h1 className="text-3xl font-bold mb-8">📄상세 내용 보기</h1>

        {/* 신청자 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-blue-600">👤 신청자 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-gray-500 text-sm">성함</p><p className="font-bold text-lg">{data.respondent_name}</p></div>
            <div><p className="text-gray-500 text-sm">이메일</p><p className="font-bold text-lg">{data.respondent_email}</p></div>
            <div><p className="text-gray-500 text-sm">연락처</p><p className="text-gray-800">{data.respondent_phone || '-'}</p></div>
            <div><p className="text-gray-500 text-sm">직업/상태</p><p className="text-gray-800">{data.job_status}</p></div>
            <div><p className="text-gray-500 text-sm">IT 지식 수준</p><p className="text-gray-800">{data.it_knowledge}</p></div>
            <div><p className="text-gray-500 text-sm">연령대</p><p className="text-gray-800">{data.age_group}</p></div>
          </div>
        </div>

        {/* 아이디어 상세 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-green-600">💡 앱 아이디어 상세</h2>
          <div className="space-y-6">
            <div><p className="text-gray-500 text-sm mb-1">앱 제목</p><p className="text-xl font-bold">{data.app_title}</p></div>
            <div className="bg-gray-50 p-4 rounded"><p className="text-gray-500 text-sm mb-1">😩 겪고 있는 문제</p><p className="whitespace-pre-wrap">{data.pain_point}</p></div>
            <div className="bg-blue-50 p-4 rounded"><p className="text-gray-500 text-sm mb-1">🚀 원하는 해결책</p><p className="whitespace-pre-wrap">{data.solution_wish}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-gray-500 text-sm">자동화 희망</p><p className="text-gray-800">{data.automation_wish}</p></div>
              <div><p className="text-gray-500 text-sm">주 사용 기기</p><p className="text-gray-800">{data.device_usage}</p></div>
            </div>
            <div><p className="text-gray-500 text-sm">참고 URL</p><p className="text-blue-500 underline">{data.reference_url}</p></div>
          </div>
        </div>

        {/* 답장 보내기 섹션 */}
        <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg mt-12">
          <h2 className="text-2xl font-bold mb-6">✉️ 피드백 답장 보내기</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">받는 사람</label>
              <input type="text" value={data.respondent_email} disabled className="w-full p-3 rounded bg-gray-700 text-gray-300 border border-gray-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">메일 제목</label>
              <input type="text" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">내용</label>
              <textarea rows={6} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="컨설팅 내용을 작성하세요..." className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"></textarea>
            </div>

            {/* 버튼: 이제 handleSendEmail 함수가 연결되었습니다! */}
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className={`w-full font-bold py-4 rounded-lg transition text-lg ${isSending ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {isSending ? '전송 중입니다... ✈️' : '이메일 발송하기 🚀'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}