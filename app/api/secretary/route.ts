import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN   = process.env.SECRETARY_BOT_TOKEN!;
const GEMINI_KEY  = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-2.5-flash';
const LAW_OC      = process.env.LAW_OC || 'law8899';
const SB_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_BASE = 'https://jangchoonggim-jyl1256-gmailcoms-projects.vercel.app';

const supabase = createClient(SB_URL, SB_KEY);

// ── 법령 MCP 조회 ──────────────────────────────────
async function fetchLawContext(query: string): Promise<string> {
  try {
    const res = await fetch(`https://korean-law-mcp.fly.dev/mcp?oc=${LAW_OC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'chain_full_research', arguments: { query } }
      }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json();
    const content: {type:string,text:string}[] = data?.result?.content || [];
    const fullText = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    // 핵심 조항만 추출
    const lines = fullText.split('\n');
    const keyLines: string[] = [];
    for (const line of lines) {
      if (['제30조','제3조','임차인','반환하여야','소멸시효','지급명령','내용증명','민법 제','제162조','제174조'].some(k => line.includes(k))) {
        keyLines.push(line);
        if (keyLines.join('\n').length > 3500) break;
      }
    }
    const extracted = keyLines.join('\n').trim();
    return extracted.length > 200 ? extracted : fullText.slice(0, 4000);
  } catch { return ''; }
}

const SERVICE_LINK = 'https://jangchoonggim-jyl1256-gmailcoms-projects.vercel.app/?from=jisikin&qid=2';

// ── Gemini: 답변 + 서비스 컨텐츠 동시 생성 ──────────
async function generateFull(
  questionTitle: string, questionBody: string,
  feedback: string, prevAnswer: string, lawContext: string
): Promise<{ answer: string; tag: string; verdict: string; legalSummary: object[]; actionSteps: object[] } | null> {

  const isRegen = !!feedback || !!prevAnswer;
  const regenSection = isRegen ? `
[이전 답변 — 이것보다 반드시 더 나은 답변을 작성하세요]
${prevAnswer}

[개선 지시사항]
${feedback || '전반적으로 더 상세하고 설득력 있게, 법령 근거를 더 구체적으로 인용하여 개선하세요.'}
` : '';

  const prompt = `당신은 임차인 권리 전문 법률 자문가입니다. 장기수선충당금·전세보증금 반환 분야에서 임차인 승소율 97%를 기록한 전문가입니다.

[실제 법령 원문 — 반드시 조항번호와 함께 직접 인용하세요]
${lawContext || '공동주택관리법 제30조 제2항: 소유자는 임차인이 대납한 장기수선충당금을 임대차 종료 시 반환하여야 한다. (강행규정, 특약으로 배제 불가)'}
${regenSection}
[질문]
제목: ${questionTitle}
내용: ${questionBody}

[answer 필드 절대 규칙]
① 첫 문장: "네, 가능합니다" / "즉시 청구하세요" / "전액 반환받을 수 있습니다" 중 하나로 시작 (조건부 표현 절대 금지)
② 법령 조항번호 직접 인용 (예: 공동주택관리법 제30조 제2항)
③ 질문자 상황에 맞춘 구체적 조언 (일반론 금지)
④ 내용증명 발송 안내 포함
⑤ 마지막 줄: "내용증명서가 필요하시면 → ${SERVICE_LINK}"
⑥ 600~900자 사이로 충분히 상세하게 작성
${isRegen ? '⑦ 이전 답변보다 반드시 더 구체적이고 상세하게 작성할 것' : ''}

아래 JSON 형식으로만 응답 (순수 JSON, 코드블록 없이):
{
  "answer": "위 규칙을 모두 준수한 고품질 네이버 지식인 답변",
  "tag": "집주인 거부형 또는 이사 준비형 또는 전세보증금형",
  "verdict": "핵심 결론 한 문장 (강하고 단정적으로)",
  "legalSummary": [
    {"type":"law","badge":"법령","cite":"정확한 법령명과 조항번호","quote":"실제 조문 원문 그대로","point":"이 조항이 질문자에게 유리한 이유"},
    {"type":"precedent","badge":"법원 판결","cite":"확립된 판례 법리","quote":"판결 요지","point":"이 사건에 적용되는 포인트"},
    {"type":"remedy","badge":"법적 수단","cite":"소액심판 또는 지급명령","quote":"절차 안내","point":"인지대/기간/승소율"}
  ],
  "actionSteps": [
    {"timing":"오늘 바로","icon":"📋","action":"질문자 상황에 맞는 구체적 행동"},
    {"timing":"이번 주 내","icon":"📮","action":"내용증명 발송 관련 구체적 행동"},
    {"timing":"거부/미이행 시","icon":"⚖️","action":"소송 절차 구체적 안내"}
  ]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 8192 }
      })
    }
  );
  const data = await res.json();
  let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // JSON 블록 추출
  const blockMatch = text.match(/```json\s*([\s\S]*?)```/);
  text = blockMatch ? blockMatch[1] : text.replace(/^```json\s*|\s*```$/g, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  try { return JSON.parse(text.trim()); } catch { return null; }
}

