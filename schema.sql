-- 테이블 생성
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author TEXT NOT NULL,
    avatar TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false
);

-- 초기 데이터 추가 (선택사항)
INSERT INTO public.posts (author, content, likes) VALUES 
('김철수', '다들 이번 학기 수고 많으셨습니다! 방학 잘 보내세요~', 12),
('이영희', '다음 주 개강 실화인가요... 벌써부터 피곤하네요 ㅠㅠ', 5),
('박지성', '오늘 점심 학식 메뉴 뭔지 아시는 분?', 0);

-- 보안 규칙 (RLS) 설정
-- 테스트 목적이므로 모두가 읽고 쓸 수 있도록 허용합니다. (실제 서비스 시에는 인증과 결합해야 함)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.posts
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Enable insert for all users" ON public.posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.posts
    FOR UPDATE USING (true);
