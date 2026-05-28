export interface PDFData {
  apartmentName: string;
  months: number;
  monthlyAmount: number;
  refundAmount: number;
  userName: string;
  landlordName?: string;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export const generateKoreanPDF = (data: PDFData) => {
  const {
    apartmentName,
    months,
    monthlyAmount,
    refundAmount,
    userName,
    landlordName = '집주인 귀하',
  } = data;

  const formattedAmount = refundAmount.toLocaleString('ko-KR');
  const formattedMonthly = monthlyAmount.toLocaleString('ko-KR');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>장기수선충당금 반환 청구 내용증명</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', '맑은 고딕', sans-serif;
      font-size: 13px;
      line-height: 1.8;
      color: #111;
      background: #fff;
      padding: 40px 60px;
    }
    .stamp-bar {
      text-align: center;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 6px;
      border: 3px double #000;
      padding: 14px 0;
      margin-bottom: 32px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .meta-table td {
      padding: 7px 12px;
      border: 1px solid #ccc;
    }
    .meta-table .label {
      background: #f5f5f5;
      font-weight: 700;
      width: 100px;
      text-align: center;
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin: 24px 0 14px;
    }
    .body-text {
      line-height: 2;
      margin-bottom: 18px;
      text-align: justify;
    }
    .law-box {
      border: 1px solid #999;
      border-left: 4px solid #333;
      padding: 14px 18px;
      margin: 16px 0;
      background: #fafafa;
      font-size: 12px;
    }
    .law-box strong { font-size: 13px; }
    .demand-list {
      margin: 10px 0 10px 20px;
      line-height: 2.2;
    }
    .warning-box {
      margin-top: 20px;
      padding: 14px 18px;
      border: 1px solid #ccc;
      background: #fff8f8;
      font-size: 12px;
    }
    .sign-area {
      margin-top: 40px;
      text-align: right;
      line-height: 2.4;
    }
    .sign-area .date { font-size: 13px; }
    .sign-area .name { font-size: 14px; font-weight: 700; }
    .sign-line {
      display: inline-block;
      width: 120px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
    }
    .footer-note {
      margin-top: 50px;
      font-size: 11px;
      color: #777;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 14px;
    }
    .no-print { margin-top: 30px; text-align: center; }
    .print-btn {
      padding: 14px 40px;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-family: 'Noto Sans KR', sans-serif;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 1px;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 20px 30px; }
    }
  </style>
</head>
<body>

  <div class="stamp-bar">내 용 증 명</div>

  <table class="meta-table">
    <tr>
      <td class="label">발 신 인</td>
      <td>${userName} (임차인)</td>
      <td class="label">수 신 인</td>
      <td>${landlordName} (임대인)</td>
    </tr>
    <tr>
      <td class="label">부동산 표시</td>
      <td>${apartmentName}</td>
      <td class="label">발 신 일</td>
      <td>${today()}</td>
    </tr>
    <tr>
      <td class="label">청구 금액</td>
      <td colspan="3"><strong>금 ${formattedAmount}원 정</strong> (${months}개월 × 월 ${formattedMonthly}원)</td>
    </tr>
  </table>

  <h2>제 목: 장기수선충당금 반환 청구의 건</h2>

  <p class="body-text">
    안녕하십니까. 본인은 위 부동산의 임차인으로서 임대차 계약 기간 동안 관리비에 포함되어
    납부한 <strong>장기수선충당금의 반환을 청구</strong>하기 위해 본 내용증명을 발송합니다.
  </p>

  <h2>1. 법령 및 판례 근거</h2>

  <div class="law-box">
    <strong>① 공동주택관리법 제30조 제2항 (현행 법률 직접 규정)</strong><br>
    "공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는
    그 금액을 임대차가 종료될 때에 반환하여야 한다."<br>
    <em style="font-size:11px; color:#555;">※ 강행규정 — 임대인이 반환 거부 불가, 특약으로도 배제 불가</em>
  </div>

  <div class="law-box">
    <strong>② 법원 확정 판결 (임차인 반환 청구권 확립)</strong><br>
    장기수선충당금은 소유자 부담이 원칙이므로, 임차인이 납부한 경우
    임대차계약 종료 시 임대인에게 반환 청구 가능함이 법원 판결로 확립되어 있습니다.
    전국 법원에서 동일하게 적용됩니다.
  </div>

  <div class="law-box">
    <strong>③ 민법 제174조 (최고 — 소멸시효 중단)</strong><br>
    "최고는 6월 내에 재판상의 청구, 파산절차참가, 화해를 위한 소환, 임의출석,
    압류 또는 가압류, 가처분을 하지 아니하면 시효중단의 효력이 없다."<br>
    <em style="font-size:11px; color:#555;">※ 본 내용증명 = 최고(催告) → 발송일부터 소멸시효 중단 효과 발생</em>
  </div>

  <h2>2. 청구 내역</h2>

  <ul class="demand-list">
    <li>거주 부동산: ${apartmentName}</li>
    <li>임대차 기간 중 납부한 장기수선충당금: 월 ${formattedMonthly}원</li>
    <li>총 납부 개월 수: ${months}개월</li>
    <li>반환 청구 금액: <strong>금 ${formattedAmount}원 정</strong></li>
  </ul>

  <h2>3. 요청 사항</h2>

  <p class="body-text">
    위 법령 및 대법원 판례에 의거하여, 본인이 임대차 기간 중 대신 납부한 장기수선충당금
    합계 <strong>금 ${formattedAmount}원</strong>을 본 내용증명 수령일로부터
    <strong>7일 이내</strong>에 반환하여 주실 것을 정중히 요청드립니다.
  </p>

  <div class="warning-box">
    ※ 상기 기한 내 반환이 이루어지지 않을 경우, 소액심판 청구(인지대 1만원)
    등 법적 절차를 진행할 수밖에 없음을 알려드립니다.<br><br>
    ※ 본 내용증명은 <strong>우체국 접수 시 3부 작성</strong>하여 제출하시기 바랍니다.
    (① 수신인 발송용 1부 &nbsp;② 발신인 보관용 1부 &nbsp;③ 우체국 보관용 1부)<br>
    도달 사실 확보를 위해 <strong>배달증명(등기우편)</strong>을 함께 신청하시기 바랍니다.
  </div>

  <div class="sign-area">
    <div class="date">발신일: ${today()}</div>
    <div class="name">임차인: ${userName} <span class="sign-line">&nbsp;</span> (인)</div>
  </div>

  <div class="footer-note">
    본 내용증명은 장충금 헌터 (jangchoonggim-jyl1256-gmailcoms-projects.vercel.app) 를 통해 발급되었습니다.
  </div>

  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ PDF로 저장 / 인쇄하기</button>
    <p style="margin-top:12px; font-size:12px; color:#888;">
      [인쇄] 버튼 → 대상을 'PDF로 저장'으로 선택 → 저장
    </p>
  </div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=850,height=1100');
  if (printWindow) {
    printWindow.addEventListener('load', () => URL.revokeObjectURL(url));
  }
};
