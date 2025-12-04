import React, { useState, useRef, useEffect } from 'react';
import { AudioState } from '../types';

interface InputSectionProps {
  onProcess: (text: string, image: File | null, audio: Blob | null) => void;
  isProcessing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({ isRecording: false, audioBlob: null, duration: 0 });
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType }); 
        setAudioState(prev => ({ ...prev, isRecording: false, audioBlob, duration: recordingTime }));
        if (timerRef.current) window.clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setAudioState(prev => ({ ...prev, isRecording: true, audioBlob: null }));
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查权限。");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!text && !image && !audioState.audioBlob) return;
    onProcess(text, image, audioState.audioBlob);
    setText('');
    setImage(null);
    setAudioState({ isRecording: false, audioBlob: null, duration: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight text-lg">智能录入</h3>
          <p className="text-sm text-muted-foreground">
            支持文字、语音、图片输入，AI 将自动提取房源信息。
          </p>
      </div>

      <div className="p-6 pt-0 space-y-4">
        {/* Text Input */}
        <textarea
            ref={textareaRef}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y max-h-[50vh] overflow-y-auto"
            placeholder="在此输入房源描述...
例如：
1. 天通苑三区，精装两居，5000元，朝南。
2. 阳光花园，一居室，3500元，随时看房。"
            value={text}
            onChange={(e) => setText(e.target.value)}
        />

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex gap-2">
                {/* Audio */}
                {!audioState.isRecording ? (
                    <button
                        onClick={handleStartRecording}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 ${
                            audioState.audioBlob 
                            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                            : 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        {audioState.audioBlob ? '语音已录制' : '语音输入'}
                    </button>
                ) : (
                    <button
                        onClick={handleStopRecording}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                    >
                        <span className="mr-2 h-2 w-2 rounded-full bg-white"></span>
                        {formatTime(recordingTime)} (点击停止)
                    </button>
                )}
                
                {audioState.audioBlob && !audioState.isRecording && (
                     <button 
                        onClick={() => setAudioState({ isRecording: false, audioBlob: null, duration: 0 })}
                        className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-input hover:bg-accent hover:text-accent-foreground"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                )}

                {/* Image */}
                <div className="flex items-center gap-2">
                     <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 ${
                            image 
                            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                            : 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        {image ? '图片已添加' : '上传图片'}
                    </button>
                     {image && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                             className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-input hover:bg-accent hover:text-accent-foreground"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    )}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!text && !image && !audioState.audioBlob}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 w-full md:w-auto"
            >
                开始识别
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;