import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromMedia } from '../services/geminiService';

interface InputSectionProps {
  onProcess: (text: string, image: File | null, audio: Blob | null) => void;
  isProcessing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType }); 
        
        if (timerRef.current) window.clearInterval(timerRef.current);
        setIsRecording(false);
        setRecordingTime(0);

        // Immediately Transcribe
        await handleTranscribeMedia(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
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

  const handleTranscribeMedia = async (blob: Blob, mimeType: string) => {
      setIsAnalyzing(true);
      try {
          const result = await extractTextFromMedia(blob, mimeType);
          if (result) {
              setText(prev => {
                  const prefix = prev ? (prev.endsWith('\n') ? '' : '\n') : '';
                  return prev + prefix + result;
              });
          }
      } catch (err) {
          console.error("Media processing failed", err);
          alert("识别内容失败，请重试");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleTranscribeMedia(file, file.type);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!text) return;
    // We pass null for image/audio as they have been converted to text
    onProcess(text, null, null);
    setText('');
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
            语音说话或上传图片，AI 将自动将其转化为文字。
          </p>
      </div>

      <div className="p-6 pt-0 space-y-4">
        {/* Text Input */}
        <div className="relative">
            <textarea
                ref={textareaRef}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y max-h-[50vh] overflow-y-auto"
                placeholder="在此输入房源描述，或点击下方按钮使用语音/图片输入...
例如：
1. 天通苑三区，精装两居，5000元，朝南。
2. 阳光花园，一居室，3500元，随时看房。"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnalyzing}
            />
            {isAnalyzing && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm rounded-md">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在转化内容...
                    </div>
                </div>
            )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex gap-2">
                {/* Audio */}
                {!isRecording ? (
                    <button
                        onClick={handleStartRecording}
                        disabled={isAnalyzing}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        语音输入
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
                        disabled={isRecording || isAnalyzing}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        上传图片
                    </button>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!text || isAnalyzing || isRecording}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 w-full md:w-auto"
            >
                开始提取房源
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;