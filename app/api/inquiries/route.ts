import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://baqzsbcoljtlbvuxldgy.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcXpzYmNvbGp0bGJ2dXhsZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTMxMDIsImV4cCI6MjA5NDQ2OTEwMn0.HS67kRNosLHXX_jbcZZ-sAG6A2y1YLs4F2raB_AtaEk';
const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/v1/systemone';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// 장충금 핵심 법률 조문 답변 템플릿
const TEMPLATES: Record<string, string> = {
  calc_legal: `[장충금 헌터 법률 AI 답변]
공동주택관리법 제30조 제2항에 따라 임대차 기간 동안 납부하신 장기수선충당금은 전액 소유자(집주인)가 반환해야 하는 법적 강행규정입니다.

1️⃣ 반환 근거: 집주인의 반환 거부는 법률 위반이며, 특약으로도 배제할 수 없습니다.
2️⃣ 해결 절차: 관리사무소에서 '장기수선충당금 납부확인서'를 발급받아 집주인에게 청구하세요.
3️⃣ 필요 조치: 계속 거부 시 저희 사이트의 '법적 내용증명 서식'을 발급받아 발송하시면 승소율 95% 이상으로 신속히 돌려받으실 수 있습니다.`,

  billing_refund: `[결제·서식 지원팀 답변]
결제 및 PDF 다운로드 문의를 접수하였습니다. 결제 완료 건은 주문번호 확인 즉시 영수증 및 서식 열람 링크를 재발급해 드립니다. 고객센터(info@longtermrefund.site)로 주문자명을 남겨주시면 10분 내 우선 조치됩니다.`,

  tech_support: `[기술 지원팀 안내]
관리비 영수증 이미지 OCR 분석 오류나 사이트 이용 중 불편을 드려 죄송합니다. 사이트 상단의 [수기 간편 입력 모드]를 이용하시면 영수증 업로드 없이 거주 개월수만으로 3초 만에 예상 환급액을 바로 산출하실 수 있습니다.`,
};

// 1. 고객 문의 접수 및 즉시 답변 API (POST)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const senderName = (data.senderName || data.sender_name || '세입자').trim();
    const senderContact = (data.senderContact || data.sender_contact || '').trim();
    const subject = (data.subject || '장기수선충당금 상담').trim();
    const body = (data.body || '').trim();

    if (!body) {
      return NextResponse.json({ error: '문의 내용을 입력해 주세요.' }, { status: 400 });
    }

    let category = 'calc_legal';
    let confidence = 0.50;
    let disputeNoul = 0.5;
    let urgencyScore = 1.0;

    // 1단계: 로컬 Ollama System One 호출 시도 (0.2초 초고속 판단)
    try {
      const ollamaRes = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tev1:0.8b',
          state: { sender: senderName, subject, body },
          questions: {
            category: {
              type: 'choice',
              instructions: 'Classify the type of long-term repair reserve fund inquiry.',
              criteria: {
                calc_legal: 'Questions about refund calculation, legal claim forms, or landlord refusal',
                billing_refund: 'Service payment issues, receipts, or refund requests',
                tech_support: 'OCR receipt upload errors, PDF download bugs, login failure',
                partnership: 'B2B partnership offers',
                other: 'General inquiries, vague questions, or complex unverified disputes'
              }
            },
            dispute: {
              type: 'noul',
              instructions: 'Does the tenant explicitly face a dispute or refusal from the landlord/office to pay the refund?'
            },
            urgency: {
              type: 'score',
              instructions: 'How urgent is this inquiry?',
              criteria: ['Routine', 'Soon', 'Urgent']
            }
          }
        }),
        signal: AbortSignal.timeout(3000), // 3초 타임아웃
      });

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const answers = ollamaData.answers || {};
        category = answers.category?.choice || 'calc_legal';
        confidence = answers.category?.confidence ?? 0.50;
        disputeNoul = answers.dispute?.noul ?? 0.5;
        urgencyScore = answers.urgency?.score ?? 1.0;
      }
    } catch (e) {
      // Fallback: 키워드 기반 규칙 분석
      if (body.includes('결제') || body.includes('환불') || body.includes('영수증 재발급')) {
        category = 'billing_refund';
        confidence = 0.8;
      } else if (body.includes('에러') || body.includes('버그') || body.includes('업로드')) {
        category = 'tech_support';
        confidence = 0.8;
      } else if (body.includes('특약') || body.includes('소송') || body.includes('경매') || body.length > 150) {
        // 복합적이거나 긴 사안
        category = 'other';
        confidence = 0.25;
      } else {
        category = 'calc_legal';
        confidence = 0.65;
      }
    }

    // 2단계: 모호한 질문 또는 복합 분쟁 판별 (확신도 < 0.40 또는 category == 'other')
    const isAmbiguousOrComplex = confidence < 0.40 || category === 'other';

    let replyMessage = '';
    let isDelayed = false;

    if (isAmbiguousOrComplex) {
      isDelayed = true;
      replyMessage = `📋 [전문 법률 검토 사안 접수]
입력해주신 내용은 단순 질의를 넘어 임대인과의 복합 분쟁 및 특수 사실관계(특약·소송 등) 검토가 필요한 사안으로 분류되었습니다.

👑 현재 대표이사가 직접 관련 대법원 판례와 공동주택관리법 조항을 정밀 검토 중입니다.
⏱️ 약 3~5분 뒤에 본 채팅창으로 맞춤 대응 지침 및 서식을 안내해 드리겠습니다. 창을 닫지 않고 잠시만 기다려 주세요!`;
    } else {
      isDelayed = false;
      replyMessage = TEMPLATES[category] || TEMPLATES['calc_legal'];
    }

    // 3단계: Supabase 버퍼 큐에 영구 기록
    const trackingPayload = {
      event_type: 'customer_inquiry',
      user_agent: request.headers.get('user-agent') || 'web_chat_client',
      path: '/chat',
      metadata: {
        sender_name: senderName,
        sender_contact: senderContact,
        subject,
        body,
        category,
        confidence,
        status: isDelayed ? 'need_ceo_review' : 'completed',
        reply: replyMessage,
        is_delayed: isDelayed,
        created_at: new Date().toISOString(),
      },
    };

    fetch(`${SUPABASE_URL}/rest/v1/tracking_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(trackingPayload),
    }).catch(() => {});

    // 4단계: 클라이언트 채팅창으로 즉시 응답 반환!
    return NextResponse.json({
      success: true,
      sender: senderName,
      category,
      confidence,
      isDelayed,
      reply: replyMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
