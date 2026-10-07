import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_BOT_TOKEN = Buffer.from('ODk1NzgyMTAwODpBQUVldE5seUp0VWZMdngzWGVxWEt5Z0xoNG9pVU9nVzhSdw==', 'base64').toString('utf-8');
const DEFAULT_GEMINI_KEY = Buffer.from('QVEuQWI4Uk42Slh5WmhfV005b2huNGlsMFZqQzJWMVZtclBqLTNLSHBwaU5WSGVreWg0dXc=', 'base64').toString('utf-8');
const DEFAULT_SB_URL = 'https://baqzsbcoljtlbvuxldgy.supabase.co';
const DEFAULT_SB_KEY = Buffer.from('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmFZbXF6WW1OdmJtcDBiR0oyZFhoSlpIZDVJaXdpY205c1pTSTZJbUZ1YjI0aUxDSnBZWFFpT2pFM056ZzRPVE14TURJc0ltVjRjQ0k2TWpBNU5EUTJPVEV3TW4wLkhTNjdrUk5vc0xIWFhfamJjWlotaHNBRzZBMnkxWUxzNEYycmFCX0F0YUVr', 'base64').toString('utf-8');

const BOT_TOKEN    = DEFAULT_BOT_TOKEN;
const GEMINI_KEY   = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20) 
                     ? process.env.GEMINI_API_KEY 
                     : DEFAULT_GEMINI_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const LAW_OC       = process.env.LAW_OC || 'law8899';
const SB_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SB_URL;
const SB_KEY       = (process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_KEY.length > 20) 
                     ? process.env.SUPABASE_SERVICE_KEY 
                     : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20) 
                       ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                       : DEFAULT_SB_KEY;
const SERVICE_BASE = 'https://www.longtermrefund.site';
const GH_PAT       = process.env.GH_PAT || '';
const GH_REPO      = 'Rome8890/jangchoonggeum-hunter';

const supabase = createClient(SB_URL, SB_KEY);

// ── 네이버 답변작성 에디터 직행 링크 (PC/모바일 정상 작동) ───────────────────
function buildWriteUrl(link: string): string {
  const dirMatch = link.match(/dirId=(\d+)/);
  const docMatch = link.match(/docId=(\d+)/);
  if (dirMatch && docMatch) {
    return `https://kin.naver.com/qna/detail.naver?dirId=${dirMatch[1]}&docId=${docMatch[1]}#answerButtonArea`;
  }
  return link;
}

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

const SERVICE_BASE_URL = 'https://www.longtermrefund.site';

// ── 질문 유형 분류 → qid ────────────────────────────
function classifyQid(title: string, body: string): number {
  const text = title + ' ' + body;
  if (['안 준다', '안줘', '거부', '못 받', '못받', '안돌려', '버티', '안 돌려'].some(k => text.includes(k))) return 1;
  return 2;
}

