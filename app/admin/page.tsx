"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search, Users, Home, PlusCircle, MessageSquare, Lock, X, ChevronRight, Mail, ChevronLeft } from "lucide-react";

export default function AdminDashboard() {
  // 🔐 [보안] 로그인 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewDetailItem, setViewDetailItem] = useState<any>(null);

  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // 👥 [정렬/검색] 참가자 탭용
  const [viewParticipant, setViewParticipant] = useState<any>(null);

  // 📄 [페이지네이션] 탭별 현재 페이지
  const [homePage, setHomePage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [participantsPage, setParticipantsPage] = useState(1);

  // 🔍 [필터] 홈 및 피드백 탭용 필터 상태
  const [homeFilter, setHomeFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // 📏 [상수] 페이지당 항목 수
  const ITEMS_PER_PAGE_HOME = 10;
  const ITEMS_PER_PAGE_FEEDBACK = 5;
  const ITEMS_PER_PAGE_PARTICIPANTS = 10;

  // 📊 [구글 시트 데이터 가져오기]
  const fetchData = async () => {
    const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!SHEET_ID || !API_KEY) {
      alert("환경변수(ID/KEY)를 확인해 주세요.");
      return;
    }

    setLoading(true);
    try {
      // Tally_raw 시트의 A열부터 X열까지 읽어오기
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Tally_raw!A:X?key=${API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.values && json.values.length > 1) {
        const mappedData = json.values.slice(1).map((row: any, index: number) => ({
          id: row[0] || `row-${index}`,
          created_at: row[2] || "",         // C열: 제출일
          respondent_name: row[3] || "익명", // D열: 성함
          respondent_email: row[4] || "",   // E열: 이메일
          respondent_phone: row[5] || "",   // F열: 전화번호
          age_group: row[6] || "",          // G열: 연령대
          job_status: row[7] || "",         // H열: 직업
          it_knowledge: row[8] || "",       // I열: IT지식
          app_title: row[9] || "제목 없음",  // J열: 앱 제목
          pain_point: row[10] || "",        // K열: 불편사항
          solution_wish: row[11] || "",     // L열: 해결희망
          automation_wish: row[12] || "",   // M열: 자동화희망
          device_usage: row[13] || "",      // N열: 주사용기기
          extra_request: row[18] || "",     // S열: 추가요청
          reference_url: row[19] || "",     // T열: 레퍼런스
          contact_method: row[20] || "",    // U열: 회신방법
          admin_reply_memo: row[21] || null // V열: 답변내용
        }));
        
        setData(mappedData);
      }
    } catch (err) {
      console.error("GS Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "jasonyim123";
    if (passwordInput.trim() === adminPass) {
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  const handleSendEmail = async () => {
    if (!confirm("정말 이메일을 발송하시겠습니까?")) return;
    setIsSending(true);
    const targetItem = viewDetailItem || selectedItem;

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetItem.respondent_email,
          subject: replySubject,
          text: replyBody
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("성공! 이메일이 발송되었습니다.\n(참고: 시트에는 직접 기록해 주세요!)");
        setReplyBody("");
        setSelectedItem(null);
        setViewDetailItem(null);
      }
    } catch (err) {
      alert("오류 발생");
    } finally {
      setIsSending(false);
    }
  };

  // 📄 [컴포넌트] 공용 페이지네이션 컨트롤 (영주님의 기존 디자인)
  const PaginationControl = ({ currentPage, totalItems, itemsPerPage, onPageChange }: any) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 py-6 border-t border-gray-50">
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => onPageChange(page)} className={`w-9 h-9 rounded-lg text-sm font-bold transition ${currentPage === page ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
          ))}
        </div>
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 text-black">
          <div className="flex justify-center mb-6"><Lock className="w-12 h-12 text-gray-400" /></div>
          <h2 className="text-2xl font-semibold text-center mb-8 tracking-tight font-sans">관리자 접속</h2>
          <input
            type="password"
            placeholder="비밀번호"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans pb-32 text-black">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">앱 수요조사 Admin (GS)</h1>
        <button onClick={fetchData} className="p-2 bg-gray-100/50 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {/* 홈 탭 UI 로직 (영주님 원본 코드 유지) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">총 접수 건수</h3>
                <p className="text-3xl font-bold text-gray-900">{data.length}건</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">피드백 대기</h3>
                <p className="text-3xl font-bold text-orange-600">{data.filter(i => !i.admin_reply_memo).length}건</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">최근 접수</h3>
                <p className="text-2xl font-bold text-blue-600">{data.length > 0 ? data[0].created_at.split(' ')[0] : '-'}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl ml-1 text-gray-900">최근 현황</h3>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {data.slice((homePage - 1) * ITEMS_PER_PAGE_HOME, homePage * ITEMS_PER_PAGE_HOME).map((item) => (
                  <div key={item.id} onClick={() => setViewDetailItem(item)} className="p-5 flex justify-between items-center group cursor-pointer hover:bg-gray-50 border-b last:border-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-gray-900 truncate">{item.app_title || '제목 없음'}</p>
                      <p className="text-sm text-gray-500">{item.respondent_name} · {item.created_at}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                ))}
                <PaginationControl currentPage={homePage} totalItems={data.length} itemsPerPage={ITEMS_PER_PAGE_HOME} onPageChange={setHomePage} />
              </div>
            </div>
          </div>
        )}
        
        {/* 나머지 탭 및 모달 UI는 원본 디자인을 그대로 복사해서 유지해 주세요 */}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t pb-safe pt-2 px-6 flex justify-between items-center z-40 h-[84px]">
        {[
          { id: 'dashboard', icon: Home, label: '홈' },
          { id: 'feedback', icon: MessageSquare, label: '피드백' },
          { id: 'participants', icon: Users, label: '참가자' },
          { id: 'input', icon: PlusCircle, label: '등록' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedItem(null); setViewDetailItem(null); }} className={`flex flex-col items-center justify-center gap-1.5 w-1/4 h-full ${activeTab === tab.id ? 'text-black' : 'text-gray-400'}`}>
            <tab.icon className="w-6 h-6" />
            <span className="text-[11px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* 상세보기 모달은 영주님께서 올려주신 기존 코드의 모달 부분을 그대로 가져와 하단에 붙여주시면 됩니다. */}
    </div>
  );
}