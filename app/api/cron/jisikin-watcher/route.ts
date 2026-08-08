import { NextResponse } from 'next/server';

const SERVICE_BASE = 'https://jangchoonggim-jyl1256-gmailcoms-projects.vercel.app';

export async function GET(request: Request) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ ok: false, error: 'Telegram credentials missing' }, { status: 500 });
    }

    // 네이버 지식iN '장기수선충당금' 최근 질문 크롤링
    const searchUrl = 'https://kin.naver.com/search/list.naver?query=' + encodeURIComponent('장기수선충당금') + '&section=kin&sort=date';
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      next: { revalidate: 0 },
    });

    const html = await res.text();
    
    // 간단 규격화 정규식 패턴으로 최근 질문 추출
    const items: Array<{ title: string; link: string; docId: string; snippet: string }> = [];
    const linkRegex = /href="(https:\/\/kin\.naver\.com\/qna\/detail\.naver\?[^"]*docId=([0-9]+)[^"]*)"[^>]*>([^<]+)<\/a>/g;
    
    let match;
    const seenDocIds = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const link = match[1].replace(/&amp;/g, '&');
      const docId = match[2];
      const rawTitle = match[3].replace(/<[^>]+>/g, '').trim();

      if (!seenDocIds.has(docId) && rawTitle.length > 5) {
        seenDocIds.add(docId);
        items.push({
          title: rawTitle,
          link,
          docId,
          snippet: rawTitle,
        });
      }
      if (items.length >= 3) break;
    }

    if (items.length === 0) {
      return NextResponse.json({ ok: true, message: 'No new questions found', count: 0 });
    }

    // 최신 질문 1건 전송 및 텔레그램 알림
    const topItem = items[0];
    const serviceLink = `${SERVICE_BASE}/checkout?from=jisikin&docId=${topItem.docId}`;

    const tgMessage = `🔔 [장충금 24시 클라우드 자동 감시 알림]

📌 질문: ${topItem.title}
🔗 질문 링크: ${topItem.link}

📝 [추천 답변 가이드]
안녕하세요! 주택임대차보호법 및 공동주택관리법 제31조에 따르면 장기수선충당금은 집주인(소유자) 부담 의무입니다. 이사 시 관리비 정산 내역서를 첨부하여 전액 반환 청구하실 수 있습니다.

🌐 장충금 내용증명 계산기 바로가기:
${serviceLink}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: tgMessage,
      }),
    });

    const tgData = await tgRes.json();

    return NextResponse.json({
      ok: true,
      message: 'Cloud watcher checked successfully',
      sentItem: topItem.title,
      telegramDelivered: tgData.ok ?? false,
    });
  } catch (error: any) {
    console.error('Vercel Cron Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
