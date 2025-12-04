import React, { useState, useEffect } from 'react';
import { PropertyData, TaskItem, AppView } from './types';
import InputSection from './components/InputSection';
import PropertyForm from './components/PropertyForm';
import HistoryList from './components/HistoryList';
import { processPropertyInput } from './services/geminiService';

const INITIAL_PROPERTY_DATA: PropertyData = {
  communityName: '',
  price: '',
  rentOrSale: 'Rent',
  layout: '',
  area: 0,
  floor: '',
  orientation: '',
  contactName: '',
  contactPhone: '',
  additionalNotes: '',
};

function App() {
  const [view, setView] = useState<AppView>(AppView.CREATE);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return (saved as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  
  // Current Editing State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formData, setFormData] = useState<PropertyData>(INITIAL_PROPERTY_DATA);
  
  // UI States
  const [showForm, setShowForm] = useState(false);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Load tasks from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('property_tasks');
    if (saved) {
      try {
        const parsed: TaskItem[] = JSON.parse(saved);
        setTasks(parsed);
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, []);

  // Save tasks to local storage whenever it changes
  useEffect(() => {
    const cleanTasks = tasks.map(t => {
        if (t.status === 'processing') return t; 

        if (t.status === 'failed') {
            return {
                ...t,
                sourceInput: {
                    ...t.sourceInput,
                    image: null,
                    audio: null,
                    text: t.sourceInput?.text || ''
                }
            }
        }
        return t;
    });
    localStorage.setItem('property_tasks', JSON.stringify(cleanTasks));
  }, [tasks]);

  // --- Task Helpers ---

  const createSuccessTasks = (listings: PropertyData[]) => {
      const newTasks: TaskItem[] = listings.map(data => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          status: 'success',
          description: `${data.communityName} ${data.layout} ${data.price}元`,
          extractedData: data,
          isPublished: false
      }));
      return newTasks;
  };

  const createFailedTask = (text: string, image: File | null, audio: Blob | null, errorMsg: string) => {
      let desc = text;
      if (!desc) {
          if (audio) desc = "[语音输入]";
          else if (image) desc = "[图片输入]";
          else desc = "未知输入";
      }

      const newTask: TaskItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          status: 'failed',
          description: desc,
          errorMessage: errorMsg,
          sourceInput: {
              text,
              image,
              audio
          }
      };
      return newTask;
  };

  const createProcessingTask = (text: string, image: File | null, audio: Blob | null) => {
      let desc = text;
      if (!desc) {
          if (audio) desc = "[语音输入]";
          else if (image) desc = "[图片输入]";
          else desc = "未知输入";
      }
      return {
          id: 'processing-' + Date.now(),
          timestamp: Date.now(),
          status: 'processing' as const,
          description: desc,
          sourceInput: { text, image, audio }
      };
  };

  // --- Core Processing Logic ---

  const runGeminiProcessing = async (taskId: string, text: string, image: File | null, audio: Blob | null) => {
    try {
        const listings = await processPropertyInput(text, image, audio);
        
        if (listings.length > 0) {
            const successTasks = createSuccessTasks(listings);
            setTasks(prev => {
                const filtered = prev.filter(t => t.id !== taskId);
                return [...successTasks, ...filtered];
            });
        } else {
            throw new Error("未能识别到有效房源信息");
        }
    } catch (error: any) {
        const failedTask = createFailedTask(text, image, audio, error.message || "未知错误");
        setTasks(prev => {
            const filtered = prev.filter(t => t.id !== taskId);
            return [failedTask, ...filtered];
        });
    }
  };

  const handleProcess = (text: string, image: File | null, audio: Blob | null) => {
    const processingTask = createProcessingTask(text, image, audio);
    setTasks(prev => [processingTask, ...prev]);
    
    // Process without changing view, as logs are now on the same page
    runGeminiProcessing(processingTask.id, text, image, audio);
  };

  const handleRetry = (item: TaskItem) => {
      if (!item.sourceInput) return;
      
      setTasks(prev => prev.filter(t => t.id !== item.id));
      
      const processingTask = createProcessingTask(item.sourceInput.text, item.sourceInput.image || null, item.sourceInput.audio || null);
      setTasks(prev => [processingTask, ...prev]);
      runGeminiProcessing(processingTask.id, item.sourceInput.text, item.sourceInput.image || null, item.sourceInput.audio || null);
  };

  // --- Form Handlers ---

  const handleSelectTask = (item: TaskItem) => {
    if (item.status === 'success' && item.extractedData) {
        setEditingTask(item);
        setFormData(item.extractedData);
        setShowForm(true);
    }
  };

  const handleSaveForm = (asTemplate: boolean = false) => {
    if (!editingTask) return;

    setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
            return {
                ...t,
                extractedData: formData,
                isPublished: !asTemplate, 
                isTemplate: asTemplate,
                description: `${formData.communityName} ${formData.layout} ${formData.price}元` 
            };
        }
        return t;
    }));
    
    setShowForm(false);
    setEditingTask(null);
    setFormData(INITIAL_PROPERTY_DATA);
    
    if(asTemplate) {
        alert("已存为模版");
        setView(AppView.TEMPLATES);
    } else {
        alert("房源发布成功！");
    }
  };

  const templates = tasks.filter(h => h.isTemplate);
  const logItems = tasks.filter(h => !h.isTemplate); // All history (processed, failed, published, unpublished)
  const unpublishedItems = tasks.filter(h => !h.isTemplate && h.status === 'success' && !h.isPublished);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-sm">
                    房
                </div>
                <h1 className="text-lg font-semibold tracking-tight">房源随手记</h1>
            </div>
            
            <button 
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
                {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                )}
            </button>
        </header>

        {/* Navigation Tabs (Segmented Control style) */}
        {!showForm && (
            <div className="mt-8 flex justify-center">
                <div className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground whitespace-nowrap shadow-inner">
                    <button 
                        onClick={() => setView(AppView.CREATE)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === AppView.CREATE ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50 hover:text-foreground'}`}
                    >
                        工作台
                    </button>
                    <button 
                        onClick={() => setView(AppView.UNPUBLISHED)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === AppView.UNPUBLISHED ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50 hover:text-foreground'}`}
                    >
                        待发布 ({unpublishedItems.length})
                    </button>
                    <button 
                        onClick={() => setView(AppView.TEMPLATES)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === AppView.TEMPLATES ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50 hover:text-foreground'}`}
                    >
                        我的模版 ({templates.length})
                    </button>
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <main className="py-8">
            
            {showForm ? (
            <PropertyForm 
                data={formData}
                onChange={setFormData}
                onSave={() => handleSaveForm(false)}
                onSaveAsTemplate={() => handleSaveForm(true)}
                onCancel={() => { setShowForm(false); setEditingTask(null); }}
            />
            ) : (
            <div className="mx-auto space-y-8">
                {view === AppView.CREATE && (
                <div className="flex flex-col gap-8">
                    {/* Input Section - Removed max-w-3xl for better width alignment */}
                    <div className="w-full">
                        <InputSection onProcess={handleProcess} isProcessing={false} />
                    </div>
                    
                    {/* Task Log integrated here */}
                    <div className="w-full">
                         <HistoryList 
                            items={logItems} 
                            title="任务日志" 
                            onSelect={handleSelectTask}
                            onRetry={handleRetry}
                        />
                    </div>

                    {/* Tips Section */}
                    <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center space-x-2 mb-4">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                             </div>
                             <h4 className="font-semibold leading-none tracking-tight">使用小贴士</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="mt-1 shrink-0 rounded-full bg-muted p-1">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m16.24 7.76-2.12 2.12a6 6 0 0 1-8.49 8.49L2.83 21.17a2 2 0 0 1-2.83-2.83l2.8-2.8a6 6 0 0 1 8.49-8.49l2.12-2.12a2 2 0 0 1 2.83 0l2.83 2.83a2 2 0 0 1 0 2.83Z"/><path d="M21 12a9 9 0 1 1-6.21-1.61L12 13.59"/></svg>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium block mb-1">支持批量识别</span>
                                    <span className="text-muted-foreground">您可以一次性输入多段描述，AI 将自动拆分为多个独立任务。</span>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                 <div className="mt-1 shrink-0 rounded-full bg-muted p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium block mb-1">输入示例</span>
                                    <span className="text-muted-foreground">"天通苑两居5000，回龙观一居3000，车位出租500/月"</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {view === AppView.UNPUBLISHED && (
                <HistoryList 
                    items={unpublishedItems} 
                    title="待发布房源" 
                    onSelect={handleSelectTask}
                    onRetry={() => {}} 
                />
                )}

                {view === AppView.TEMPLATES && (
                <HistoryList 
                    items={templates} 
                    title="我的模版" 
                    onSelect={handleSelectTask}
                    onRetry={() => {}} 
                />
                )}
            </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;