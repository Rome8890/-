import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tag, title, body, answer, serviceLink } = await request.json();

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: 'Telegram credentials not configured' }, { status: 500 });
    }

    const fullAnswer = answer.replace('[장충금 헌터 무료 서비스 바로가기]', serviceLink);

    const message = `🎯 [지식인 마케팅 센터]

유형: ${tag}
질문: ${title}

내용: ${body}

──────────────────────
📝 지식인 답변 (복사 후 붙여넣기)
──────────────────────
${fullAnswer}

──────────────────────
🔗 맞춤형 서비스 링크
${serviceLink}
──────────────────────`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
