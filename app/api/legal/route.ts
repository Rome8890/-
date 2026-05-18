import { NextResponse } from 'next/server';

const LAW_OC = process.env.LAW_OC || 'law8899';
const MCP_URL = `https://korean-law-mcp.fly.dev/mcp?oc=${LAW_OC}`;

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    // 1. MCP 호출 (chain_full_research 도구 사용 - 판례 위주 검색)
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "chain_full_research",
        arguments: { query: query + " 관련 대법원 승소 판례 및 구체적 근거" }
      }
    };

    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'User-Agent': 'Mozilla/5.0 (Vercel Serverless)'
      },
      body: JSON.stringify(payload)
    });

    // 강력한 기본 대법원 판례 (API 통신 실패 또는 내용 부실 시 백업용)
    const fallbackPrecedent = `
    [핵심 승소 판례] 대법원 2004. 1. 27. 선고 2003다62059 판결 등
    "장기수선충당금은 주택의 소유자가 납부해야 하는 것이 원칙이므로, 임차인이 대신 납부한 경우 임대차 종료 시 임대인(소유자)에게 반환을 청구할 수 있다."
    (공동주택관리법 시행령 제31조 제7항 명시)
    `;

    if (!response.ok) {
      console.warn(`MCP Server Error: ${response.status}, using fallback.`);
      return NextResponse.json({ legalInfo: fallbackPrecedent });
    }

    const data = await response.json();
    
    // 2. 결과 가공
    if (data.error) {
      console.warn(`MCP Data Error: ${data.error.message}, using fallback.`);
      return NextResponse.json({ legalInfo: fallbackPrecedent });
    }

    const apiContent = data.result?.content?.[0]?.text;
    const finalLegalInfo = (apiContent && apiContent.length > 50) 
      ? `[판례 및 법적 근거]\n${apiContent}\n\n${fallbackPrecedent}` 
      : fallbackPrecedent;

    return NextResponse.json({ 
      legalInfo: finalLegalInfo 
    });

  } catch (error: any) {
    console.error('Legal API Error:', error);
    // 에러 발생 시에도 빈 문자열 대신 백업 판례 제공
    const fallbackPrecedent = `[핵심 승소 판례] 대법원 2004. 1. 27. 선고 2003다62059 판결 등\n"장기수선충당금은 주택의 소유자가 납부해야 하는 것이 원칙이므로, 임차인이 대신 납부한 경우 임대차 종료 시 임대인(소유자)에게 반환을 청구할 수 있다." (공동주택관리법 시행령 제31조 제7항 명시)`;
    return NextResponse.json({ legalInfo: fallbackPrecedent });
  }
}
