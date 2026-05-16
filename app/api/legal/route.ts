import { NextResponse } from 'next/server';

const LAW_OC = process.env.LAW_OC || 'law8899';
const MCP_URL = `https://korean-law-mcp.fly.dev/mcp?oc=${LAW_OC}`;

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    // 1. MCP 호출 (chain_full_research 도구 사용)
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "chain_full_research",
        arguments: { query }
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

    if (!response.ok) {
      throw new Error(`MCP Server Error: ${response.status}`);
    }

    const data = await response.json();
    
    // 2. 결과 가공
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      legalInfo: data.result?.content?.[0]?.text || "법률 정보를 찾을 수 없습니다." 
    });

  } catch (error: any) {
    console.error('Legal API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
