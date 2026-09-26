'use client';

import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AskAIStatusPillProps {
  isLoading: boolean;
  hasError?: boolean;
  status?: string;
}

export function AskAIStatusPill({ isLoading, hasError, status }: AskAIStatusPillProps) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <Badge variant="outline" className="h-5 text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10 gap-1 animate-pulse">
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        {language === 'en' ? 'Streaming' : 'Transmitiendo'}
      </Badge>
    );
  }

  if (hasError) {
    return (
      <Badge variant="outline" className="h-5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10 gap-1">
        <WifiOff className="w-2.5 h-2.5" />
        {language === 'en' ? 'Error' : 'Error'}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="h-5 text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">
      <Wifi className="w-2.5 h-2.5" />
      {status || (language === 'en' ? 'Ready' : 'Listo')}
    </Badge>
  );
}
