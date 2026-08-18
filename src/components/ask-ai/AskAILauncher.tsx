'use client';
import { useAskAIStore } from '@/stores/ask-ai-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CloudIcon } from './CloudIcons';

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
              aria-label="Tanos AI"
              className="w-14 h-14 rounded-full shadow-2xl bg-orange-500 hover:bg-orange-600 border-0 relative overflow-hidden"
              onClick={() => setIsOpen(true)}
            >
              <CloudIcon className="w-7 h-7" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
