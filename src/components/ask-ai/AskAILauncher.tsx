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
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-2xl bg-slate-950 border border-orange-500/30 hover:bg-slate-900"
              onClick={() => setIsOpen(true)}
            >
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
