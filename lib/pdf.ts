import { jsPDF } from 'jspdf';

/**
 * 내용증명 PDF 생성 함수
 */
export const generateContentProof = (data: {
  apartment: string,
  amount: string,
  period: string,
  userName: string,
  landlordName: string
}) => {
  const doc = new jsPDF();
  
  // 폰트 설정 (한글 폰트 추가가 필요할 수 있으나 기본적으로 영문/숫자 위주 테스트)
  // 실제 서비스 시에는 한글 폰트(NotoSans 등)를 base64로 인코딩하여 추가해야 함
  
  doc.setFontSize(22);
  doc.text('CONTENT PROOF (내용증명)', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Receiver (Landlord): ${data.landlordName}`, 20, 40);
  doc.text(`Sender (Tenant): ${data.userName}`, 20, 50);
  
  doc.setFontSize(16);
  doc.text('Subject: Request for Refund of Long-term Maintenance Fund', 20, 70);
  
  doc.setFontSize(12);
  const content = `
  1. Apartment: ${data.apartment}
  2. Period of Residence: ${data.period}
  3. Total Amount: ${data.amount} KRW
  
  According to Article 31, Paragraph 7 of the Multi-Family Housing Management Act, 
  the Long-term Repair Maintenance Fund must be borne by the owner of the house.
  
  Please refund the above amount within 7 days.
  `;
  
  doc.text(content, 20, 90);
  
  doc.save('JangChungGeum_Refund_Request.pdf');
};

/**
 * 법령 증명서 PDF 생성 함수
 */
export const generateLegalBasis = (legalInfo: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text('LEGAL BASIS CERTIFICATE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('This document confirms the legal basis for the refund claim.', 20, 40);
  
  doc.setFontSize(10);
  const splitInfo = doc.splitTextToSize(legalInfo, 170);
  doc.text(splitInfo, 20, 60);
  
  doc.save('Legal_Basis_Certificate.pdf');
};
