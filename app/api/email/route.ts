import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { id, to, subject, text } = await request.json();

    // 1. 이메일 전송 (Nodemailer)
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('환경 변수(GMAIL_USER, GMAIL_PASS)가 없습니다!');
      return NextResponse.json({ success: false, message: '서버 설정 오류 (Email)' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);

    // 2. 구글 시트 업데이트 (Google Sheets API)
    // 환경변수 확인
    const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // 개행문자 처리

    if (id && SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY) {
      try {
        // 인증 (GoogleAuth 사용 - 권장 방식)
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // ID로 행(Row) 찾기 (A열 검색)
        const readRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Tally_raw!A:A',
        });

        const rows = readRes.data.values;

        // [디버깅] ID 매칭 확인을 위한 로그 (Vercel 로그에서 확인 가능)
        console.log(`[API Debug] Searching for ID: "${id}"`);
        if (rows && rows.length > 0) {
          console.log(`[API Debug] First 3 IDs in Sheet: ${JSON.stringify(rows.slice(0, 3))}`);
        }

        // id와 일치하는 행 찾기 (문자열 변환 및 공백 제거 후 비교)
        const rowIndex = rows?.findIndex((row) => String(row[0] || '').trim() === String(id).trim());

        if (rowIndex !== undefined && rowIndex !== -1) {
          const realRowNumber = rowIndex + 1; // 1-based index

          // 기존 댓글(메모) 가져오기 (V열)
          const memoRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `Tally_raw!V${realRowNumber}`,
          });
          const oldMemo = memoRes.data.values?.[0]?.[0] || '';

          // 새 메모 포맷팅 (기존 메모 하단에 추가)
          const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
          const newFullMemo = `[${nowStr} 발송] ${subject}\n${text}\n----------------\n${oldMemo}`;

          // V(답변내용), W(답변상태), X(답변일시) 업데이트
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Tally_raw!V${realRowNumber}:X${realRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[newFullMemo, 'Y', nowStr]],
            },
          });
          console.log(`Google Sheet Updated for ID: ${id} at Row: ${realRowNumber}`);
        } else {
          console.warn(`ID not found in Sheet: ${id}`);
        }
      } catch (sheetError) {
        console.error('Google Sheet Update Error:', sheetError);
        // 이메일은 성공했으므로 여기서 에러를 던져서 실패 처리하지 않고, 로그만 남김 (또는 클라이언트에 경고 전달)
      }
    } else {
      console.warn('Google Sheet Env Vars missing or ID not provided. Skipping Sheet Update.');
    }

    return NextResponse.json({ success: true, message: '전송 성공' });

  } catch (error: any) {
    console.error('이메일 전송 상세 에러:', error);
    return NextResponse.json({ success: false, message: '전송 실패: ' + error.message }, { status: 500 });
  }
}