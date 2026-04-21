'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, ShieldAlert, Zap, Activity, Clock, Server, ArrowRight, Download, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import caseData from '../data/caseStudyData.json'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei'

// S1: Hero 3D Element
function NetworkGraph() {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ff88" />
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} wireframe />
      </Sphere>
      <Sphere args={[0.3, 16, 16]} position={[2, 1, -1]}>
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} />
      </Sphere>
      <Sphere args={[0.4, 16, 16]} position={[-2, -1, 1]}>
        <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={0.5} />
      </Sphere>
      <Line points={[[0, 0, 0], [2, 1, -1]]} color="#00d4ff" lineWidth={2} />
      <Line points={[[0, 0, 0], [-2, -1, 1]]} color="#00d4ff" lineWidth={2} />
      <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
    </group>
  )
}

export default function CaseStudyDetail({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('Ejecutivo')

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-y-auto custom-scrollbar"
    >
      {/* Navbar flotante para cerrar */}
      <div className="sticky top-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white transition-all shadow-2xl group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
        </button>
        <button 
          onClick={onClose}
          className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white transition-all shadow-2xl"
        >
          <X size={24} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-32 -mt-20">
        
        {/* SECCIÓN 1: HERO */}
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center pt-20 border-b border-white/5">
          <div className="absolute inset-0 z-0 opacity-50">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <NetworkGraph />
            </Canvas>
          </div>
          <div className="relative z-10 text-center flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2"
            >
              <Zap size={14} /> Disponibilidad Laboral
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
              {caseData.meta.title}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 font-medium max-w-2xl">
              De {caseData.before.mttr.value} horas a {caseData.after.mttr.value} minutos de MTTR
            </p>
          </div>
        </section>

        {/* SECCIÓN 2: EL PROBLEMA */}
        <section className="py-24 border-b border-white/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-[#0a0a0f] to-[#0a0a0f] -z-10" />
          <h2 className="text-3xl font-black text-white mb-12 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} /> El Problema Inicial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(caseData.before).map(([key, data], i) => (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: [0, -5, 5, -5, 0], transition: { duration: 0.4 } }}
                className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="text-red-500/20 absolute -right-4 -bottom-4">
                  <Activity size={100} />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">{data.label}</p>
                  <p className="text-4xl font-mono text-white mb-1">{data.value}</p>
                  <p className="text-sm text-slate-400">{data.unit}</p>
                  {/* @ts-ignore */}
                  {data.sub && <p className="text-xs text-red-400/80 mt-2 font-medium">{data.sub}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 3: LA SOLUCIÓN (ARQUITECTURA) */}
        <section className="py-24 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00d4ff]/5 opacity-20" style={{ backgroundImage: 'radial-gradient(#00d4ff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <h2 className="text-3xl font-black text-white mb-12 flex items-center gap-3 relative z-10">
            <Server className="text-[#00d4ff]" size={32} /> Arquitectura Purdue Model
          </h2>
          <div className="relative z-10 space-y-4">
            {caseData.architecture.levels.map((level, i) => (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/0 via-[#00d4ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-[#111116] border border-white/10 hover:border-[#00d4ff]/50 transition-colors rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-xl font-black text-[#00d4ff]">
                      L{level.id}
                    </div>
                    <h3 className="text-xl font-bold text-white">{level.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {level.components.map(comp => (
                      <span key={comp} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-medium text-slate-300 border border-white/5">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 4: RESULTADOS DASHBOARD */}
        <section className="py-24 border-b border-white/5">
          <h2 className="text-3xl font-black text-white mb-12 flex items-center gap-3">
            <ShieldCheck className="text-[#00ff88]" size={32} /> Resultados del Proyecto
          </h2>
          
          <div className="bg-[#0f1015] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Mockup Topbar */}
            <div className="flex items-center justify-between p-4 bg-[#16181d] border-b border-white/5">
              <div className="flex gap-2">
                {['Ejecutivo', 'Operaciones', 'Ciberseguridad'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === tab ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">
                <Download size={14} /> Exportar
              </button>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 bg-[#16181d] rounded-xl p-6 border border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Ahorro Generado</p>
                <div className="flex items-end gap-4">
                  <h4 className="text-5xl font-black text-[#00ff88]">${(caseData.after.savings.value / 1000)}k</h4>
                  <p className="text-sm text-slate-500 mb-2">USD / año en downtime evitado</p>
                </div>
              </div>
              
              <div className="bg-[#16181d] rounded-xl p-6 border border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">MTTR</p>
                <div className="text-4xl font-black text-white mb-2">{caseData.after.mttr.value} <span className="text-lg text-slate-500">min</span></div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 w-fit px-2 py-1 rounded">
                  ↓ 94% vs Inicial
                </div>
              </div>

              <div className="bg-[#16181d] rounded-xl p-6 border border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cobertura</p>
                <div className="text-4xl font-black text-white mb-2">{caseData.after.coverage.value}%</div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 w-fit px-2 py-1 rounded">
                  ↑ 63% vs Inicial
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 5: STORYTELLING INCIDENTE */}
        <section className="py-24 border-b border-white/5">
          <h2 className="text-3xl font-black text-white mb-12 flex items-center gap-3">
            <Clock className="text-[#ff6b00]" size={32} /> Incidente Real: {caseData.incident.date}
          </h2>
          
          <div className="relative pl-6 md:pl-0">
            {/* Línea vertical */}
            <div className="absolute left-[11px] md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2" />
            
            <div className="space-y-12">
              {caseData.incident.timeline.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="absolute left-[-21px] md:left-1/2 w-8 h-8 rounded-full bg-[#0a0a0f] border-4 border-[#ff6b00] -translate-x-1/2 flex items-center justify-center z-10" />
                  
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:pl-12' : 'md:pr-12 md:text-right'} mb-2 md:mb-0`}>
                    <p className="text-sm font-black text-[#ff6b00] uppercase tracking-widest">{step.time}</p>
                  </div>
                  
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                      <h4 className="text-lg font-bold text-white mb-1">{step.action}</h4>
                      <p className="text-sm text-slate-400">Vía {step.tool}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="mt-16 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-2xl p-8 text-center max-w-2xl mx-auto"
          >
            <CheckCircle2 size={48} className="text-[#00ff88] mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Impacto Evitado</h3>
            <p className="text-3xl font-mono text-[#00ff88]">{caseData.incident.impactAvoided}</p>
          </motion.div>
        </section>

        {/* SECCIÓN 6: CTA */}
        <section className="py-24 text-center">
          <h2 className="text-3xl font-black text-white mb-8">¿Listo para optimizar tu infraestructura?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-3 bg-[#00d4ff] hover:bg-[#00b0d4] text-[#0a0a0f] font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-transform hover:scale-105">
              <Download size={20} /> Descargar Arquitectura PDF
            </button>
            <button 
              onClick={onClose}
              className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl border border-white/10 transition-transform hover:scale-105"
            >
              <ArrowLeft size={20} /> Volver al Perfil
            </button>
          </div>
          <div className="mt-16 text-slate-500 text-sm">
            Stack: React 18, Three.js, GSAP, Tailwind CSS • 2026
          </div>
        </section>

      </div>
    </motion.div>
  )
}
