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
    order_id TEXT UNIQUE,
    payment_key TEXT,
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

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert payments" ON payments FOR INSERT WITH CHECK (true);

-- ⚠️ 기존 테이블이 이미 생성된 경우 아래 마이그레이션 실행:
-- ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;
-- ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_key TEXT;

-- 4. 지식인 답변 동적 관리 테이블 (신규)
CREATE TABLE IF NOT EXISTS jisikin_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    question_url TEXT NOT NULL,
    question_title TEXT NOT NULL,
    question_body TEXT,
    answer_text TEXT NOT NULL,
    page_content JSONB DEFAULT '{}'::jsonb,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',  -- draft / approved / posted
    telegram_message_id TEXT
);

-- 서비스 링크로 조회할 수 있도록 RLS 허용
ALTER TABLE jisikin_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read answers" ON jisikin_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert answers" ON jisikin_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update answers" ON jisikin_answers FOR UPDATE USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jisikin_answers_updated_at
BEFORE UPDATE ON jisikin_answers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
