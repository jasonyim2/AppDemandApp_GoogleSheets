import { createClient } from '@supabase/supabase-js';

// 1. [안전 모드] 열쇠를 코드에 직접 적지 않고, 환경 변수 금고에서 꺼내옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ... (아래 코드는 그대로 두시면 됩니다)

export default async function AdminPage() {
  
  // 모든 데이터를 가져옵니다.
  const { data: surveys, error } = await supabase
    .from('survey_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">데이터 에러: {error.message}</div>;
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 설문 응답 전체 리스트</h1>
      <p className="mb-4 text-gray-600">
        총 {surveys?.length || 0}건의 응답이 있습니다. <br/>
        <span className="text-sm text-blue-600">* 표 내용을 좌우로 스크롤하여 전체 항목을 확인하세요.</span>
      </p>
      
      {/* 가로 스크롤이 가능하도록 설정된 구역 */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-500 whitespace-nowrap">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 border-r">날짜 (한국시간)</th>
              <th className="px-6 py-3 border-r">이름</th>
              <th className="px-6 py-3 border-r">이메일</th>
              <th className="px-6 py-3 border-r">전화번호</th>
              <th className="px-6 py-3 border-r">연령대</th>
              <th className="px-6 py-3 border-r">직업</th>
              <th className="px-6 py-3 border-r">IT 지식</th>
              <th className="px-6 py-3 border-r bg-blue-50">희망 앱 제목</th>
              <th className="px-6 py-3 border-r">불편한 점</th>
              <th className="px-6 py-3 border-r">해결 희망</th>
              <th className="px-6 py-3 border-r">자동화 희망</th>
              <th className="px-6 py-3 border-r">주 사용 기기</th>
              <th className="px-6 py-3 border-r">추가 요청</th>
              <th className="px-6 py-3 border-r">참고 URL</th>
              <th className="px-6 py-3">회신 방법</th>
            </tr>
          </thead>
          <tbody>
            {surveys?.map((item) => (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                {/* 1. 날짜 */}
                <td className="px-6 py-4 border-r">
                  {new Date(item.created_at).toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                {/* 2. 인적사항 */}
                <td className="px-6 py-4 font-bold text-gray-900 border-r">{item.respondent_name}</td>
                <td className="px-6 py-4 border-r">{item.respondent_email}</td>
                <td className="px-6 py-4 border-r">{item.respondent_phone}</td>
                <td className="px-6 py-4 border-r">{item.age_group}</td>
                <td className="px-6 py-4 border-r">{item.job_status}</td>
                <td className="px-6 py-4 border-r">{item.it_knowledge}</td>
                
                {/* 3. 앱 기획 내용 */}
                <td className="px-6 py-4 text-blue-600 font-bold border-r bg-blue-50">
                  {item.app_title}
                </td>
                <td className="px-6 py-4 border-r max-w-xs truncate" title={item.pain_point}>
                  {item.pain_point}
                </td>
                <td className="px-6 py-4 border-r max-w-xs truncate" title={item.solution_wish}>
                  {item.solution_wish}
                </td>
                <td className="px-6 py-4 border-r max-w-xs truncate" title={item.automation_wish}>
                  {item.automation_wish}
                </td>
                <td className="px-6 py-4 border-r">{item.device_usage}</td>
                <td className="px-6 py-4 border-r max-w-xs truncate" title={item.extra_request}>
                  {item.extra_request}
                </td>
                
                {/* 4. URL 링크 (클릭 가능하게) */}
                <td className="px-6 py-4 border-r text-blue-500 underline">
                  {item.reference_url ? (
                    <a href={item.reference_url} target="_blank" rel="noopener noreferrer">링크 열기</a>
                  ) : '-'}
                </td>
                
                {/* 5. 회신 방법 */}
                <td className="px-6 py-4">{item.contact_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}