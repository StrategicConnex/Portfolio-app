'use client';

import { useAskAIStore } from '@/stores/ask-ai-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { AskAIHeader } from '@/components/ask-ai/AskAIHeader';
import { AskAIPromptInput } from '@/components/ask-ai/AskAIPromptInput';
import { AskAIMessageList } from '@/components/ask-ai/AskAIMessageList';
import { AskAISourcesSidebar } from '@/components/ask-ai/AskAISourcesSidebar';
import { useAskAIChat } from '@/components/ask-ai/hooks/useAskAIChat';

export function AskAIPanel() {
  const { isOpen, setIsOpen, mode } = useAskAIStore();
  const { language } = useLanguage();

  const {
    messages,
    input,
    expanded,
    isLoading,
    retrying,
    fellBack,
    error,
    messageCount,
    modelLabel,
    handleSubmit,
    handleSuggestion,
    handleClear,
    handleToggleExpand,
    handleInputChange,
    stop,
  } = useAskAIChat({ language, mode });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`console console-corners fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden ${
            expanded
              ? 'w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-w-5xl'
              : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-6rem)] sm:h-[640px] max-h-[80vh] sm:max-h-[85vh]'
          }`}
          style={{ borderRadius: '14px' }}
        >
          {/* Header */}
          <AskAIHeader
            onClose={() => setIsOpen(false)}
            onToggleExpand={handleToggleExpand}
            onClear={handleClear}
            expanded={expanded}
            isLoading={isLoading}
            messageCount={messageCount}
            language={language}
            mode={mode}
            modelLabel={modelLabel}
            fellBack={fellBack}
          />

          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Main conversation area */}
            <div className="flex flex-col flex-1 min-w-0">
              <AskAIMessageList
                messages={messages}
                isLoading={isLoading}
                retrying={retrying}
                error={error}
                language={language}
                onSelectPrompt={handleSuggestion}
                onStop={stop}
              />

              {/* Input */}
              <AskAIPromptInput
                input={input}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onStop={stop}
                isLoading={isLoading}
              />
            </div>

            {/* Sources sidebar (expanded only) */}
            {expanded && (
              <AskAISourcesSidebar
                messageCount={messageCount}
                mode={mode}
                isLoading={isLoading}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
