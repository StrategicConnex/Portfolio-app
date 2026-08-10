'use client';
import { useAskAIStore } from '@/stores/ask-ai-store';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AskAILauncher() {
  const { isOpen, setIsOpen } = useAskAIStore();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              {/* AI Node Console: anillo de pulso + halo (decorativo, aria-hidden) */}
              <span aria-hidden="true" className="absolute inset-0 rounded-full border border-[#C5A46D]/40 animate-ping" />
              <span aria-hidden="true" className="absolute -inset-1.5 rounded-full border border-[#C5A46D]/20" />
              <Button
                size="icon"
                aria-label="Ask AI"
                className="w-14 h-14 rounded-full shadow-2xl bg-slate-950 border border-[#C5A46D]/40 hover:bg-slate-900 hover:border-[#C5A46D]/70"
                onClick={() => setIsOpen(true)}
              >
                <MessageSquare className="w-6 h-6 text-[#C5A46D]" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
