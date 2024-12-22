import React, { useState, useRef, useImperativeHandle } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  stopRecordingRef: React.RefObject<() => void>
}

const AudioRecorder: React.FC<Props> = ({ onRecordingComplete, stopRecordingRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const timeInterval = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useImperativeHandle(stopRecordingRef, () => stopRecording);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      
      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.start();
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      timeInterval.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      setRecordingTime(0);
      setMediaRecorder(null);
    }
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      onRecordingComplete(event.data);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-full max-w-2xl mx-auto">
      <div className="w-full bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Record Audio</h2>
        <div className="relative w-full">
          {mediaRecorder ? (
            <div className="w-full h-40 rounded-lg mb-4 bg-[rgb(15,23,42)] flex items-center justify-center overflow-hidden">
              <LiveAudioVisualizer
                mediaRecorder={mediaRecorder}
                width={800}
                height={160}
                barWidth={2}
                gap={1}
                barColor={'rgb(96, 165, 250)'}
                backgroundColor={'rgb(15, 23, 42)'}
                fftSize={1024}
                smoothingTimeConstant={0.8}
              />
            </div>
          ) : (
            <div 
              className="w-full h-40 rounded-lg mb-4 bg-[rgb(15,23,42)] flex items-center justify-center"
            >
              <span className="text-white/50">
                Click Start Recording to begin
              </span>
            </div>
          )}
        </div>
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-gray-700">
            {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'Ready to Record'}
          </div>
        </div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-3 rounded-lg text-white text-lg font-semibold ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } transition-all shadow-md hover:shadow-lg`}
          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
};

export default AudioRecorder;
