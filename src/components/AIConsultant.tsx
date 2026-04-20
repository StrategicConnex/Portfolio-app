'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Types ─── */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

const AIConsultant = () => {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  
  // Initial message is localized
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('ai.welcome') }
  ])
  
  // Update initial message when language changes if it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: t('ai.welcome') }])
    }
  }, [language, t])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          language: language // Pass current language to AI
        })
      })

      if (!response.ok) throw new Error('API request failed')
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No reader available')

      // Add actual assistant message that will be updated
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setIsLoading(false)

      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          const message = line.replace(/^data: /, '')
          if (message === '[DONE]') continue

          try {
            const parsed = JSON.parse(message)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              streamedContent += content
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: streamedContent
                }
                return newMessages
              })
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: t('ai.error') }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.5)] transition-all border border-white/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="text-white" size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <MessageSquare className="text-white" size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Unread indicator / Pulse */}
        {!isOpen && messages.length === 1 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-sm border-2 border-[#030712] animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[100] w-[min(90vw,380px)] h-[500px] bg-[#0A1628] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Bot className="text-blue-500" size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nacho Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-medium">{t('ai.subtitle')}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label={t('ai.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border ${
                      msg.role === 'assistant' 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' 
                        : 'bg-slate-700/30 border-white/10 text-slate-400'
                    }`}>
                      {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-[0.82rem] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                    <div className="bg-white/5 p-3 px-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 bg-[#030712] rounded-xl p-1.5 border border-white/10 focus-within:border-blue-500/50 transition-colors"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('ai.placeholder')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[0.82rem] text-slate-200 px-2 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="mt-2 text-[0.62rem] text-center text-slate-600 font-medium">
                {t('ai.footer')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(AIConsultant)
