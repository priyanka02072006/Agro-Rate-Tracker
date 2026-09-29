import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VoiceSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
  }, []);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select recognition language based on current i18n locale
      if (i18n.language === 'ta') {
        recognition.lang = 'ta-IN';
      } else if (i18n.language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isListening
            ? t('labels.voice_listening')
            : placeholder || t('labels.search_placeholder')
        }
        className={`w-full pl-9 pr-16 py-2 text-xs md:text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition ${
          isListening ? 'border-amber-500 bg-amber-50/40' : 'border-neutral-200'
        }`}
      />

      <div className="absolute right-2 flex items-center gap-1">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {speechSupported && (
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`p-1.5 rounded transition ${
              isListening
                ? 'text-amber-600 bg-amber-100 animate-pulse'
                : 'text-neutral-400 hover:text-emerald-700 hover:bg-neutral-100'
            }`}
            title={t('labels.voice_search_tooltip')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
