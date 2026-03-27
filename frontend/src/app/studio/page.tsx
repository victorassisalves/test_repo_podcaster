'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPodcasts, chatWithAI } from '@/lib/api';

const useAudioRecorder = () => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    mediaRecorder.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = audioUrl;
      downloadLink.download = 'podcast_mix.wav';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      audioChunks.current = []; // Reset chunks for next recording
    };

    recorder.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
  }, []);

  return { startRecording, stopRecording };
};

export default function Studio() {
  const [podcasts, setPodcasts] = useState([]);
  const [selectedPodcast, setSelectedPodcast] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // Entire conversation context (for LLM memory)
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

  // UI Transcript display
  const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([]);
  const [teleprompterMessages, setTeleprompterMessages] = useState<{ agent: string, message: string }[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const { startRecording: startAudioRec, stopRecording: stopAudioRec } = useAudioRecorder();

  // Web Speech Recognition for continuous listening
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchPodcasts();

    // Initialize Web Speech API for recognizing human speech
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after a pause to let AI respond
      recognitionRef.current.interimResults = false; // Only final sentences
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcriptText = event.results[event.results.length - 1][0].transcript;
        console.log("Heard:", transcriptText);

        // Append user text
        setTranscript(prev => [...prev, { speaker: 'Host (You)', text: transcriptText }]);

        const newMessages = [...messages, { role: 'user', content: transcriptText }];
        setMessages(newMessages);

        // Let the AI respond
        await handleAIResponse(newMessages);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (isRecording && event.error !== 'aborted') {
            // Try restarting if it randomly drops
            setTimeout(() => {
                if(isRecording && !isAILoading) {
                   try { recognitionRef.current.start(); } catch(e){}
                }
            }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
          // If we are recording and AI is not currently speaking/loading, restart listening
          if (isRecording && !isAILoading) {
               try { recognitionRef.current.start(); } catch(e){}
          }
      };

    } else {
      console.warn("Speech Recognition API not supported in this browser. Please use Chrome/Edge.");
    }

    // Cleanup
    return () => {
        if(recognitionRef.current) {
           recognitionRef.current.stop();
        }
    };
  }, [messages, isRecording, isAILoading]);

  const fetchPodcasts = async () => {
    const data = await getPodcasts();
    setPodcasts(data);
  };

  const playBase64Audio = (base64Audio: string) => {
    return new Promise((resolve) => {
        if (!base64Audio) {
            resolve(true);
            return;
        }

        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => resolve(true);
        audio.play().catch(e => {
            console.error("Audio play error:", e);
            resolve(true); // Resolve anyway to not break loop
        });
    });
  };

  const handleAIResponse = async (contextMessages: { role: string, content: string }[]) => {
      setIsAILoading(true);
      // Stop listening while AI thinks/speaks
      if(recognitionRef.current) {
         try { recognitionRef.current.stop(); } catch(e) {}
      }

      try {
          // Call Backend
          const aiData = await chatWithAI(contextMessages, "EXAVITQu4vr4xnSDxMaL"); // Bella voice

          setTranscript(prev => [...prev, { speaker: 'AI Co-Host', text: aiData.text }]);
          setMessages([...contextMessages, { role: 'assistant', content: aiData.text }]);

          // Play Audio (Blocks until finished)
          await playBase64Audio(aiData.audio_base64);

      } catch (err) {
          console.error("AI Chat Error:", err);
          setTranscript(prev => [...prev, { speaker: 'System Error', text: "Failed to reach AI. Ensure backend and API keys are running." }]);
      } finally {
          setIsAILoading(false);
          // Resume listening after AI finishes talking
          if (isRecording && recognitionRef.current) {
               try { recognitionRef.current.start(); } catch(e) {}
          }
      }
  };

  const handleStartRecording = async () => {
    if (!selectedPodcast) return alert('Select a podcast first');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setMessages([]); // reset memory
      setTranscript([{ speaker: 'System', text: 'Recording started... Start speaking into your mic!' }]);

      startAudioRec(stream);

      // Start listening to the mic
      if(recognitionRef.current) {
          try { recognitionRef.current.start(); } catch(e) {}
      }

    } catch (err) {
      console.error("Error accessing microphone", err);
      alert('Could not access microphone');
    }
  };

  const handleStopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    stopAudioRec();

    if(recognitionRef.current) {
        recognitionRef.current.stop();
    }

    setTranscript(prev => [...prev, { speaker: 'System', text: 'Recording stopped.' }]);
  };

  return (
    <div className="p-8 h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Live Studio</h1>
        <div className="flex gap-4 items-center">
          <select
            value={selectedPodcast}
            onChange={(e) => setSelectedPodcast(e.target.value)}
            className="border p-2 rounded text-black bg-white"
            disabled={isRecording}
          >
            <option value="">Select Podcast to Record...</option>
            {podcasts.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>

          {isRecording ? (
             <button onClick={handleStopRecording} className="bg-red-600 text-white px-6 py-2 rounded font-bold animate-pulse flex items-center gap-2">
               <div className="w-3 h-3 bg-white rounded-full"></div>
               Stop Recording
             </button>
          ) : (
            <button onClick={handleStartRecording} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">
              Start Recording
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow grid grid-cols-3 gap-8 overflow-hidden">

        {/* Teleprompter / Crew AI Feed */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-6 overflow-y-auto border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Teleprompter (Background Crew)</h2>
          <div className="space-y-4">
            {teleprompterMessages.length === 0 ? (
              <p className="text-gray-500 italic">Background crew insights will appear here.</p>
            ) : (
              teleprompterMessages.map((msg, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded shadow-md border-l-4 border-purple-500">
                  <span className="font-bold text-sm text-purple-300 block mb-1">{msg.agent}</span>
                  <p className="text-white">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Transcript */}
        <div className="col-span-2 bg-gray-950 rounded-lg p-6 overflow-y-auto border border-gray-800 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-blue-400 flex justify-between">
            Live Transcript
            {isRecording && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">LIVE</span>}
          </h2>
          <div className="flex-grow space-y-4 overflow-y-auto pb-4">
             {transcript.length === 0 ? (
              <p className="text-gray-600 italic text-center mt-10">Start recording and speak to begin the conversation.</p>
            ) : (
              transcript.map((line, idx) => (
                <div key={idx} className={`flex flex-col ${line.speaker === 'System' || line.speaker === 'System Error' ? 'items-center text-gray-500 text-sm' : line.speaker.includes('You') ? 'items-end' : 'items-start'}`}>
                  {line.speaker !== 'System' && line.speaker !== 'System Error' && <span className="text-xs text-gray-400 mb-1">{line.speaker}</span>}
                  <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    line.speaker === 'System' ? 'bg-transparent' :
                    line.speaker === 'System Error' ? 'text-red-500 bg-red-900/20' :
                    line.speaker.includes('You') ? 'bg-blue-600 text-white' : 'bg-green-700 text-white'
                  }`}>
                    {line.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active AI Indicators */}
          {isRecording && (
             <div className="mt-4 border-t border-gray-800 pt-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAILoading ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></div>
                  <span className="text-sm text-gray-400">
                      {isAILoading ? "AI is thinking/speaking..." : "Listening to microphone..."}
                  </span>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
