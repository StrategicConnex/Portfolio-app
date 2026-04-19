'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X as CloseIcon, Send, Sparkles, Bot, User } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente IA de Juan. ¿En qué puedo ayudarte hoy? Puedo contarte sobre su experiencia, tecnologías o proyectos.' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const data = await response.json()
      
      if (data.choices && data.choices[0]) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }])
      } else {
        throw new Error('Invalid response from API')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#1E90FF',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(30, 144, 255, 0.4)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isOpen ? <CloseIcon size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '0',
              width: 'min(400px, 90vw)',
              height: '500px',
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(to bottom, rgba(30, 144, 255, 0.05), transparent)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ p: '16px', padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(30, 144, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(30, 144, 255, 0.2)' }}>
                <Sparkles size={20} style={{ color: '#1E90FF' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', margin: 0 }}>Juan's AI Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: '10px', color: '#1E90FF', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>En línea</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: msg.role === 'user' ? '#334155' : 'rgba(30, 144, 255, 0.1)', border: msg.role === 'user' ? 'none' : '1px solid rgba(30, 144, 255, 0.2)' }}>
                      {msg.role === 'user' ? <User size={14} style={{ color: '#cbd5e1' }} /> : <Bot size={14} style={{ color: '#1E90FF' }} />}
                    </div>
                    <div style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      backgroundColor: msg.role === 'user' ? '#1E90FF' : 'rgba(255, 255, 255, 0.05)',
                      color: msg.role === 'user' ? 'white' : '#cbd5e1',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderTopRightRadius: msg.role === 'user' ? '0' : '12px',
                      borderTopLeftRadius: msg.role === 'user' ? '12px' : '0'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(30, 144, 255, 0.1)', border: '1px solid rgba(30, 144, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={14} style={{ color: '#1E90FF' }} />
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '12px', borderTopLeftRadius: '0', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', backgroundColor: '#1E90FF', borderRadius: '50%' }} />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '6px', height: '6px', backgroundColor: '#1E90FF', borderRadius: '50%' }} />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '6px', height: '6px', backgroundColor: '#1E90FF', borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregunta sobre Juan..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 48px 12px 16px',
                    fontSize: '14px',
                    color: 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    color: !input.trim() || isLoading ? '#475569' : '#1E90FF',
                    cursor: !input.trim() || isLoading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
              <p style={{ fontSize: '9px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                IA para perfiles IT/OT · OpenRouter API
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
