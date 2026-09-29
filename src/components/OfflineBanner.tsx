import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cachedTime, setCachedTime] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCachedTime(timeStr);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
        <span>
          {t('labels.offline_notice')} {cachedTime || 'earlier today'}.
        </span>
      </div>
    </div>
  );
};
