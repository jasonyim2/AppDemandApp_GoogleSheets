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

        {/* 2️⃣ 피드백 관리 탭 */}
        {activeTab === 'feedback' && (
          <div className="animate-fade-in">
            {!selectedItem ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6 ml-1">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📩 피드백 & 답변</h2>
                  <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    <button onClick={() => { setFeedbackFilter('all'); setFeedbackPage(1); }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${feedbackFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>전체</button>
                    <button onClick={() => { setFeedbackFilter('completed'); setFeedbackPage(1); }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${feedbackFilter === 'completed' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>완료</button>
                    <button onClick={() => { setFeedbackFilter('pending'); setFeedbackPage(1); }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${feedbackFilter === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>대기</button>
                  </div>
                </div>

                {(() => {
                  const filteredFeedback = data.filter(item => {
                    if (feedbackFilter === 'completed') return item.admin_reply_memo;
                    if (feedbackFilter === 'pending') return !item.admin_reply_memo;
                    return true;
                  });
                  const paginatedFeedback = filteredFeedback.slice((feedbackPage - 1) * ITEMS_PER_PAGE_FEEDBACK, feedbackPage * ITEMS_PER_PAGE_FEEDBACK);

                  return (
                    <>
                      {paginatedFeedback.map(item => (
                        <div key={item.id} onClick={() => { setSelectedItem(item); setReplySubject(`[답변] ${item.app_title} 관련 피드백입니다.`); }}
                          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition group mb-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{item.app_title || '제목 없음'}</h3>
                            <span className="text-xs text-gray-400 font-sans">{item.created_at}</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-4">{item.respondent_name} ({item.respondent_email})</p>
                          {item.admin_reply_memo ? (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100 flex items-start gap-2 font-sans">
                              <span className="mt-0.5">✅</span><span className="line-clamp-2">{item.admin_reply_memo}</span>
                            </div>
                          ) : (
                            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg text-sm border border-orange-100 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>아직 답변 전입니다.
                            </div>
                          )}
                        </div>
                      ))}
                      <PaginationControl currentPage={feedbackPage} totalItems={filteredFeedback.length} itemsPerPage={ITEMS_PER_PAGE_FEEDBACK} onPageChange={setFeedbackPage} />
                    </>
                  );
                })()}
              </div>
            ) : (
              // 피드백 상세 보기 화면
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <button onClick={() => setSelectedItem(null)} className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium">← 목록으로 돌아가기</button>

                {/* 1. 기본 정보 */}
                <section className="mb-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">참가자 정보</h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <span className="block text-gray-500 mb-1">이름</span>
                      <span className="font-medium text-gray-900">{selectedItem.respondent_name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">나이대</span>
                      <span className="font-medium text-gray-900">{selectedItem.age_group || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">이메일</span>
                      <span className="font-medium text-gray-900">{selectedItem.respondent_email || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">연락처</span>
                      <span className="font-medium text-gray-900">{selectedItem.respondent_phone || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">IT 지식 수준</span>
                      <span className="font-medium text-gray-900">{selectedItem.it_knowledge || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">직업 상태</span>
                      <span className="font-medium text-gray-900">{selectedItem.job_status || '-'}</span>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 mb-8"></div>

                {/* 2. 앱 아이디어 */}
                <section className="mb-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">앱 아이디어 상세</h4>
                  <div className="space-y-6">
                    <div>
                      <span className="block text-gray-500 mb-2 font-medium">불편한 점 (Pain Point)</span>
                      <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedItem.pain_point || '-'}
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-2 font-medium">원하는 솔루션</span>
                      <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedItem.solution_wish || '-'}
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-2 font-medium">자동화 희망 부분</span>
                      <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedItem.automation_wish || '-'}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 mb-8"></div>

                {/* 3. 기타 정보 */}
                <section className="mb-8">
                  <div className="grid grid-cols-1 gap-y-4 text-sm">
                    <div>
                      <span className="block text-gray-500 mb-1">주 사용 기기</span>
                      <span className="font-medium text-gray-900">{selectedItem.device_usage || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">추가 요청사항</span>
                      <span className="text-gray-900">{selectedItem.extra_request || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">레퍼런스 URL</span>
                      {selectedItem.reference_url ? (
                        <a href={selectedItem.reference_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                          {selectedItem.reference_url}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">선호하는 연락 방법</span>
                      <span className="font-medium text-gray-900">{selectedItem.contact_method || '-'}</span>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 mb-8"></div>

                {/* 4. 피드백 / 답변 */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">관리자 피드백</h4>
                  {selectedItem.admin_reply_memo && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6">
                      <span className="block text-green-700 font-bold text-xs uppercase mb-2">✅ 답변 완료됨</span>
                      <div className="text-sm text-green-900 whitespace-pre-wrap">
                        {selectedItem.admin_reply_memo}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span className="font-bold text-gray-700">답변 메일 보내기</span>
                    </div>
                    <div className="space-y-3">
                      <input type="text" value={selectedItem.respondent_email || ''} disabled className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-500 text-sm" />
                      <input type="text" value={replySubject} onChange={e => setReplySubject(e.target.value)} placeholder="제목을 입력하세요" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      <textarea rows={5} value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="답변 내용을 작성하세요..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      <button onClick={handleSendEmail} disabled={isSending} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm">
                        {isSending ? '전송 중...' : '발송 및 완료 처리 🚀'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* 3️⃣ 참가자 목록 탭 */}
        {activeTab === 'participants' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 ml-1 flex items-center gap-2">👥 참가자 목록</h2>
            <div className="flex items-center bg-gray-100 p-3 rounded-xl mb-6 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input type="text" placeholder="이름, 이메일 검색..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setParticipantsPage(1); }} className="bg-transparent outline-none w-full text-gray-900 font-sans" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left font-sans">
                <thead className="bg-[#FAFAFA] text-gray-500 font-medium border-b">
                  <tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">연락처</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-black">
                  {(() => {
                    const filteredUsers = data.filter(i =>
                      i.respondent_name?.includes(searchTerm) ||
                      i.respondent_email?.includes(searchTerm)
                    );
                    const paginatedUsers = filteredUsers.slice((participantsPage - 1) * ITEMS_PER_PAGE_PARTICIPANTS, participantsPage * ITEMS_PER_PAGE_PARTICIPANTS);

                    return (
                      <>
                        {paginatedUsers.map(item => (
                          <tr key={item.id} onClick={() => setViewParticipant(item)} className="hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-0">
                            <td className="p-4 font-bold text-gray-800">{item.respondent_name}</td>
                            <td className="p-4 text-gray-600">{item.respondent_email}</td>
                            <td className="p-4 text-gray-500">{item.respondent_phone || '-'}</td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={3} className="p-10 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
              {(() => {
                const filteredUsers = data.filter(i => i.respondent_name?.includes(searchTerm) || i.respondent_email?.includes(searchTerm));
                return <PaginationControl currentPage={participantsPage} totalItems={filteredUsers.length} itemsPerPage={ITEMS_PER_PAGE_PARTICIPANTS} onPageChange={setParticipantsPage} />;
              })()}
            </div>
          </div>
        )}

        {/* 4️⃣ 등록 (Tally) */}
        {activeTab === 'input' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center py-24 animate-fade-in text-black">
            <h2 className="text-2xl font-bold mb-4 font-sans">📝 설문 등록 페이지</h2>
            <p className="text-gray-500 mb-8 px-10 font-sans leading-relaxed">새로운 앱 수요를 등록하시려면<br />아래 버튼을 눌러 Tally 설문지로 이동하세요.</p>
            <a href="https://tally.so/r/zxMZg8" target="_blank" rel="noreferrer" className="inline-block bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg font-sans">설문 작성하러 가기 →</a>
          </div>
        )}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-40 h-[84px]">
        {[
          { id: 'dashboard', icon: Home, label: '홈' },
          { id: 'feedback', icon: MessageSquare, label: '피드백' },
          { id: 'participants', icon: Users, label: '참가자' },
          { id: 'input', icon: PlusCircle, label: '등록' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedItem(null); setViewDetailItem(null); }} className={`flex flex-col items-center justify-center gap-1.5 w-1/4 h-full transition-all ${activeTab === tab.id ? 'text-black' : 'text-gray-400'}`}>
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[11px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 상세보기 모달 (홈 탭용) */}
      {viewDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewDetailItem(null)}></div>
          <div className="relative bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl p-8 animate-fade-in text-black">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-sans">{viewDetailItem.app_title || '상세 보기'}</h3>
                <p className="text-sm text-gray-500 font-sans">{viewDetailItem.respondent_name}님의 제안</p>
              </div>
              <button onClick={() => setViewDetailItem(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-6 text-sm font-sans">
              <div><p className="font-bold text-gray-400 text-xs uppercase mb-2">Pain Point</p><div className="bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap border">{viewDetailItem.pain_point}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded border"><p className="text-xs text-gray-400 mb-1">이메일</p><p className="font-medium truncate">{viewDetailItem.respondent_email}</p></div>
                <div className="p-3 bg-gray-50 rounded border"><p className="text-xs text-gray-400 mb-1">연락처</p><p className="font-medium">{viewDetailItem.respondent_phone || '-'}</p></div>
              </div>
              {viewDetailItem.admin_reply_memo && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="font-bold text-green-700 mb-1">✅ 관리자 피드백 완료</p><p className="text-green-800 line-clamp-3 leading-relaxed">{viewDetailItem.admin_reply_memo}</p></div>
              )}
            </div>
            <button onClick={() => { setViewDetailItem(null); setActiveTab('feedback'); setSelectedItem(viewDetailItem); setReplySubject(`[답변] ${viewDetailItem.app_title} 피드백`); }} className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95 font-sans">피드백 작성하러 가기</button>
          </div>
        </div>
      )}

      {/* 🟢 참가자 상세 모달 */}
      {viewParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 fade-in-modal">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewParticipant(null)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale-in">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b z-10 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 truncate pr-4">{viewParticipant.respondent_name}님의 활동 내역</h3>
              <button onClick={() => setViewParticipant(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 1. 기본 정보 (최신 기준) */}
              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">참가자 프로필</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="block text-gray-500 mb-1">이름</span>
                    <span className="font-medium text-gray-900">{viewParticipant.respondent_name || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">나이대</span>
                    <span className="font-medium text-gray-900">{viewParticipant.age_group || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">이메일</span>
                    <span className="font-medium text-gray-900">{viewParticipant.respondent_email || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">연락처</span>
                    <span className="font-medium text-gray-900">{viewParticipant.respondent_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">IT 지식 수준</span>
                    <span className="font-medium text-gray-900">{viewParticipant.it_knowledge || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">직업 상태</span>
                    <span className="font-medium text-gray-900">{viewParticipant.job_status || '-'}</span>
                  </div>
                </div>
              </section>

              <div className="h-px bg-gray-100"></div>

              {/* 2. 히스토리 리스트 */}
              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">제출한 아이디어 목록 ({data.filter(d => d.respondent_email === viewParticipant.respondent_email && d.respondent_name === viewParticipant.respondent_name).length}건)</h4>
                <div className="space-y-4">
                  {data
                    .filter(d => d.respondent_email === viewParticipant.respondent_email && d.respondent_name === viewParticipant.respondent_name)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // 최신순 정렬
                    .map(historyItem => (
                      <div
                        key={historyItem.id}
                        onClick={() => {
                          setViewParticipant(null);
                          setActiveTab('feedback');
                          setSelectedItem(historyItem);
                          setReplySubject(`[답변] ${historyItem.app_title} 관련 피드백입니다.`);
                        }}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 transition group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-base text-gray-900">{historyItem.app_title || '제목 없음'}</h3>
                          <span className="text-xs text-gray-400">{historyItem.created_at}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{historyItem.pain_point}</p>

                        {/* 답변 상태 표시 */}
                        {historyItem.admin_reply_memo ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                            <span>✅ 답변 완료</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium border border-orange-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 답변 대기중
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </section>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewParticipant(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .fade-in-modal { animation: fadeIn 0.2s ease-out forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}