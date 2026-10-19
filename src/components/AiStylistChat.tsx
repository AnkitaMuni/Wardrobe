import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, X, MessageSquare, ChevronUp } from 'lucide-react';
import { Garment } from '../types';

interface AiStylistChatProps {
  wardrobe: Garment[];
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiStylistChat: React.FC<AiStylistChatProps> = ({ wardrobe }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello Ankita! I am your personal Atelier AI stylist. I have indexed all ${wardrobe.length} items in your closet. Ask me anything like: "What should I wear to a dinner date?", "How do I style my linen shirt?", or "Is navy and black okay for an evening event?"`,
      timestamp: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const quickPrompts = [
    'How should I style my linen shirt?',
    'What should I wear for beach dinner?',
    'Show me an edgy street look',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('linen') || lower.includes('shirt')) {
        reply = `For your Breezy Crisp Linen Shirt, I recommend pairing it with your Pleated Sand Linen Trousers for that relaxed Saint-Tropez monochrome look, or with the Terracotta Linen Shorts for warm afternoon walks. Finish with the Handcrafted Jute Espadrilles!`;
      } else if (lower.includes('beach') || lower.includes('resort')) {
        reply = `For beachwear, you have 3 prime options in your closet: 1) The Crisp Linen Shirt + Sand Trousers + Raffia Basket Tote, 2) The Tiered Mediterranean Sundress with Espadrilles, or 3) The Olive Camp Collar Polo with Terracotta Drawstring Shorts. Keep footwear light with woven soles!`;
      } else if (lower.includes('date') || lower.includes('dinner')) {
        reply = `For date night, nothing beats your Mulberry Silk Champagne Blouse paired with the Bias-Cut Olive Midi Skirt and Strappy Gold Mules. If it gets chilly, drape your Washed Lambskin Biker Jacket over your shoulders for modern contrast.`;
      } else if (lower.includes('street') || lower.includes('edgy')) {
        reply = `Go with your Oversized Washed Charcoal Tee tucked casually into the Raw Selvedge Denim, layered under the Black Lambskin Biker Jacket, and finished with the Italian Calfskin Sneakers!`;
      } else {
        reply = `Based on your wardrobe palette (sand neutrals, ivory, olive sage, and deep black), you have wonderful flexibility. Pair relaxed silhouettes with structured shoes, and balance earthy tones with gold accent jewelry. You can also hop over to the "Occasion Stylist" tab to see 5 instant complete outfits!`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Concierge Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl hover:shadow-amber-500/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI Stylist</span>
        </button>
      )}

      {/* Slide-Up Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-[#161622] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in h-[520px]">
          {/* Header */}
          <div className="px-5 py-4 bg-black/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-white">Atelier AI Concierge</h4>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Styling Active ({wardrobe.length} Items)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-black font-medium'
                      : 'bg-white/5 border border-white/10 text-stone-200'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-black/60 font-mono' : 'text-stone-500 font-mono'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-black/40 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-[10px] whitespace-nowrap border border-white/10"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask styling advice for your closet..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
