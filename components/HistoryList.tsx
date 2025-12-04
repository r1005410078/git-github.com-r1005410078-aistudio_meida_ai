import React from 'react';
import { TaskItem } from '../types';

interface TaskLogProps {
  items: TaskItem[];
  onSelect: (item: TaskItem) => void;
  onRetry: (item: TaskItem) => void;
  title: string;
}

const HistoryList: React.FC<TaskLogProps> = ({ items, onSelect, onRetry, title }) => {
  if (items.length === 0) {
      if (!title) return null; // If no title (main log) and no items, hide completely or show small hint
      
      return (
          <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <p className="text-sm text-muted-foreground">暂无{title || '数据'}</p>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold tracking-tight ml-1">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col transition-colors ${
                item.status === 'success' ? 'hover:bg-accent/50 cursor-pointer' : ''
            }`}
            onClick={() => item.status === 'success' && onSelect(item)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
                 <div className="flex items-center gap-2">
                     {item.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                             <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            处理中
                        </div>
                     ) : (
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                             item.status === 'success' 
                             ? (item.isPublished ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' : 'border-transparent bg-green-500 text-white hover:bg-green-600')
                             : 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80'
                         }`}>
                             {item.status === 'success' ? (item.isPublished ? '已发布' : '识别成功') 
                              : '失败'}
                         </div>
                     )}
                 </div>
                 <span className="text-xs text-muted-foreground">
                     {new Date(item.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
                 </span>
            </div>

            <div className="p-4 pt-2 flex-1 flex flex-col">
                {item.status === 'processing' ? (
                     <div className="flex flex-col gap-2 justify-center py-4">
                        <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                    </div>
                ) : item.status === 'success' && item.extractedData ? (
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div>
                            <h4 className="font-semibold leading-none tracking-tight line-clamp-1">
                                {item.extractedData.communityName || "未命名房源"}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                {item.extractedData.layout} • {item.extractedData.area}m²
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {item.description}
                            </p>
                        </div>
                        <div className="flex justify-between items-end border-t pt-3">
                             <span className="text-xs px-2 py-0.5 rounded-full border bg-secondary text-secondary-foreground">
                                {item.extractedData.rentOrSale === 'Rent' ? '出租' : '出售'}
                            </span>
                             <span className="font-bold text-lg">
                                {item.extractedData.price ? `¥${item.extractedData.price}` : '面议'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 flex-1">
                        <p className="text-sm font-medium">任务描述:</p>
                        <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground line-clamp-3">
                             {item.description}
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4">
                            <span className="text-xs text-destructive truncate mr-2 font-medium">{item.errorMessage || "Error"}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRetry(item); }}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background h-8 px-3 hover:bg-accent hover:text-accent-foreground"
                            >
                                重试
                            </button>
                        </div>
                    </div>
                )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;