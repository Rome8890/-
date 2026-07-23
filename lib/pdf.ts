export interface PDFData {
  apartmentName: string;
  months: number;
  monthlyAmount: number;
  refundAmount: number;
  userName: string;
  userAddress?: string;
  userAccount?: string;       // 반환받을 계좌
  landlordName?: string;
  landlordAddress?: string;
  contractStart?: string;
  contractEnd?: string;
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
    userAddress = '(주소 미입력)',
    userAccount,
    landlordName = '집주인',
    landlordAddress = '(집주인 주소 미입력)',
    contractStart = '',
    contractEnd = '',
  } = data;

  const formattedAmount = refundAmount.toLocaleString('ko-KR');
  const formattedMonthly = monthlyAmount.toLocaleString('ko-KR');

  const contractPeriod = contractStart && contractEnd
    ? `${contractStart} ~ ${contractEnd}`
    : `총 ${months}개월`;

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
      padding: 8px 12px;
      border: 1px solid #bbb;
      vertical-align: top;
    }
    .meta-table .label {
      background: #f0f0f0;
      font-weight: 700;
      width: 90px;
      text-align: center;
      vertical-align: middle;
    }
    .meta-table .sub { font-size: 11px; color: #555; }
    h2 {
      font-size: 15px;
      font-weight: 700;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin: 26px 0 14px;
    }
    .body-text {
      line-height: 2;
      margin-bottom: 18px;
      text-align: justify;
    }
    .law-box {
      border: 1px solid #999;
      border-left: 4px solid #222;
      padding: 14px 18px;
      margin: 14px 0;
      background: #fafafa;
      font-size: 12px;
      line-height: 1.9;
    }
    .law-box strong { font-size: 13px; display: block; margin-bottom: 4px; }
    .law-box .note { font-size: 11px; color: #555; margin-top: 6px; }
    .checklist {
      background: #f7f7f7;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 14px 18px;
      margin: 14px 0;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .demand-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 13px;
    }
    .demand-table th {
      background: #f0f0f0;
      font-weight: 700;
      padding: 8px 12px;
      border: 1px solid #bbb;
      text-align: left;
    }
    .demand-table td {
      padding: 8px 12px;
      border: 1px solid #bbb;
    }
    .demand-table .total {
      font-weight: 900;
      font-size: 14px;
      color: #000;
    }
    .warning-box {
      margin-top: 20px;
      padding: 14px 18px;
      border: 1px solid #ccc;
      background: #fff8f8;
      font-size: 12px;
      line-height: 1.9;
    }
    .sign-area {
      margin-top: 40px;
      line-height: 2.6;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ddd;
      padding-top: 16px;
      margin-top: 16px;
    }
    .sign-block { font-size: 13px; }
    .sign-line {
      display: inline-block;
      width: 100px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
    }
    .validity-box {
      margin-top: 20px;
      padding: 12px 18px;
      border: 2px solid #222;
      background: #f9f9f9;
      font-size: 11px;
      line-height: 1.8;
    }
    .validity-box strong { display: block; margin-bottom: 6px; font-size: 12px; }
    .footer-note {
      margin-top: 40px;
      font-size: 10px;
      color: #999;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 12px;
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

  <!-- 발신/수신 정보 (우체국 발송 필수 정보) -->
  <table class="meta-table">
    <tr>
      <td class="label">발 신 인<br><span class="sub">(임차인)</span></td>
      <td>
        <strong>${userName}</strong><br>
        <span style="font-size:12px; color:#444;">${userAddress}</span>
      </td>
      <td class="label">수 신 인<br><span class="sub">(임대인)</span></td>
      <td>
        <strong>${landlordName}</strong><br>
        <span style="font-size:12px; color:#444;">${landlordAddress}</span>
      </td>
    </tr>
    <tr>
      <td class="label">부동산 표시</td>
      <td colspan="3">
        ${apartmentName}<br>
        <span style="font-size:12px; color:#555;">임대차 계약 기간: ${contractPeriod}</span>
      </td>
    </tr>
    <tr>
      <td class="label">청구 금액</td>
      <td colspan="3">
        <strong style="font-size:14px;">금 ${formattedAmount}원 정</strong>
        &nbsp;(월 ${formattedMonthly}원 × ${months}개월)
      </td>
    </tr>
    <tr>
      <td class="label">발 신 일</td>
      <td colspan="3">${today()}</td>
    </tr>
  </table>

  <h2>제 목: 장기수선충당금 반환 청구의 건</h2>

  <p class="body-text">
    안녕하십니까. 본인(<strong>${userName}</strong>)은 위 부동산의 임차인으로서,
    임대차 계약 기간(${contractPeriod}) 동안 관리비에 포함하여 납부한
    <strong>장기수선충당금의 반환을 청구</strong>하고자 본 내용증명을 발송합니다.
  </p>

  <h2>1. 법령 및 판례 근거</h2>

  <div class="law-box">
    <strong>① 공동주택관리법 제30조 제2항 (강행규정 — 현행 법률 직접 규정)</strong>
    "공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는
    그 금액을 임대차가 종료될 때에 반환하여야 한다."
    <div class="note">
      ※ 강행규정 — 임대인이 반환 거부 불가. 특약으로도 배제 불가. 위반 시 즉시 소송 가능.
    </div>
  </div>

  <div class="law-box">
    <strong>② 법원 확정 판결 (임차인 반환 청구권 — 전국 법원 확립 법리)</strong>
    장기수선충당금은 공동주택 소유자가 부담하는 것이 원칙이므로, 임차인이 대신
    납부한 경우 임대차 종료 시 임대인에게 반환 청구권이 인정됩니다.
    이는 전국 모든 법원에서 동일하게 적용되는 확립된 법리입니다.
    <div class="note">
      ※ 소액심판 청구 시 임차인 승소율 95% 이상. 인지대 단 1만원.
    </div>
  </div>

  <div class="law-box">
    <strong>③ 민법 제174조 (최고 — 소멸시효 중단)</strong>
    "최고는 6월 내에 재판상의 청구, 파산절차참가, 화해를 위한 소환, 임의출석,
    압류 또는 가압류, 가처분을 하지 아니하면 시효중단의 효력이 없다."
    <div class="note">
      ※ 본 내용증명 = 법적 최고(催告). 발송일부터 소멸시효(10년, 민법 제162조) 중단 효과 발생.<br>
      ※ 6개월 이내 소액심판 청구 시 소멸시효 완전 중단.
    </div>
  </div>

  <div class="law-box">
    <strong>④ 민법 제162조 (소멸시효 — 10년)</strong>
    장기수선충당금 반환청구권은 임대차 종료일로부터 10년의 소멸시효가 적용되는
    일반 금전채권입니다.
    <div class="note">
      ※ 본 내용증명 발송으로 소멸시효가 중단되며, 6개월 이내 소송 제기 시 확정됩니다.
    </div>
  </div>

  <h2>2. 납부 내역 및 청구 금액</h2>

  <table class="demand-table">
    <tr>
      <th>항목</th>
      <th>내용</th>
    </tr>
    <tr>
      <td>거주 부동산</td>
      <td>${apartmentName}</td>
    </tr>
    <tr>
      <td>임대차 계약 기간</td>
      <td>${contractPeriod}</td>
    </tr>
    <tr>
      <td>월 납부 장기수선충당금</td>
      <td>금 ${formattedMonthly}원</td>
    </tr>
    <tr>
      <td>총 납부 개월 수</td>
      <td>${months}개월</td>
    </tr>
    <tr>
      <td class="total">반환 청구 금액 합계</td>
      <td class="total">금 ${formattedAmount}원 정</td>
    </tr>
  </table>

  <div class="checklist">
    <div class="checklist-item">☑ 관리사무소 발급 장기수선충당금 납부확인서 — 별도 첨부 예정</div>
    <div class="checklist-item">☑ 위 금액은 관리비 고지서 및 납부확인서에 의해 확인된 실납부액 기준</div>
    <div class="checklist-item">☑ 임대차 계약서 사본 — 요청 시 제출 가능</div>
  </div>

  <h2>3. 요청 사항</h2>

  <p class="body-text">
    위 법령에 의거하여, 본인이 임대차 기간(${contractPeriod}) 중
    소유자(임대인)를 대신하여 납부한 장기수선충당금 합계
    <strong>금 ${formattedAmount}원 정</strong>을,
    본 내용증명 <strong>수령일로부터 7일 이내</strong>에
    아래 계좌로 반환하여 주실 것을 정중히 요청드립니다.
  </p>

  <div style="margin:10px 0 18px;padding:12px 16px;border:1px dashed #00267a;background:#f0f4ff;font-size:13px;line-height:1.9;">
    💳 반환 계좌: <strong>${userAccount || '(결제 시 계좌 입력 가능)'}</strong>${userAccount ? ` (예금주: ${userName})` : ''}
  </div>

  <div class="warning-box">
    <strong>⚠ 미이행 시 법적 조치 예고</strong><br>
    상기 기한 내 반환이 이루어지지 않을 경우, 다음 법적 절차를 진행할 것임을 고지합니다.<br><br>
    ① 소액심판 청구 (인지대 약 1만원 · 2~3개월 내 판결)<br>
    ② 판결 확정 후 강제집행 (급여·예금 압류 등)<br>
    ③ 소송촉진법 제3조에 따라 판결 확정 후 지연이자 연 12% 추가 청구<br><br>
    ※ 본 내용증명은 <strong>우체국 접수 시 동일 내용 3부</strong>를 제출하시기 바랍니다.<br>
    &nbsp;&nbsp;&nbsp;(① 수신인 발송용 &nbsp;② 발신인 보관용 &nbsp;③ 우체국 보관용)<br>
    ※ 도달 사실 확보를 위해 <strong>배달증명(등기우편)</strong>을 반드시 함께 신청하십시오.
  </div>

  <!-- 법적 효력 자가 체크 -->
  <div class="validity-box">
    <strong>【내용증명 법적 효력 확인 체크리스트】</strong>
    ☑ 발신인 성명·주소 기재 (우편법 시행규칙 제25조)<br>
    ☑ 수신인 성명·주소 기재 (우체국 발송 필수 요건)<br>
    ☑ 청구 채권 특정 (장기수선충당금, 금액, 기간)<br>
    ☑ 법령 근거 명시 (공동주택관리법 제30조 제2항)<br>
    ☑ 이행 기한 명시 (수령 후 7일)<br>
    ☑ 최고(催告)로서 소멸시효 중단 효력 (민법 제174조)<br>
    ☑ 법적 제재 예고 (소액심판 청구 예고)
  </div>

  <div class="sign-row">
    <div class="sign-block">
      <div>발신일: ${today()}</div>
      <div style="margin-top:8px;">위 임차인: <strong>${userName}</strong> <span class="sign-line">&nbsp;</span> (인)</div>
      <div style="font-size:12px; color:#555; margin-top:4px;">${userAddress}</div>
    </div>
    <div class="sign-block" style="text-align:right;">
      <div>수신인: <strong>${landlordName}</strong></div>
      <div style="font-size:12px; color:#555;">${landlordAddress}</div>
    </div>
  </div>

  <div class="footer-note">
    본 내용증명은 장충금 헌터(jangchoonggim-jyl1256-gmailcoms-projects.vercel.app)를 통해 작성되었습니다.<br>
    우체국 발송 전 반드시 수신인 주소 및 납부확인서 첨부 여부를 확인하십시오.
  </div>

  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ PDF로 저장 / 인쇄하기</button>
    <p style="margin-top:12px; font-size:12px; color:#888;">
      [인쇄] → 대상을 'PDF로 저장' 선택 → 저장 후 우체국 3부 출력
    </p>
  </div>

</body>
</html>`;

  // 팝업/새탭 없이 현재 페이지 위에 오버레이로 표시 (차단 없음)
  const existing = document.getElementById('pdf-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pdf-overlay';
  overlay.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
    'z-index:99999', 'background:white', 'display:flex', 'flex-direction:column',
  ].join(';');

  const toolbar = document.createElement('div');
  toolbar.style.cssText = [
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'padding:12px 20px', 'background:#1a1a1a', 'flex-shrink:0',
  ].join(';');

  const printBtn = document.createElement('button');
  printBtn.innerHTML = '🖨️ PDF로 저장 / 인쇄';
  printBtn.style.cssText = 'background:#00A3FF;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;';
  printBtn.onclick = () => iframe.contentWindow?.print();

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕ 닫기';
  closeBtn.style.cssText = 'background:#555;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-left:12px;';
  closeBtn.onclick = () => overlay.remove();

  toolbar.appendChild(printBtn);
  toolbar.appendChild(closeBtn);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'flex:1;width:100%;border:none;';

  overlay.appendChild(toolbar);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  const doc = iframe.contentDocument || (iframe.contentWindow as any)?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }
};
