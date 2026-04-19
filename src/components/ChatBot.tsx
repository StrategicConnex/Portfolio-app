'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X as CloseIcon, Send, Sparkles, Bot, User, Trash2, Maximize2, Minimize2, Terminal } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { label: 'Experiencia IT/OT', icon: '🛠️', prompt: '¿Cuál es tu experiencia técnica en entornos IT/OT y Oil & Gas?' },
  { label: 'Proyectos Vaca Muerta', icon: '⛽', prompt: 'Contame sobre tus proyectos en Vaca Muerta y StrategicConnex.' },
  { label: 'Ciberseguridad/SIEM', icon: '🛡️', prompt: '¿Qué herramientas de ciberseguridad y SIEM manejás?' },
  { label: 'Descargar CV', icon: '📄', prompt: '¿Dónde puedo descargar tu CV actualizado?' },
]

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy **Nacho Assistant**, el compañero IA de Juan Palacios. \n\nEspecializado en ciberseguridad industrial y arquitectura IT/OT. ¿En qué protocolo puedo ayudarte hoy?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, isOpen, isMinimized])

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }])
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**[SYSTEM ERROR]**: ${error.message}. Por favor, reintenta la conexión.` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Memoria purgada. ¿En qué más puedo asistirte?' }])
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
      }}
    >
      {/* Floating Button with Pulse Effect */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen)
          setIsMinimized(false)
        }}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: isOpen ? '#1e293b' : '#2563eb',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOpen ? 'none' : '0 10px 40px rgba(37, 99, 235, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isOpen ? <CloseIcon size={28} /> : <div className="relative"><MessageSquare size={28} /><motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full" /></div>}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '70px' : '580px',
              width: isMinimized ? '280px' : 'min(420px, 92vw)'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: '85px',
              right: '0',
              backgroundColor: '#0a0f1a',
              backgroundImage: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '28px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(15, 23, 42, 0.8)' 
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'rgba(37, 99, 235, 0.1)', overflow: 'hidden', border: '1px solid rgba(37, 99, 235, 0.3)', flexShrink: 0 }}>
                <Image src="/NachoAsistente.png" alt="Nacho" width={42} height={42} className="object-cover" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>NACHO_ASSISTANT v3.2</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-green-400/50" />
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted · Secure</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }} className="hover:text-white transition-colors">
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={clearChat} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }} title="Limpiar Terminal" className="hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                  className="custom-scrollbar"
                >
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <div style={{ display: 'flex', gap: '12px', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          backgroundColor: msg.role === 'user' ? '#1e293b' : 'rgba(37, 99, 235, 0.1)', 
                          border: '1px solid rgba(255,255,255,0.05)' 
                        }}>
                          {msg.role === 'user' ? <User size={14} style={{ color: '#94a3b8' }} /> : <Image src="/NachoAsistente.png" alt="Nacho" width={32} height={32} />}
                        </div>
                        <div style={{ 
                          padding: '12px 16px', borderRadius: '20px', fontSize: '13.5px', lineHeight: '1.6',
                          backgroundColor: msg.role === 'user' ? '#2563eb' : 'rgba(255, 255, 255, 0.03)',
                          color: msg.role === 'user' ? 'white' : '#e2e8f0',
                          borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                          borderTopLeftRadius: msg.role === 'user' ? '20px' : '4px',
                          boxShadow: msg.role === 'user' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                        }} className="prose prose-invert prose-sm">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={14} style={{ color: '#60a5fa' }} />
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 18px', borderRadius: '20px', borderTopLeftRadius: '4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '6px', height: '6px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '6px', height: '6px', backgroundColor: '#60a5fa', borderRadius: '50%' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div style={{ padding: '0 20px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px' }} className="no-scrollbar">
                  {QUICK_ACTIONS.map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 99, 235, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSend(action.prompt)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        color: '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Interaction Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ position: 'relative', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Protocolo de consulta..."
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        fontSize: '14px',
                        color: 'white',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      style={{
                        width: '50px',
                        backgroundColor: !input.trim() || isLoading ? '#1e293b' : '#2563eb',
                        border: 'none',
                        borderRadius: '16px',
                        color: 'white',
                        cursor: !input.trim() || isLoading ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                    <span style={{ fontSize: '9px', color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Kernel v4.0</span>
                    <span style={{ fontSize: '9px', color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Neuquén Source</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