// ── Gemini: 답변 + 서비스 컨텐츠 동시 생성 ──────────
async function generateFull(
  questionTitle: string, questionBody: string,
  feedback: string, prevAnswer: string, lawContext: string,
  serviceQid?: number, tone: string = 'standard'
): Promise<{ answer: string; tag: string; verdict: string; legalSummary: object[]; actionSteps: object[] } | null> {
  const qid = serviceQid ?? classifyQid(questionTitle, questionBody);
  const SERVICE_LINK = `${SERVICE_BASE_URL}/?from=jisikin&qid=${qid}`;

  const isRegen = !!feedback || !!prevAnswer || tone !== 'standard';

  let toneGuidance = '';
  if (tone === 'friendly') {
    toneGuidance = `
[특별 톤 요청: 세입자 공감 & 친절형]
- 세입자의 막막함에 따뜻하게 공감하며, 친절하고 부드러운 어조로 답변하세요.
- 어려운 법률 용어는 괄호로 쉬운 일상어로 풀어서 안내하세요.`;
  } else if (tone === 'aggressive') {
    toneGuidance = `
[특별 톤 요청: 초강력 법률·내용증명형]
- 민법 제162조 제1항 채권 소멸시효 10년 규정과 공동주택관리법 강행규정을 강력히 강조하세요.
- 내용증명 발송 즉시 잠정 시효중단 및 6개월 내 소액심판 제기 시 소송촉진법상 연 12% 지연이자, 통장 압류 및 강제집행 가능성을 명시하여 단호하고 강경하게 작성하세요.`;
  } else if (tone === 'concise') {
    toneGuidance = `
[특별 톤 요청: 3줄 핵심 요약형]
- 군더더기를 싹 빼고 [1. 법적 반환 권리 / 2. 청구 가능 기한(10년) / 3. 오늘 당장 해야 할 3단계] 핵심만 450~650자 내외로 명쾌하게 정리하세요.`;
  }

  const regenSection = isRegen ? `
[이전 답변 참고]
${prevAnswer ? prevAnswer.slice(0, 1500) : ''}

[개선 지시사항]
${feedback || '더 상세하고 설득력 있게, 실제 임차인에게 최적화된 맞춤형 솔루션으로 작성하세요.'}
${toneGuidance}
` : '';

  const prompt = `당신은 임차인 권리 전문 법률 자문가입니다. 장기수선충당금·전세보증금 반환 분야에서 임차인 승소율 97%를 기록한 전문가입니다.

[실제 법령 원문 — 반드시 조항번호와 함께 직접 인용하세요]
${lawContext || '공동주택관리법 제30조 제1항: 장기수선충당금은 해당 공동주택의 소유자로부터 징수하여 적립한다.\n공동주택관리법 시행령 제31조 제7항: 소유자는 임차인이 대신 납부한 장기수선충당금을 반환하여야 한다.'}
${regenSection}
[질문]
제목: ${questionTitle}
내용: ${questionBody}

[answer 필드 절대 규칙]
① 첫 문장: "네, 전액 반환받을 수 있습니다." / "지금 즉시 청구하셔야 합니다." 등 단정적 결론으로 시작
② 법령 조항번호 직접 인용 (공동주택관리법 제30조 제1항, 동법 시행령 제31조 제7항, 민법 제162조 10년 소멸시효 등)
③ 질문자 상황(거주 기간, 이사 여부 등)에 맞춘 구체적 조언
④ 내용증명 발송 및 지연이자(민법 5%, 소송촉진법 12%) 안내
⑤ 마지막 줄: "무료 내용증명서 자동 생성 → ${SERVICE_LINK}"
⑥ 읽기 편한 단락 구분과 번호 목록 활용

아래 JSON 형식으로만 응답 (순수 JSON, 코드블록 없이):
{
  "answer": "위 규칙을 모두 준수한 고품질 네이버 지식인 등록용 답변",
  "tag": "집주인 거부형 또는 이사 준비형 또는 시효청구형",
  "verdict": "핵심 결론 한 문장 (강하고 단정적으로)",
  "legalSummary": [
    {"type":"law","badge":"핵심 법령","cite":"공동주택관리법 시행령 제31조 제7항","quote":"소유자는 임차인이 대신 납부한 금액을 반환하여야 한다","point":"임차인 반환 청구의 직접적 법적 근거"},
    {"type":"law","badge":"소멸시효","cite":"민법 제162조 제1항","quote":"채권은 10년간 행사하지 아니하면 소멸시효가 완성한다","point":"이사 후 최대 10년 전 대납금까지 전액 청구 가능"},
    {"type":"remedy","badge":"법적 수단","cite":"소액사건심판법","quote":"3,000만원 이하 간이 소송","point":"신청비 약 1만원, 2~3개월 내 신속 판결"}
  ],
  "actionSteps": [
    {"timing":"오늘 바로","icon":"📋","action":"관리사무소 납부확인서 발급 및 대상 금액 산출"},
    {"timing":"이번 주 내","icon":"📮","action":"내용증명서 우체국 등기 발송"},
    {"timing":"미반환 시","icon":"⚖️","action":"소액심판 청구 및 연 12% 지연이자 청구"}
  ]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 8192,
                            thinkingConfig: { thinkingBudget: 0 } }
      })
    }
  );
  if (res.status === 429) {
    await tg('sendMessage', { chat_id: Number(process.env.TELEGRAM_CHAT_ID || '8865095008'),
      text: '⚠️ Gemini API 오늘 할당량 소진\n새 키 교체가 필요합니다.\n내일 자정 자동 리셋됩니다.' });
    return null;
  }
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

// ── 잘림 방지 스마트 분할 전송 (1글자도 끊김 없는 완전 전송) ────
async function sendChunked(chatId: number, text: string) {
  if (!text) return;
  if (text.length <= 4000) {
    return tg('sendMessage', { chat_id: chatId, text });
  }
  let remaining = text;
  let part = 1;
  const totalParts = Math.ceil(text.length / 4000);
  while (remaining.length > 0) {
    if (remaining.length <= 4000) {
      const prefix = totalParts > 1 ? `📋 [답변 본문 Part ${part}/${totalParts}]\n\n` : '';
      await tg('sendMessage', { chat_id: chatId, text: prefix + remaining });
      break;
    }
    let splitIdx = remaining.lastIndexOf('\n\n', 4000);
    if (splitIdx === -1 || splitIdx < 1500) {
      splitIdx = remaining.lastIndexOf('\n', 4000);
    }
    if (splitIdx === -1 || splitIdx < 1500) {
      splitIdx = 4000;
    }
    const chunk = remaining.slice(0, splitIdx).trim();
    remaining = remaining.slice(splitIdx).trim();
    await tg('sendMessage', { chat_id: chatId, text: `📋 [답변 본문 Part ${part}/${totalParts}]\n\n` + chunk });
    part++;
  }
}

// ── 원클릭 UX를 위한 2개 메시지 분리 전송 ─────────────
async function sendDraft(
  chatId: number, questionTitle: string, questionUrl: string,
  answer: string, qid: number, rowId: string, version: number, verdict?: string
) {
  const serviceUrl = `${SERVICE_BASE}/?from=jisikin&qid=${qid}`;
  const writeUrl = buildWriteUrl(questionUrl);

  const cardText =
    `🎯 [장충금 헌터] 답변 v${version} 준비완료 ✨\n\n` +
    `📌 질문: ${questionTitle}\n` +
    `💡 진단: ${verdict || '임차인 전액 반환 청구 가능 (승소율 97%)'}\n\n` +
    `👇 아래 [✍️ 네이버 답변창 열기]를 누르고, 다음 메시지의 답변을 복사해서 붙여넣으세요!\n` +
    `🆔 ${rowId}`;

  // 1. 안내 & 원클릭 버튼 카드 발송
  await tg('sendMessage', {
    chat_id: chatId,
    text: cardText,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✍️ 네이버 답변창 열기', url: writeUrl },
          { text: '🌐 장충금 헌터 웹', url: serviceUrl }
        ],
        [
          { text: '🌿 친절·공감 톤', callback_data: `regen:${rowId}:friendly` },
          { text: '⚖️ 강력 법률 톤', callback_data: `regen:${rowId}:aggressive` }
        ],
        [
          { text: '⚡ 3줄 요약 톤', callback_data: `regen:${rowId}:concise` },
          { text: '✅ 등록완료 확인', callback_data: `approve:${rowId}` }
        ]
      ]
    }
  });

  // 2. 단독 복사용 순수 답변 메시지 발송 (터치 한 번으로 1초 복사)
  await sendChunked(chatId, answer);
}

// ── GitHub Actions workflow_dispatch 트리거 ───────────
async function triggerNaverPost(rowId: string): Promise<{ok: boolean; status: number; detail: string}> {
  if (!GH_PAT) return {ok: false, status: 0, detail: 'GH_PAT 환경변수 없음'};
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/actions/workflows/naver-post.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GH_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main', inputs: { row_id: rowId } })
      }
    );
    const body = await res.text();
    return {ok: res.status === 204, status: res.status, detail: body.slice(0, 300)};
  } catch (e) {
    return {ok: false, status: -1, detail: String(e)};
  }
}

// ── 주간 요약 전송 ────────────────────────────────────
async function sendWeeklySummary(chatId: number, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: rows } = await supabase
    .from('jisikin_answers')
    .select('id,question_title,question_url,answer_text,status,version,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!rows || rows.length === 0) {
    await tg('sendMessage', { chat_id: chatId, text: `📊 최근 ${days}일간 수집된 장충금 질문이 아직 없습니다.` });
    return;
  }

  const posted = rows.filter(r => r.status === 'posted').length;
  let summaryText =
    `📊 [장충금 헌터] 최근 ${days}일 활동 브리핑 ✨\n\n` +
    `• 총 생성 답변: ${rows.length}건\n` +
    `• 지식인 등록 완료: ${posted}건\n` +
    `• 검토 및 대기 중: ${rows.length - posted}건\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📌 최근 주요 질문 리스트:\n`;

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const r = rows[i];
    const statusIcon = r.status === 'posted' ? '✅' : '📝';
    const dateStr = (r.created_at || '').slice(5, 10);
    summaryText += `\n${i + 1}. ${statusIcon} [${dateStr}] ${r.question_title.slice(0, 28)}...\n   🔗 ${r.question_url}\n`;
  }
  summaryText += `\n━━━━━━━━━━━━━━━━━━\n💡 특정 질문의 답변을 다시 보거나 수정하려면 위 링크나 질문에 대해 '재생성'을 요청해주세요!`;

  await tg('sendMessage', {
    chat_id: chatId,
    text: summaryText
  });
}

// ── 메인 웹훅 핸들러 ────────────────────────────────
export async function POST(request: Request) {
  try {
    const update = await request.json();

    // ── 버튼 콜백 처리 ──
    if (update.callback_query) {
      const cq = update.callback_query;
      const [action, rowId, tone] = (cq.data || '').split(':');
      const chatId: number = cq.message.chat.id;

      await tg('answerCallbackQuery', { callback_query_id: cq.id });

      if (action === 'approve') {
        await supabase.from('jisikin_answers').update({ status: 'posted' }).eq('id', rowId);
        await tg('sendMessage', { chat_id: chatId, text: '✅ 등록 완료로 기록했습니다! 고생하셨습니다 대표님 💖' });
      }

      if (action === 'copy') {
        const { data: row } = await supabase.from('jisikin_answers').select('answer_text,question_title,question_body').eq('id', rowId).single();
        if (!row) return NextResponse.json({ ok: true });
        const qidCopy = classifyQid(row.question_title, row.question_body || '');
        const serviceUrl = `${SERVICE_BASE}/?from=jisikin&qid=${qidCopy}`;
        await sendChunked(chatId, `${row.answer_text}\n\n무료 내용증명서 생성 → ${serviceUrl}`);
      }

      if (action === 'post') {
        const { data: row } = await supabase.from('jisikin_answers').select('question_title,question_url').eq('id', rowId).single();
        if (!row) return NextResponse.json({ ok: true });

        await tg('sendMessage', { chat_id: chatId, text: `🚀 지식인 자동 등록 중...\n📌 ${row.question_title}\n\n약 2~3분 소요됩니다.` });

        const result = await triggerNaverPost(rowId);
        if (!result.ok) {
          await tg('sendMessage', {
            chat_id: chatId,
            text: `⚠️ 자동 등록 트리거 실패\nHTTP ${result.status}: ${result.detail}\n\n수동 등록 링크:\n${row.question_url}`
          });
        }
      }

      if (action === 'regen') {
        const { data: row } = await supabase.from('jisikin_answers').select('*').eq('id', rowId).single();
        if (!row) return NextResponse.json({ ok: true });

        const toneName = tone === 'friendly' ? '🌿 친절·공감' : tone === 'aggressive' ? '⚖️ 초강력 법률' : tone === 'concise' ? '⚡ 3줄 요약' : '표준';
        await tg('sendMessage', { chat_id: chatId, text: `🔄 [${toneName} 톤]으로 답변을 재생성 중입니다... 잠시만 기다려주세요!` });
        const lawCtx = await fetchLawContext(row.question_title + ' ' + (row.question_body || ''));
        const qid = classifyQid(row.question_title, row.question_body || '');
        const result = await generateFull(row.question_title, row.question_body || '', '', row.answer_text, lawCtx, qid, tone || 'standard');
        if (!result) {
          await tg('sendMessage', { chat_id: chatId, text: '❌ 재생성 실패. 잠시 후 다시 시도해주세요.' });
          return NextResponse.json({ ok: true });
        }

        const newVersion = (row.version || 1) + 1;
        await supabase.from('jisikin_answers').update({
          answer_text: result.answer,
          page_content: { tag: result.tag, verdict: result.verdict, legalSummary: result.legalSummary, actionSteps: result.actionSteps },
          version: newVersion, status: 'draft'
        }).eq('id', rowId);

        await sendDraft(chatId, row.question_title, row.question_url, result.answer,
          qid, rowId, newVersion, result.verdict);
      }
      return NextResponse.json({ ok: true });
    }

    // ── 메시지 텍스트 수신 처리 ──
    const msg = update.message;
    if (!msg?.text || !msg?.chat?.id) return NextResponse.json({ ok: true });

    const chatId: number = msg.chat.id;
    const rawText: string = msg.text.trim();
    const cleanCmd: string = rawText.replace(/@\w+/g, '').trim().toLowerCase();

    // 1. /start
    if (cleanCmd === '/start' || cleanCmd.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '👋 안녕하세요 대표님! 장충금 헌터 비서봇 카리나입니다 ✨\n\n' +
          '✅ 클라우드에서 30분마다 새 장충금 질문을 감시하고 있습니다.\n\n' +
          '📌 주요 명령어:\n' +
          '• /weekly 또는 주간요약 → 최근 질문·답변 집계 보고\n' +
          '• 재생성 → 가장 최근 질문 새 답변 생성\n' +
          '• 재생성 판례 추가해줘 → 맞춤 피드백 반영\n' +
          '• 답변 알림에 Reply → 실시간 맞춤 수정'
      });
      return NextResponse.json({ ok: true });
    }

    // 2. /weekly, 주간요약, 요약
    if (cleanCmd.startsWith('/weekly') || cleanCmd.startsWith('주간요약') || cleanCmd === '요약') {
      const match = cleanCmd.match(/\d+/);
      const days = match ? parseInt(match[0]) : 7;
      await tg('sendMessage', { chat_id: chatId, text: `📊 최근 ${days}일간의 활동 데이터를 불러오고 있습니다...` });
      await sendWeeklySummary(chatId, days);
      return NextResponse.json({ ok: true });
    }

    // 3. "재생성" 입력 (단독 or "재생성 [지시]")
    const regenTriggers = ['재생성', '🔄', '다시', '다시만들어줘', '/regen'];
    const isRegen = regenTriggers.some(t => cleanCmd === t || cleanCmd.startsWith(t + ' ') || cleanCmd.startsWith(t));
    if (isRegen) {
      const feedback = rawText.replace(/^(재생성|\/regen|다시만들어줘|다시|🔄)\s*/i, '').trim();

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
      const qidRegen = classifyQid(row.question_title, row.question_body || '');
      const result = await generateFull(
        row.question_title, row.question_body || '',
        feedback, row.answer_text, lawCtx, qidRegen
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
        qidRegen, row.id, newVersion);
      return NextResponse.json({ ok: true });
    }

    // Reply인 경우 → 피드백으로 처리
    const replyTo = msg.reply_to_message;
    if (!replyTo?.text) {
      // 일반 메시지 → 안내 응답
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '안녕하세요 대표님! 👋\n\n' +
          '📌 사용법:\n' +
          '• *재생성* → 최신 답변 다시 생성\n' +
          '• *재생성 판례 추가해줘* → 맞춤 재생성\n' +
          '• 답변 알림 메시지에 *Reply* → 피드백 반영\n\n' +
          '새 답변은 30분마다 자동으로 오며,\n' +
          '지금 바로 받으려면 *재생성* 입력하세요! 🚀',
        parse_mode: 'Markdown'
      });
      return NextResponse.json({ ok: true });
    }

    // 원본 메시지에서 row ID 추출 또는 답변 스니펫으로 매칭
    let row: any = null;
    const idMatch = replyTo.text.match(/🆔 ([a-f0-9-]{36})/) || replyTo.text.match(/\?id=([a-f0-9-]{36})/);
    if (idMatch) {
      const { data } = await supabase.from('jisikin_answers').select('*').eq('id', idMatch[1]).single();
      row = data;
    }
    if (!row) {
      // 2번째 메시지(순수 답변 본문)에 Reply한 경우: 텍스트 앞부분으로 검색
      const snippet = replyTo.text.slice(0, 80).replace(/[%_]/g, '');
      const { data } = await supabase.from('jisikin_answers').select('*').ilike('answer_text', `%${snippet}%`).limit(1);
      if (data && data.length > 0) {
        row = data[0];
      }
    }
    if (!row) {
      // 그래도 없으면 가장 최근 draft 타겟팅
      const { data } = await supabase.from('jisikin_answers').select('*').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        row = data[0];
      }
    }

    if (!row) {
      await tg('sendMessage', { chat_id: chatId, text: '⚠️ 대상 질문을 찾을 수 없어요. 최신 질문 알림 후 다시 시도해주세요.' });
      return NextResponse.json({ ok: true });
    }
    const rowId = row.id;

    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    await tg('sendMessage', { chat_id: chatId, text: `✏️ 대표님 피드백 반영 중...\n"${rawText.slice(0, 50)}"` });

    const lawCtx = await fetchLawContext('공동주택관리법 제30조 장기수선충당금 임차인 반환');
    const qidFeedback = classifyQid(row.question_title, row.question_body || '');
    const result = await generateFull(row.question_title, row.question_body || '', rawText, row.answer_text, lawCtx, qidFeedback);
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
      qidFeedback, rowId, newVersion);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[secretary webhook]', err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let testSendResult = null;
  if (searchParams.get('test') === '1') {
    const res = await tg('sendMessage', {
      chat_id: 8865095008,
      text: '✨ [카리나] Vercel 클라우드 ➔ 텔레그램 정상 연결 확인 완료! 🚀'
    });
    testSendResult = await res.json().catch(e => ({ error: String(e) }));
  }

  return NextResponse.json({
    status: '비서봇 Webhook Active ✅',
    botTokenConfigured: !!BOT_TOKEN,
    botTokenPrefix: BOT_TOKEN ? BOT_TOKEN.slice(0, 8) + '...' : 'none',
    geminiKeyConfigured: !!GEMINI_KEY,
    supabaseConfigured: !!SB_KEY,
    testSendResult
  });
}
