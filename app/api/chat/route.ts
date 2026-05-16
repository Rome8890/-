import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { messages, legalInfo } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `당신은 부동산 법률 전문가 '장충금 헌터'입니다. 
      사용자의 질문에 대해 법제처 데이터와 공동주택관리법을 기반으로 답변합니다.
      
      [현재 문맥]
      조회된 법률 정보: ${legalInfo}
      
      [답변 수칙]
      1. 항상 공감으로 시작하세요.
      2. '공동주택관리법 시행령 제31조 제7항'을 강조하세요.
      3. 질문자의 '진짜 욕구'와 '불안'을 짚어주며 해결책을 제시하세요.
      4. 신뢰감 있는 전문가 톤을 유지하세요.`
    });

    const prompt = messages[messages.length - 1].content;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ content: response.text() });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
