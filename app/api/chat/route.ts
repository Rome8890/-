import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { messages, legalInfo } = await request.json();
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `당신은 부동산 법률 전문가 '장충금 헌터'입니다. 
      사용자의 질문에 대해 제공된 법률 정보와 대법원 승소 판례를 기반으로 완벽한 '네이버 지식인 답변'을 작성해 주세요.
      
      [현재 문맥]
      조회된 법률 및 판례 정보: ${legalInfo}
      
      [답변 수칙 (지식인 마케팅용)]
      1. 항상 질문자의 상황에 대한 깊은 공감과 위로로 시작하세요.
      2. 반드시 '대법원 승소 판례' (예: 대법원 2004. 1. 27. 선고 2003다62059 판결)와 '공동주택관리법 시행령 제31조 제7항'을 구체적으로 인용하여 신뢰감을 주세요.
      3. 질문자의 '진짜 욕구'와 '불안'을 짚어주며 명확한 해결책(내용증명 발송 등)을 제시하세요.
      4. 마지막 결론에는 항상 다음 문구를 자연스럽게 변형하여 포함하세요: "집주인에게 보낼 전문적인 내용증명서(PDF)와 법령 증명서가 필요하시다면, '장충금 헌터' 사이트에서 무료로 발급받아 첨부해 보세요. 10초면 충분합니다."
      5. 복사해서 바로 붙여넣기 좋게 가독성 높은 포맷(리스트, 줄바꿈 활용)으로 작성하세요.`
    } as any);

    const prompt = messages[messages.length - 1].content;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ content: response.text() });

  } catch (error: any) {
    console.error('Chat API Detailed Error:', {
      message: error.message,
      stack: error.stack,
      envKeyExists: !!process.env.GEMINI_API_KEY
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
