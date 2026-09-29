import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { useTranslation } from 'react-i18next';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useTranslation();

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded transition shadow-xs whitespace-nowrap"
        title="Install app to your device home screen"
      >
        <Download className="w-3.5 h-3.5 text-emerald-700" />
        <span>{t('labels.install_app')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded transition whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-neutral-600" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-neutral-200 text-neutral-900">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="text-base font-semibold">Install Agro Rate on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                1. Tap the <strong>Share</strong> icon (square with arrow) in the Safari bottom bar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Open from your home screen for instantaneous offline access.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded bg-emerald-800 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
