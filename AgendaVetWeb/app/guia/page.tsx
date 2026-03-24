'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Cpu, 
  ChevronRight, 
  Printer, 
  Smartphone, 
  Moon, 
  Share2, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GUIA_AGENDAVET, GUIA_IA_ENGENHARIA } from '@/lib/docs-content';

export default function GuiaPage() {
  const [activeTab, setActiveTab] = useState<'fundador' | 'ia'>('fundador');

  const handlePrint = () => {
    window.print();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans selection:bg-[#00d4aa]/30">
      {/* Header Fixo Mobile/Desktop */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#00d4aa]/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] bg-clip-text text-transparent">
            AgendaVet Docs
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="p-2 hover:bg-[#1c2333] rounded-full transition-colors text-[#8b949e] hover:text-[#00d4aa]"
            title="Imprimir / Salvar PDF"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-[#1c2333] rounded-full transition-colors text-[#8b949e]">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Badge e Título */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa] text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4aa]"></span>
            </span>
            Documentação Oficial
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            AgendaVet <span className="text-[#8b949e]">Master Guide</span>
          </h1>
          <p className="text-[#8b949e] max-w-xl mx-auto text-sm sm:text-base">
            O hub central de conhecimento para o fundador e desenvolvedores do projeto.
            Visão geral, engenharia e futuro.
          </p>
        </motion.div>

        {/* Tabs de Navegação */}
        <div className="flex p-1 bg-[#161b22] rounded-xl border border-[#30363d] mb-12 no-print">
          <button 
            onClick={() => setActiveTab('fundador')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'fundador' 
                ? 'bg-[#0d1117] text-[#00d4aa] shadow-lg border border-[#30363d]' 
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Guia do Fundador
          </button>
          <button 
            onClick={() => setActiveTab('ia')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'ia' 
                ? 'bg-[#0d1117] text-[#7c3aed] shadow-lg border border-[#30363d]' 
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Engenharia de IA
          </button>
        </div>

        {/* Conteúdo dinâmico com Animação */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'fundador' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'fundador' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="prose prose-invert prose-emerald max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mb-8 prose-h1:bg-gradient-to-r prose-h1:from-white prose-h1:to-[#8b949e] prose-h1:bg-clip-text prose-h1:text-transparent
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#30363d]
              prose-p:text-[#9ea7b3] prose-p:leading-relaxed
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-[#79c0ff] prose-code:bg-[#1c2333] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[#30363d] prose-pre:rounded-xl prose-pre:shadow-2xl
              prose-blockquote:border-l-4 prose-blockquote:border-[#00d4aa] prose-blockquote:bg-[#00d4aa]/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
              prose-li:text-[#9ea7b3]
              prose-table:border prose-table:border-[#30363d] prose-table:rounded-xl prose-table:overflow-hidden
              prose-th:bg-[#161b22] prose-th:px-4 prose-th:py-3 prose-th:text-[#00d4aa] prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
              prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-[#30363d]
            "
          >
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="flex items-center gap-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="flex items-center gap-3 before:content-[''] before:w-1 before:h-6 before:bg-[#00d4aa] before:rounded-full" {...props} />,
                hr: () => <hr className="my-16 border-[#30363d]" />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-8 rounded-xl border border-[#30363d]">
                    <table className="w-full text-sm text-left" {...props} />
                  </div>
                ),
                li: ({node, checked, ...props}) => {
                  if (checked !== undefined) {
                    return (
                      <li className="flex items-center gap-3 list-none -ml-6 mb-2">
                        {checked ? <CheckCircle2 className="w-5 h-5 text-[#00d4aa]" /> : <div className="w-5 h-5 rounded border border-[#30363d]" />}
                        <span className={checked ? 'text-[#00d4aa] font-medium' : ''}>{props.children}</span>
                      </li>
                    );
                  }
                  return <li {...props} />
                }
              }}
            >
              {activeTab === 'fundador' ? GUIA_AGENDAVET : GUIA_IA_ENGENHARIA}
            </ReactMarkdown>
          </motion.div>
        </AnimatePresence>

        {/* Floating Action Button for Scroll to Top (Mobile) */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-[#00d4aa] to-[#7c3aed] rounded-full shadow-2xl text-white sm:hidden z-50 no-print"
        >
          <ArrowLeft className="w-6 h-6 rotate-90" />
        </button>

        {/* Rodapé Interno */}
        <footer className="mt-24 pt-8 border-t border-[#30363d] text-center text-[#8b949e] text-sm">
          <p>AgendaVet — Building the future of Veterinary Medicine</p>
          <p className="mt-2 opacity-50">© 2026 • Exclusive Documentation for Wesley Melo</p>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; color: black !important; }
          .no-print { display: none !important; }
          .prose { color: black !important; max-width: 100% !important; }
          h1, h2, h3, h4 { color: black !important; border-color: #ddd !important; }
          p, li { color: #333 !important; }
          pre, code { background: #f5f5f5 !important; color: black !important; border: 1px solid #ddd !important; }
          .prose-h1 { background: none !important; -webkit-text-fill-color: black !important; }
          .prose-blockquote { background: #f9f9f9 !important; border-color: #333 !important; }
        }
      `}} />
    </div>
  );
}
