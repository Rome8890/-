-- 1. 행동 추적 이벤트 테이블
CREATE TABLE tracking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    path TEXT,
    session_id UUID -- 추후 세션별 분석을 위해 추가 가능
);

-- 2. 사용자/조회 기록 테이블
CREATE TABLE search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    apartment_name TEXT,
    apartment_address TEXT,
    area FLOAT,
    months INTEGER,
    refund_amount BIGINT,
    user_contact TEXT -- 선택 사항
);

-- 3. 결제 기록 테이블
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    payment_method TEXT,
    document_url TEXT -- 생성된 PDF 링크
);

-- RLS (Row Level Security) 설정 (필요에 따라)
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert tracking events" ON tracking_events FOR INSERT WITH CHECK (true);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert search history" ON search_history FOR INSERT WITH CHECK (true);
