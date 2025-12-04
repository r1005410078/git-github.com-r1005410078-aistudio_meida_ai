import React from 'react';
import { PropertyData } from '../types';

interface PropertyFormProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
  onSave: () => void;
  onSaveAsTemplate: () => void;
  onCancel: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ data, onChange, onSave, onSaveAsTemplate, onCancel }) => {
  
  const handleChange = (field: keyof PropertyData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <div className="flex justify-between items-center">
             <h3 className="font-semibold leading-none tracking-tight">房源详情确认</h3>
             <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {data.rentOrSale === 'Rent' ? '出租' : '出售'}
             </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Community Name */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">小区 / 大厦名称</label>
          <input
            type="text"
            value={data.communityName}
            onChange={(e) => handleChange('communityName', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="例如：天通苑"
          />
        </div>

        {/* Price & Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">价格 (元)</label>
          <input
            type="number"
            value={data.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="0"
          />
        </div>
        
        <div className="space-y-2">
           <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">类型</label>
           <div className="flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
             <button
                onClick={() => handleChange('rentOrSale', 'Rent')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                data.rentOrSale === 'Rent' ? 'bg-background text-foreground shadow-sm' : ''
                }`}
            >
                出租
            </button>
            <button
                onClick={() => handleChange('rentOrSale', 'Sale')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                data.rentOrSale === 'Sale' ? 'bg-background text-foreground shadow-sm' : ''
                }`}
            >
                出售
            </button>
           </div>
        </div>

        {/* Layout & Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">户型</label>
          <input
            type="text"
            value={data.layout}
            onChange={(e) => handleChange('layout', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="例如：2室1厅"
          />
        </div>

        <div className="space-y-2">
           <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">面积 (㎡)</label>
           <input
            type="number"
            value={data.area}
            onChange={(e) => handleChange('area', parseFloat(e.target.value) || 0)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
             placeholder="0"
           />
        </div>

        {/* Floor & Orientation */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">楼层</label>
          <input
            type="text"
            value={data.floor}
            onChange={(e) => handleChange('floor', e.target.value)}
             className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
             placeholder="例如：中楼层"
          />
        </div>
        
         <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">朝向</label>
          <input
            type="text"
            value={data.orientation}
            onChange={(e) => handleChange('orientation', e.target.value)}
             className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
             placeholder="例如：南"
          />
        </div>

        {/* Contact Info */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">联系人</label>
                <input
                    type="text"
                    value={data.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">联系电话</label>
                <input
                    type="text"
                    value={data.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
             </div>
        </div>

        {/* Additional Notes */}
         <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">备注说明</label>
            <textarea
                value={data.additionalNotes}
                onChange={(e) => handleChange('additionalNotes', e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                rows={2}
            />
         </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center p-6 pt-0 gap-2 justify-end">
        <button 
            onClick={onCancel}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
            取消
        </button>
         <button 
            onClick={onSaveAsTemplate}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
            存为模版
        </button>
        <button 
            onClick={onSave}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
            确认发布
        </button>
      </div>
    </div>
  );
};

export default PropertyForm;