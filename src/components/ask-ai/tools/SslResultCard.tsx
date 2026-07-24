'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export interface SslResult {
  hostname: string;
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  san?: string[];
  protocol?: string;
  error?: string;
}

interface Props {
  result: SslResult;
}

export function SslResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const isExpired = result.daysRemaining !== undefined && result.daysRemaining <= 0;
  const isExpiringSoon =
    result.daysRemaining !== undefined && result.daysRemaining > 0 && result.daysRemaining <= 30;

  const getStatusBadge = () => {
    if (result.error) {
      return (
        <Badge variant="outline" className="h-5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10 gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          Error
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="outline" className="h-5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10 gap-1">
          <ShieldAlert className="w-2.5 h-2.5" />
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge variant="outline" className="h-5 text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1">
          <ShieldAlert className="w-2.5 h-2.5" />
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="h-5 text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">
        <ShieldCheck className="w-2.5 h-2.5" />
        Valid
      </Badge>
    );
  };

  const handleCopy = async () => {
    const text = [
      `Hostname: ${result.hostname}`,
      `Issuer: ${result.issuer || 'N/A'}`,
      `Subject: ${result.subject || 'N/A'}`,
      `Valid From: ${result.validFrom || 'N/A'}`,
      `Valid To: ${result.validTo || 'N/A'}`,
      `Days Remaining: ${result.daysRemaining ?? 'N/A'}`,
      `Protocol: ${result.protocol || 'N/A'}`,
      `SAN: ${result.san?.join(', ') || 'N/A'}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/70 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              result.error
                ? 'bg-red-500/15 border border-red-500/25'
                : isExpired || isExpiringSoon
                ? 'bg-amber-500/15 border border-amber-500/25'
                : 'bg-emerald-500/15 border border-emerald-500/25'
            }`}
          >
            <Shield
              className={`w-3.5 h-3.5 ${
                result.error
                  ? 'text-red-400'
                  : isExpired || isExpiringSoon
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">{result.hostname}</span>
            <span className="text-[10px] text-slate-500 ml-2">SSL/TLS Certificate</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {!result.error && (
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md hover:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Copy SSL certificate info"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {result.error && (
        <div className="px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-400 font-medium">Connection Error</p>
            <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {/* Certificate details */}
      {!result.error && (
        <div className="p-4 space-y-3">
          {/* Days remaining ring */}
          {result.daysRemaining !== undefined && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                  isExpired
                    ? 'border-red-500/50 bg-red-500/10'
                    : isExpiringSoon
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-emerald-500/50 bg-emerald-500/10'
                }`}
              >
                <span
                  className={`text-lg font-bold ${
                    isExpired
                      ? 'text-red-400'
                      : isExpiringSoon
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {result.daysRemaining}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  {isExpired
                    ? 'Certificate expired'
                    : isExpiringSoon
                    ? 'Expires in'
                    : 'Valid for'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {result.daysRemaining === 1 ? '1 day' : `${Math.abs(result.daysRemaining)} days`}
                </p>
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Issuer</span>
              <span className="text-slate-300 font-medium">{result.issuer || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Subject (CN)</span>
              <span className="text-slate-300 font-medium">{result.subject || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Valid From</span>
              <span className="text-slate-300">{formatDate(result.validFrom)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Valid Until</span>
              <span className="text-slate-300">{formatDate(result.validTo)}</span>
            </div>
            {result.protocol && (
              <div>
                <span className="text-slate-500 block text-[10px]">Protocol</span>
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] border-slate-600 text-slate-400 bg-slate-800 font-mono"
                >
                  {result.protocol}
                </Badge>
              </div>
            )}
          </div>

          {/* SAN */}
          {result.san && result.san.length > 0 && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Subject Alternative Names ({result.san.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {result.san.slice(0, 6).map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="h-5 text-[10px] border-slate-700/50 text-slate-400 bg-slate-800/50 font-mono"
                  >
                    {name}
                  </Badge>
                ))}
                {result.san.length > 6 && (
                  <Badge
                    variant="outline"
                    className="h-5 text-[10px] border-slate-700/50 text-slate-500 bg-slate-800/30"
                  >
                    +{result.san.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
