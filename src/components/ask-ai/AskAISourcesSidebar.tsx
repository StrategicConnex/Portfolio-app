'use client';

import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { useLanguage } from '@/context/LanguageContext';

const SOURCE_ITEMS = [
  { titleKey: 'ai.source.profile', href: '#perfil' },
  { titleKey: 'ai.source.experience', href: '#experiencia' },
  { titleKey: 'ai.source.stack', href: '#stack' },
  { titleKey: 'ai.source.certs', href: '#certificaciones' },
];

interface AskAISourcesSidebarProps {
  messageCount: number;
  mode: string;
  isLoading: boolean;
}

export function AskAISourcesSidebar({ messageCount, mode, isLoading }: AskAISourcesSidebarProps) {
  const { language, t } = useLanguage();

  return (
    <div className="hidden sm:flex flex-col w-60 border-l border-slate-800 bg-slate-900/30 flex-shrink-0">
      <div className="px-4 py-3 border-b border-slate-800">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          {language === 'en' ? 'Sources' : 'Fuentes'}
        </h4>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <Sources>
            <SourcesTrigger count={SOURCE_ITEMS.length} />
            <SourcesContent>
              {SOURCE_ITEMS.map((item) => (
                <Source
                  key={item.href}
                  href={item.href}
                  title={t(item.titleKey)}
                  className="text-xs text-[var(--text-muted)] hover:text-orange-400 transition-colors"
                />
              ))}
            </SourcesContent>
          </Sources>

          <div className="pt-3 border-t border-slate-800/50">
            <h5 className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider mb-2">
              Stats
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-subtle)]">
                  {language === 'en' ? 'Queries' : 'Consultas'}
                </span>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {messageCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-subtle)]">
                  {language === 'en' ? 'Mode' : 'Modo'}
                </span>
                <Badge variant="outline" className="text-[10px] h-5 border-[var(--surface-border)] text-[var(--text-muted)]">
                  {mode}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-subtle)]">
                  {language === 'en' ? 'Status' : 'Estado'}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 ${
                    isLoading
                      ? 'border-orange-500/30 text-orange-400'
                      : 'border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {isLoading ? 'Streaming' : language === 'en' ? 'Ready' : 'Listo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
