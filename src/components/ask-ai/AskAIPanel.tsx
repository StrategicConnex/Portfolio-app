'use client';
import { useAskAIStore } from '@/stores/ask-ai-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { useLanguage } from '@/context/LanguageContext';

export function AskAIPanel() {
  const { isOpen, setIsOpen } = useAskAIStore();
  const [expanded, setExpanded] = useState(false);
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ask-ai',
  });


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden ${
            expanded ? 'w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-w-4xl' : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-6rem)] sm:h-[640px] max-h-[80vh] sm:max-h-[85vh]'
          }`}
          style={{ borderRadius: '14px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-100">Ask Juan AI</span>
              <span className="text-xs text-slate-400">Copiloto de Ciberseguridad</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setExpanded(!expanded)}>
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Conversation Stream */}
          <Conversation>
            <ConversationContent>
               {messages.length === 0 ? (
                 <div className="text-center text-slate-400 mt-10 text-sm">Pregúntame sobre IT/OT, OSINT, DNS, SSL o mi experiencia.</div>
               ) : (
                 messages.map(m => (
                    <div key={m.id} className={`flex flex-col gap-1 mb-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-orange-500/20 text-orange-50 max-w-[80%]' : 'text-slate-200 max-w-full'}`}>
                        {m.content}
                      </div>
                   </div>
                 ))
               )}
            </ConversationContent>
          </Conversation>
          
          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/50">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Pregunta sobre IT/OT, ciberseguridad..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <Button type="submit" size="icon" className="absolute right-1.5 h-9 w-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
