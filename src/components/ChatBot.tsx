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
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Nacho Assistant, el compañero IA de Juan. ¿En qué puedo ayudarte hoy? Consultame sobre su experiencia en Oil & Gas, ciberseguridad industrial o disponibilidad.' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    console.log("ChatBot mounted successfully")
  }, [])

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
      console.log('Sending messages to API:', [...messages, userMessage]);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Response Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      console.log('API Response Success:', data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }])
      } else {
        console.error('Invalid API response format:', data);
        throw new Error('Invalid response from API');
      }
    } catch (error: any) {
      console.error('Chat error detail:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Mantenimiento de Sistema: ${error.message || 'Error desconocido'}. Por favor, verifica tu conexión o intenta más tarde.` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div 
      className="chatbot-container"
      style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px', 
        zIndex: 99999,
        display: 'block'
      }}
    >
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isOpen ? <CloseIcon size={28} /> : <MessageSquare size={28} />}
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
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
              height: '550px',
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(to bottom, rgba(37, 99, 235, 0.05), transparent)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(37, 99, 235, 0.1)' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.2)', overflow: 'hidden', border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                <Image 
                  src="/nacho-avatar.png" 
                  alt="Nacho Assistant" 
                  width={45} 
                  height={45} 
                  className="object-cover"
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '0.5px' }}>Nacho Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>En Línea · v3.0</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}
              className="custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px', maxWidth: '88%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{ 
                      width: '34px', 
                      height: '34px', 
                      borderRadius: '50%', 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      backgroundColor: msg.role === 'user' ? '#1e293b' : 'rgba(37, 99, 235, 0.15)', 
                      border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(37, 99, 235, 0.3)',
                      overflow: 'hidden'
                    }}>
                      {msg.role === 'user' ? <User size={16} style={{ color: '#94a3b8' }} /> : <Image src="/nacho-avatar.png" alt="Nacho" width={34} height={34} className="object-cover" />}
                    </div>
                    <div style={{ 
                      padding: '14px', 
                      borderRadius: '18px', 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      backgroundColor: msg.role === 'user' ? '#2563eb' : 'rgba(255, 255, 255, 0.03)',
                      color: msg.role === 'user' ? 'white' : '#cbd5e1',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderTopRightRadius: msg.role === 'user' ? '0' : '18px',
                      borderTopLeftRadius: msg.role === 'user' ? '18px' : '0',
                      boxShadow: msg.role === 'user' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image src="/nacho-avatar.png" alt="Nacho" width={34} height={34} className="object-cover" />
                </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '18px', borderTopLeftRadius: '0', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '7px', height: '7px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '7px', height: '7px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '7px', height: '7px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '14px 50px 14px 18px',
                    fontSize: '14px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(37, 99, 235, 0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '10px',
                    color: !input.trim() || isLoading ? '#475569' : '#60a5fa',
                    cursor: !input.trim() || isLoading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                >
                  <Send size={20} />
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#475569', marginTop: '12px', textAlign: 'center', letterSpacing: '0.5px' }}>
                IA de alto rendimiento · OpenRouter API · Gemini 2.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}
