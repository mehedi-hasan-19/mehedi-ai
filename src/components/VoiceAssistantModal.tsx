import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Send } from 'lucide-react';
import { LanguageCode } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onSubmitTranscript: (transcript: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  onSubmitTranscript,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatusMessage(
        'Browser SpeechRecognition API is not supported in this browser environment. You can still type or test Text-to-Speech output below.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage(language === 'bn' ? 'মাইক্রোফোন সক্রিয় — কথা বলুন...' : 'Microphone active — listening...');
    };

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setStatusMessage(`Microphone notice: ${event.error || 'Permission or audio device unavailable'}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [language]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        setStatusMessage('Unable to start microphone session.');
      }
    }
  };

  const speakSampleOrTranscript = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatusMessage('SpeechSynthesis is not available in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak =
      transcript.trim() ||
      (language === 'bn'
        ? 'মেহেদী এআই ভয়েস সিস্টেম প্রস্তুত। আপনার নির্দেশ বলুন।'
        : 'MEHEDI AI voice interface is online and ready for your command.');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleDispatch = () => {
    if (!transcript.trim()) return;
    stopSpeaking();
    onSubmitTranscript(transcript.trim());
    setTranscript('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {language === 'bn' ? 'মেহেদী এআই ভয়েস অ্যাসিস্ট্যান্ট' : 'MEHEDI AI Voice Assistant'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speech-to-Text & Text-to-Speech Bridge ({language === 'bn' ? 'বাংলা / bn-BD' : 'English / en-US'})
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {statusMessage && (
            <p className="text-xs text-slate-600 dark:text-slate-400">{statusMessage}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              disabled={!supported}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{isListening ? 'Stop Microphone' : 'Start Microphone'}</span>
            </button>

            <button
              type="button"
              onClick={speakSampleOrTranscript}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Volume2 className="h-4 w-4" />
              <span>Speak Text (TTS)</span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0"
              >
                <VolumeX className="h-4 w-4" />
                <span>Stop Speaking</span>
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Voice Transcript / Command Buffer
            </label>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'মাইক্রোফোনে কথা বলুন অথবা এখানে আপনার নির্দেশ লিখুন...'
                  : 'Speak into your microphone or refine the captured command here...'
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDispatch}
              disabled={!transcript.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send to AI Brain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
