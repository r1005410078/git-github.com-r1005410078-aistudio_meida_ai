export interface PropertyData {
  communityName: string;
  price: number | string; // Allow flexibility for "Negotiable"
  rentOrSale: 'Rent' | 'Sale';
  layout: string; // e.g., "2 Bedroom 1 Living Room"
  area: number; // in square meters
  floor: string; // e.g., "Middle Floor"
  orientation: string; // e.g., "South"
  contactName: string;
  contactPhone: string;
  additionalNotes: string;
}

export type TaskStatus = 'success' | 'failed' | 'processing';

export interface TaskItem {
  id: string;
  timestamp: number;
  status: TaskStatus;
  
  // Display text in the log (Summary for success, Input snippet for failure)
  description: string;

  // If Success
  extractedData?: PropertyData;
  isPublished?: boolean; // If user has confirmed/saved it
  isTemplate?: boolean;

  // If Failed (Store input to allow Retry)
  sourceInput?: {
    text: string;
    // Note: Persisting File/Blob in localStorage is not feasible. 
    // Retries with media only work within the same session.
    image?: File | null;
    audio?: Blob | null;
  };
  errorMessage?: string;
}

export enum AppView {
  CREATE = 'CREATE',
  TASK_LOG = 'TASK_LOG',
  TEMPLATES = 'TEMPLATES',
  UNPUBLISHED = 'UNPUBLISHED',
}

export interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
}