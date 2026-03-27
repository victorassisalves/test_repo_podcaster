'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPodcasts } from '@/lib/api';

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
  const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([]);
  const [teleprompterMessages, setTeleprompterMessages] = useState<{ agent: string, message: string }[]>([]);

  // Simulation references
  const streamRef = useRef<MediaStream | null>(null);
  const { startRecording: startAudioRec, stopRecording: stopAudioRec } = useAudioRecorder();

  // Function to speak text using the Web Speech API
  const speakAI = useCallback((text: string, voiceNameKeyword: string = 'Google') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Try to find a distinct voice based on keyword
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name.includes(voiceNameKeyword)) || voices[0];

      if (selectedVoice) {
         utterance.voice = selectedVoice;
      }

      // Slightly adjust pitch/rate to make it sound different from default if needed
      utterance.pitch = 1.1;
      utterance.rate = 1.0;

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis is not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    fetchPodcasts();

    // Initialize voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
         // Load voices
         window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const fetchPodcasts = async () => {
    const data = await getPodcasts();
    setPodcasts(data);
  };

  const handleStartRecording = async () => {
    if (!selectedPodcast) return alert('Select a podcast first');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      startAudioRec(stream);

      // Simulate real-time data & AI interaction
      setTranscript([{ speaker: 'System', text: 'Recording started...' }]);

      setTimeout(() => {
        setTranscript(prev => [...prev, { speaker: 'Host (You)', text: 'Welcome to the podcast! Today we are discussing AI agents.' }]);

        // AI Co-host responds shortly after you speak
        setTimeout(() => {
           const aiResponse = "That's a great topic! AI agents are transforming how we interact with technology.";
           setTranscript(prev => [...prev, { speaker: 'AI Co-Host', text: aiResponse }]);

           // Physically read the response aloud
           speakAI(aiResponse, 'Female'); // Try to use a female/distinct voice

           // CrewAI Background Teleprompter insight
           setTimeout(() => {
              setTeleprompterMessages(prev => [...prev, { agent: 'Fact-checker', message: 'Remember to mention that MCP stands for Model Context Protocol.' }]);
           }, 2000);

        }, 3000);

      }, 2000);

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
    setTranscript(prev => [...prev, { speaker: 'System', text: 'Recording stopped.' }]);

    // Stop any ongoing AI speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
              <p className="text-gray-500 italic">Waiting for crew insights...</p>
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
              <p className="text-gray-600 italic text-center mt-10">Start recording to see transcript and hear AI co-hosts.</p>
            ) : (
              transcript.map((line, idx) => (
                <div key={idx} className={`flex flex-col ${line.speaker === 'System' ? 'items-center text-gray-500 text-sm' : line.speaker.includes('You') ? 'items-end' : 'items-start'}`}>
                  {line.speaker !== 'System' && <span className="text-xs text-gray-400 mb-1">{line.speaker}</span>}
                  <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    line.speaker === 'System' ? 'bg-transparent' :
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
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-400">AI Audio Engine active</span>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
