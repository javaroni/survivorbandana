import { useState, useRef, useEffect, useCallback } from 'react';
import type { AudioContextState } from '@shared/schema';

export interface UseAudioCueReturn {
  play: () => Promise<void>;
  isPlaying: boolean;
  audioContextState: AudioContextState;
  initializeAudio: () => Promise<void>;
}

export function useAudioCue(audioUrl?: string): UseAudioCueReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContextState, setAudioContextState] = useState<AudioContextState>('suspended');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const initializeAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;

      // Resume context if suspended (user gesture required)
      if (context.state === 'suspended') {
        await context.resume();
      }

      setAudioContextState(context.state);

      // Load audio buffer if we have a URL and haven't loaded yet
      if (audioUrl && !audioBufferRef.current) {
        // For MVP, we'll use a short beep tone instead of loading external audio
        // This ensures it works without additional audio assets
        const sampleRate = context.sampleRate;
        const duration = 0.3; // 300ms
        const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
        const channel = buffer.getChannelData(0);

        // Generate a tribal drum-like sound (short decay tone)
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const decay = Math.exp(-t * 8);
          const freq = 100; // Low frequency for drum sound
          channel[i] = Math.sin(2 * Math.PI * freq * t) * decay * 0.5;
        }

        audioBufferRef.current = buffer;
      }
    } catch (err) {
      console.error('Failed to initialize audio:', err);
    }
  }, [audioUrl]);

  const play = useCallback(async () => {
    if (!audioContextRef.current || !audioBufferRef.current) {
      await initializeAudio();
      if (!audioContextRef.current || !audioBufferRef.current) {
        return;
      }
    }

    // Stop any currently playing sound
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    const context = audioContextRef.current;
    const buffer = audioBufferRef.current;

    // Create and play new source
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    
    setIsPlaying(true);
    source.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    source.start(0);
    sourceNodeRef.current = source;
  }, [initializeAudio]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    play,
    isPlaying,
    audioContextState,
    initializeAudio,
  };
}
