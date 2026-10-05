'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Scale, Clock, ShieldCheck, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isDelayed?: boolean;
}

export function InquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '안녕하세요! 장충금 헌터 AI 법률 비서입니다. ✨\n\n이사 나가면서 집주인이 장기수선충당금 반환을 거부하거나, 환급 금액 계산 및 내용증명 발급에 대해 궁금하신 점을 말씀해 주세요. 1초 만에 법률 및 판례를 분석해 드립니다!',
      time: '방금',
    },
  ]);

  const quickChips = [
    '집주인이 장충금 안 준다고 버티는데 어떡하죠?',
    '2년 살았는데 환급액 대략 얼마 정도 나오나요?',
    '계약서 특약에 임차인 부담이라고 적혀있는데 무효인가요?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: senderName || '세입자',
          senderContact: '',
          subject: text.slice(0, 30),
          body: text,
        }),
      });

      const data = await res.json();
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || '답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        time: data.timestamp || userTime,
        isDelayed: data.isDelayed,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '죄송합니다. 네트워크 일시 오류가 발생했습니다. 잠시 후 다시 질문해 주세요.',
          time: userTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 우측 하단 플로팅 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-full shadow-2xl shadow-amber-500/30 border border-amber-300 transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <MessageSquare className="w-5 h-5 text-slate-950" />
        <span className="text-sm tracking-tight">1초 실시간 AI 상담</span>
      </button>

      {/* 팝업 실시간 채팅 모달 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md h-[580px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* 채팅창 헤더 */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      장충금 헌터 AI 법률 비서
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">공동주택관리법·대법원 승소 판례 실시간 연동</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 채팅 메시지 영역 */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900/90">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                          : m.isDelayed
                          ? 'bg-rose-950/40 border border-rose-500/30 text-rose-100 rounded-tl-none'
                          : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-500 px-1 mt-1 font-mono">{m.time}</span>
                  </div>
                ))}

                {/* 로딩 인디케이터 */}
                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-amber-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>AI 법률 판단 및 판례 분석 중...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 퀵 칩 영역 (질문 예시) */}
              <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 overflow-x-auto flex gap-1.5 no-scrollbar">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    disabled={loading}
                    className="shrink-0 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* 입력창 푸터 */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="궁금하신 내용을 입력하세요..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
