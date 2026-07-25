'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogOut, Users, MousePointerClick, CreditCard, TrendingUp } from 'lucide-react';

type EventRow = {
  id: number;
  event_type: string;
  metadata: Record<string, any>;
  user_agent: string;
  path: string;
  created_at: string;
};

function deviceLabel(ua: string) {
  if (/iPhone|Android.*Mobile/.test(ua)) return '📱 모바일';
  if (/iPad|Android/.test(ua)) return '📟 태블릿';
  return '💻 데스크탑';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function fmtKrw(n: number) {
  return n ? `${n.toLocaleString('ko-KR')}원` : '-';
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ background: color + '20', color, borderRadius: '8px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'click_payment' | 'payment_success' | 'click_calculate'>('all');
  const [showDev, setShowDev] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchEvents = useCallback(async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setEvents(json.data ?? []);
      setLastRefresh(new Date());
      setAuthed(true);
    } catch (e: any) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 30초마다 자동 갱신
  useEffect(() => {
    if (!authed || !password) return;
    const timer = setInterval(() => fetchEvents(password), 30000);
    return () => clearInterval(timer);
  }, [authed, password, fetchEvents]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(password);
  };

  // 필터링
  const visible = events.filter(ev => {
    if (!showDev && ev.metadata?.is_dev) return false;
    if (filter !== 'all' && ev.event_type !== filter) return false;
    return true;
  });

  // 통계 (개발자 제외)
  const realEvents = events.filter(ev => !ev.metadata?.is_dev);
  const today = new Date().toDateString();
  const todayReal = realEvents.filter(ev => new Date(ev.created_at).toDateString() === today);
  const uniqueSessions = new Set(realEvents.map(ev => ev.metadata?.session_id).filter(Boolean)).size;
  const paymentClicks = realEvents.filter(ev => ev.event_type === 'click_payment').length;
  const paymentSuccess = realEvents.filter(ev => ev.event_type === 'payment_success').length;
  const calcClicks = realEvents.filter(ev => ev.event_type === 'click_calculate').length;
  const convRate = paymentClicks > 0 ? ((paymentSuccess / paymentClicks) * 100).toFixed(0) : '0';

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>Admin Dashboard</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Boro Refund 전용</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
              style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '1.5px solid #d1d5db', borderRadius: '10px', outline: 'none', marginBottom: '12px', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#0001bb')}
              onBlur={e => (e.target.style.borderColor = '#d1d5db')}
            />
            {error && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '10px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0001bb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '확인 중...' : '입장'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>

      {/* 헤더 */}
      <div style={{ background: '#0001bb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>Boro Refund · Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>
            {lastRefresh ? `최근 갱신: ${lastRefresh.toLocaleTimeString('ko-KR')} · 30초마다 자동 갱신` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchEvents(password)} disabled={loading}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <RefreshCw size={13} /> 새로고침
          </button>
          <button onClick={() => { setAuthed(false); setPassword(''); }}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <LogOut size={13} /> 로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <StatCard icon={<Users size={16} />} label="고유 세션 (7일)" value={uniqueSessions} sub="개발자 제외" color="#0001bb" />
          <StatCard icon={<MousePointerClick size={16} />} label="계산 완료 (7일)" value={calcClicks} sub="실제 사용자" color="#7c3aed" />
          <StatCard icon={<CreditCard size={16} />} label="결제 버튼 클릭" value={paymentClicks} sub={`오늘 ${todayReal.filter(e=>e.event_type==='click_payment').length}건`} color="#dc2626" />
          <StatCard icon={<TrendingUp size={16} />} label="실제 결제 성공" value={`${paymentSuccess}건 (${convRate}%)`} sub="클릭 → 결제 전환율" color="#059669" />
        </div>

        {/* 필터 바 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([
              { key: 'all', label: '전체' },
              { key: 'click_payment', label: '💳 결제 클릭' },
              { key: 'payment_success', label: '✅ 결제 성공' },
              { key: 'click_calculate', label: '🧮 계산 완료' },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, border: '1.5px solid', borderRadius: '20px', cursor: 'pointer',
                  background: filter === key ? '#0001bb' : '#fff',
                  color: filter === key ? '#fff' : '#374151',
                  borderColor: filter === key ? '#0001bb' : '#d1d5db' }}>
                {label}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
            <input type="checkbox" checked={showDev} onChange={e => setShowDev(e.target.checked)} />
            개발자 포함 ({events.filter(e => e.metadata?.is_dev).length}건)
          </label>
        </div>

        {/* 이벤트 테이블 */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>이벤트 로그</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{visible.length}건 표시</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {visible.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                {loading ? '불러오는 중...' : '이벤트가 없습니다'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    {['시간', '이벤트', '언어', '환급액', '세션 ID', '기기', '유입경로'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((ev, i) => {
                    const isDev = ev.metadata?.is_dev;
                    const isPayment = ev.event_type === 'click_payment';
                    const isSuccess = ev.event_type === 'payment_success';
                    return (
                      <tr key={ev.id ?? i} style={{
                        borderBottom: '1px solid #f9fafb',
                        background: isDev ? '#fafafa' : isSuccess ? '#f0fdf4' : isPayment ? '#fef9c3' : '#fff',
                        opacity: isDev ? 0.5 : 1,
                      }}>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                          {timeAgo(ev.created_at)}
                        </td>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '12px', padding: '3px 8px', borderRadius: '6px',
                            background: isSuccess ? '#dcfce7' : isPayment ? '#fef9c3' : '#f3f4f6',
                            color: isSuccess ? '#15803d' : isPayment ? '#92400e' : '#374151',
                          }}>
                            {isSuccess ? '✅ 결제완료' : isPayment ? '💳 결제클릭' : ev.event_type}
                          </span>
                          {isDev && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#9ca3af' }}>dev</span>}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#374151' }}>
                          {ev.metadata?.lang === 'en' ? '🌍 EN' : '🇰🇷 KO'}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: isPayment || isSuccess ? '#0001bb' : '#374151', whiteSpace: 'nowrap' }}>
                          {fmtKrw(ev.metadata?.refund_total)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}>
                          {ev.metadata?.session_id ? ev.metadata.session_id.slice(0, 10) + '…' : '-'}
                        </td>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                          {deviceLabel(ev.user_agent || '')}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '11px', color: '#6b7280', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.metadata?.referrer ? new URL(ev.metadata.referrer).hostname : '직접 방문'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 개발자 모드 설정 안내 */}
        <div style={{ marginTop: '20px', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '14px 18px', fontSize: '12px', color: '#3730a3' }}>
          <strong>💡 내 방문을 개발자로 표시하는 법</strong> — 사이트에서 브라우저 콘솔 열고:<br />
          <code style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>localStorage.setItem('jcg_dev', '1')</code>
          &nbsp;입력 후 Enter → 이후 내 클릭은 "dev" 태그 붙어서 구분됩니다.
        </div>
      </div>
    </div>
  );
}
