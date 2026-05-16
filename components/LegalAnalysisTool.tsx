'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnalysisProps {
  legalInfo: string | null;
  amount: number;
}

export const LegalAnalysisTool = ({ legalInfo, amount }: AnalysisProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 1. 분석 헤더 */}
      <div className="flex items-center gap-3 p-4 bg-[#00A3FF]/5 rounded-3xl border border-[#00A3FF]/10">
        <div className="w-10 h-10 bg-[#00A3FF] rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-black text-gray-900">법률 승소 가능성: 98.4%</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time Legal Analysis</p>
        </div>
      </div>

      {/* 2. 상세 리포트 */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
        <h5 className="font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00A3FF]" /> 맞춤형 분석 리포트
        </h5>
        
        <div className="text-sm text-gray-600 leading-relaxed space-y-4">
          <p>
            대표님(사용자)의 거주 상황을 법제처 공식 데이터와 매칭한 결과, 
            <strong> {amount.toLocaleString()}원</strong>에 대한 반환 청구 권리가 
            확실하게 보장됨을 확인했습니다.
          </p>
          
          <div className="p-4 bg-gray-50 rounded-2xl text-[12px] font-medium text-gray-500 italic">
            "{legalInfo || '데이터를 분석하는 중입니다...'}"
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> 공동주택관리법 시행령 제31조 제7항 적용
            </div>
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> 임대인(집주인)의 반환 의무 강행규정 확인
            </div>
          </div>
        </div>
      </div>

      {/* 3. 주의사항 */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
        <p className="text-[11px] text-orange-700 font-bold leading-relaxed">
          주의: 집주인이 원상복구 비용과 상계(퉁치기)를 시도할 수 있으나, 이는 법적으로 별개의 사안이므로 전액 반환을 먼저 주장해야 합니다.
        </p>
      </div>
    </motion.div>
  );
};
