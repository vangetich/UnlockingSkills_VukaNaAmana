import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, Download, ExternalLink, FileLock2, X } from 'lucide-react';

export interface PdfDocumentSpec {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  filename: string;
  pageCountLabel: string;
  variant: 'emerald' | 'slate';
}

export const JUDGE_MASTER_GUIDE_V2_PDF: PdfDocumentSpec = {
  id: 'judge-master-guide-v2',
  title: 'Judge Testing & Evaluation Guide (v2)',
  subtitle: '3 pages · 5-Stage Crossing, 2FA/PIN Auth, Search Hub & Concept Note Scorecard',
  src: '/Vuka_na_Amana_Judge_Testing_Guide-v2.pdf',
  filename: 'Vuka_na_Amana_Judge_Testing_Guide-v2.pdf',
  pageCountLabel: 'PDF · 3p',
  variant: 'emerald',
};

export const AUTH_SECURITY_GUIDE_PDF: PdfDocumentSpec = {
  id: 'auth-security-guide',
  title: 'App Authentication & Security Guide',
  subtitle: '2 pages · 2FA OTP, No-Phone Dedicated PIN, Auth-Gated Search & Dual-Door Isolation',
  src: '/App_Authentication_Judges_Testing_Guide.pdf',
  filename: 'App_Authentication_Judges_Testing_Guide.pdf',
  pageCountLabel: 'PDF · 2p',
  variant: 'slate',
};

interface JudgeGuidePdfModalProps {
  isOpen: boolean;
  document?: PdfDocumentSpec | null;
  onClose: () => void;
}

export const JudgeGuidePdfModal: React.FC<JudgeGuidePdfModalProps> = ({
  isOpen,
  document: activeDoc,
  onClose,
}) => {
  const doc = activeDoc ?? JUDGE_MASTER_GUIDE_V2_PDF;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEmerald = doc.variant === 'emerald';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      data-testid="judge-pdf-preview-modal"
      data-pdf-doc-id={doc.id}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-4xl h-[86vh] rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isEmerald
                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[#146C53] dark:text-[#2EB88B]'
                  : 'bg-[#F3EFEA] dark:bg-[#1E2126] border-[#E2DCD2] dark:border-[#2F343D] text-[#17191C] dark:text-[#CBD5E1]'
              }`}
            >
              {isEmerald ? (
                <ClipboardCheck className="w-4 h-4" />
              ) : (
                <FileLock2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                data-testid="pdf-preview-modal-title"
                className="font-display text-sm sm:text-base font-medium text-[#17191C] dark:text-[#F4F2EE] truncate"
              >
                {doc.title}
              </h2>
              <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate">
                {doc.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={doc.src}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="pdf-open-new-tab-link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </a>
            <a
              href={doc.src}
              download={doc.filename}
              data-testid="pdf-download-link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF preview"
              data-testid="close-judge-pdf-modal-btn"
              className="min-h-[32px] min-w-[32px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-[#EAE6DF] dark:bg-[#0D0F12] relative overflow-hidden">
          <iframe
            key={doc.src}
            src={doc.src}
            title={doc.title}
            data-testid="pdf-preview-iframe"
            className="w-full h-full border-0"
          />
        </div>

        {/* Calm mobile fallback strip */}
        <div className="px-4 sm:px-5 py-2 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          <span className="font-mono-tabular">
            {doc.filename} · {doc.pageCountLabel}
          </span>
          <span>
            Viewing on mobile?{' '}
            <a
              href={doc.src}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline"
            >
              Open standalone PDF
            </a>{' '}
            or download directly.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
