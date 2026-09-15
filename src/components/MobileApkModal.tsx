import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  QrCode,
  ShieldAlert,
  Zap,
  Radio,
  FileCheck
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { ghostAudio } from '../utils/audio';

interface MobileApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileApkModal: React.FC<MobileApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleInstallClick = async () => {
    ghostAudio.playUiClick();
    const success = await install();
    if (success) {
      setInstallSuccess(true);
    }
  };

  const handleCopyLink = () => {
    ghostAudio.playUiClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div
        id="mobile-apk-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-slate-100"
      >
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono tracking-wide text-white uppercase">
                MOBILE PHONE APP (APK / PWA)
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Install directly onto Android or iOS for field hunts
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              ghostAudio.playUiClick();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Badge */}
          {isInstalled ? (
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-mono font-bold text-emerald-300">
                  MOBILE APP INSTALLED
                </div>
                <div className="text-xs text-slate-300">
                  This tracker is running in standalone mobile mode with full offline caching.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-400" />
                  NATIVE MOBILE INSTALLATION
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  READY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Chromium on Android builds a native <strong>WebAPK package</strong> automatically when installed. This grants standalone full-screen view, hardware sensor access, background caching, and device vibration haptics.
              </p>

              {/* Install Trigger Button */}
              {isInstallable && (
                <button
                  id="pwa-native-install-button"
                  onClick={handleInstallClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  INSTALL APK / PWA TO PHONE NOW
                </button>
              )}
            </div>
          )}

          {/* Android Step-by-Step Instructions */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ANDROID APK (CHROME / SAMSUNG INTERNET):
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Open this page on your Android phone browser.</li>
              <li>Tap the browser menu <strong>(⋮)</strong> in the top right.</li>
              <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
              <li>The system generates and packages the WebAPK into your Android App Drawer!</li>
            </ol>
          </div>

          {/* iOS Safari Instructions */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              APPLE iOS (SAFARI):
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Open this tracker in <strong>Safari</strong> on your iPhone.</li>
              <li>Tap the <strong>Share</strong> icon (box with upward arrow) at bottom of screen.</li>
              <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
              <li>Launch from your iOS Home Screen in borderless full-screen mode.</li>
            </ol>
          </div>

          {/* Share / Copy Mobile Link */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold shrink-0 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              onClose();
              ghostAudio.playUiClick();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