// ── Telegram 유틸 ───────────────────────────────────
async function tg(method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function sendDraft(chatId: number, questionTitle: string, questionUrl: string,
  answer: string, serviceUrl: string, rowId: string, version: number) {
  const preview = answer.length > 700 ? answer.slice(0, 700) + '...' : answer;
  await tg('sendMessage', {
    chat_id: chatId,
    text: `📝 [답변 v${version} 준비완료]\n\n📌 ${questionTitle}\n🔗 ${questionUrl}\n\n${preview}\n\n🌐 서비스 링크: ${serviceUrl}\n\n✏️ 수정하려면 이 메시지에 Reply로 요청하세요`,
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ 네이버 등록완료', callback_data: `approve:${rowId}` },
        { text: '🔄 재생성', callback_data: `regen:${rowId}` },
      ]]
    }
  });
}

// ── 메인 웹훅 핸들러 ────────────────────────────────
export async function POST(request: Request) {
  try {
    const update = await request.json();

    // ── 버튼 콜백 처리 ──
    if (update.callback_query) {
      const cq = update.callback_query;
      const [action, rowId] = cq.data.split(':');
      const chatId: number = cq.message.chat.id;

      await tg('answerCallbackQuery', { callback_query_id: cq.id });

      if (action === 'approve') {
        await supabase.from('jisikin_answers').update({ status: 'posted' }).eq('id', rowId);
        await tg('sendMessage', { chat_id: chatId, text: '✅ 등록 완료로 기록했습니다! 수고하셨습니다 💖' });
      }

      if (action === 'regen') {
        const { data: row } = await supabase.from('jisikin_answers').select('*').eq('id', rowId).single();
        if (!row) return NextResponse.json({ ok: true });

        await tg('sendMessage', { chat_id: chatId, text: '🔄 재생성 중...' });
        const lawCtx = await fetchLawContext('공동주택관리법 제30조 장기수선충당금 임차인 반환');
        const result = await generateFull(row.question_title, row.question_body || '', '', row.answer_text, lawCtx);
        if (!result) return NextResponse.json({ ok: true });

        const newVersion = (row.version || 1) + 1;
        await supabase.from('jisikin_answers').update({
          answer_text: result.answer,
          page_content: { tag: result.tag, verdict: result.verdict, legalSummary: result.legalSummary, actionSteps: result.actionSteps },
          version: newVersion, status: 'draft'
        }).eq('id', rowId);

        await sendDraft(chatId, row.question_title, row.question_url, result.answer,
          `${SERVICE_BASE}/?id=${rowId}`, rowId, newVersion);
      }
      return NextResponse.json({ ok: true });
    }

    // ── Reply 텍스트 (피드백 수정 요청) ──
    const msg = update.message;
    if (!msg?.text || !msg?.chat?.id) return NextResponse.json({ ok: true });

    const chatId: number = msg.chat.id;
    const userText: string = msg.text.trim();

    // /start
    if (userText === '/start') {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '👋 장충금 알림봇입니다!\n\n' +
          '✅ 새 답변 자동 알림 (30분마다)\n\n' +
          '🔄 재생성 명령어:\n' +
          '• "재생성" → 그대로 다시 생성\n' +
          '• "재생성 판례 추가해줘" → 판례 강화\n' +
          '• "재생성 더 간결하게" → 간결한 버전\n' +
          '• "재생성 강경하게" → 강한 어조\n\n' +
          '✏️ 답변 메시지에 Reply → 피드백 반영'
      });
      return NextResponse.json({ ok: true });
    }

    // ── "재생성" 입력 (단독 or "재생성 [지시]") ──
    const regenTriggers = ['재생성', '🔄', '다시', '다시만들어줘'];
    const isRegen = regenTriggers.includes(userText) || userText.startsWith('재생성 ');
    if (isRegen) {
      // "재생성 판례 추가해줘" → feedback = "판례 추가해줘"
      const feedback = userText.startsWith('재생성 ')
        ? userText.slice(4).trim()
        : '';

      await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
      const statusMsg = feedback
        ? `🔄 "${feedback}" 반영하여 재생성 중...`
        : '🔄 고퀄리티 답변으로 재생성 중...';
      await tg('sendMessage', { chat_id: chatId, text: statusMsg });

      const { data: rows } = await supabase
        .from('jisikin_answers')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      const row = rows?.[0];
      if (!row) {
        await tg('sendMessage', { chat_id: chatId, text: '⚠️ 재생성할 답변이 없어요. 새 질문을 기다리는 중입니다.' });
        return NextResponse.json({ ok: true });
      }

      const lawCtx = await fetchLawContext(row.question_title + ' ' + (row.question_body || ''));
      const result = await generateFull(
        row.question_title, row.question_body || '',
        feedback, row.answer_text, lawCtx
      );
      if (!result) {
        await tg('sendMessage', { chat_id: chatId, text: '❌ 재생성 실패. 잠시 후 다시 시도해주세요.' });
        return NextResponse.json({ ok: true });
      }

      const newVersion = (row.version || 1) + 1;
      await supabase.from('jisikin_answers').update({
        answer_text: result.answer,
        page_content: { tag: result.tag, verdict: result.verdict, legalSummary: result.legalSummary, actionSteps: result.actionSteps },
        version: newVersion, status: 'draft'
      }).eq('id', row.id);

      await sendDraft(chatId, row.question_title, row.question_url, result.answer,
        `${SERVICE_BASE}/?id=${row.id}`, row.id, newVersion);
      return NextResponse.json({ ok: true });
    }

    // Reply인 경우 → 피드백으로 처리
    const replyTo = msg.reply_to_message;
    if (!replyTo?.text) return NextResponse.json({ ok: true });

    // 원본 메시지에서 row ID 추출
    const idMatch = replyTo.text.match(/\?id=([a-f0-9-]{36})/);
    if (!idMatch) {
      await tg('sendMessage', { chat_id: chatId, text: '⚠️ 답변 ID를 찾을 수 없어요. 원본 답변 메시지에 Reply 해주세요.' });
      return NextResponse.json({ ok: true });
    }
    const rowId = idMatch[1];

    const { data: row } = await supabase.from('jisikin_answers').select('*').eq('id', rowId).single();
    if (!row) return NextResponse.json({ ok: true });

    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    await tg('sendMessage', { chat_id: chatId, text: `✏️ 피드백 반영 중...\n"${userText.slice(0, 50)}"` });

    const lawCtx = await fetchLawContext('공동주택관리법 제30조 장기수선충당금 임차인 반환');
    const result = await generateFull(row.question_title, row.question_body || '', userText, row.answer_text, lawCtx);
    if (!result) {
      await tg('sendMessage', { chat_id: chatId, text: '❌ 재생성 실패. 다시 시도해주세요.' });
      return NextResponse.json({ ok: true });
    }

    const newVersion = (row.version || 1) + 1;
    await supabase.from('jisikin_answers').update({
      answer_text: result.answer,
      page_content: { tag: result.tag, verdict: result.verdict, legalSummary: result.legalSummary, actionSteps: result.actionSteps },
      version: newVersion, status: 'draft'
    }).eq('id', rowId);

    await sendDraft(chatId, row.question_title, row.question_url, result.answer,
      `${SERVICE_BASE}/?id=${rowId}`, rowId, newVersion);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[secretary webhook]', err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: '비서봇 Webhook Active ✅' });
}
