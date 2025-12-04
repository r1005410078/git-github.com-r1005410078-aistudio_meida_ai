import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PropertyData } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Define the response schema for strict JSON output
// We now expect a root object containing an array of listings
const propertySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    listings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          communityName: { type: Type.STRING, description: "Name of the residential community (e.g., 天通苑, 阳光花园)" },
          price: { type: Type.NUMBER, description: "Price value only. If text says '5000/month', put 5000." },
          rentOrSale: { type: Type.STRING, enum: ["Rent", "Sale"], description: "Rent (出租) or Sale (出售)" },
          layout: { type: Type.STRING, description: "Layout description (e.g., 2室1厅, 3房2卫)" },
          area: { type: Type.NUMBER, description: "Size of the property in square meters" },
          floor: { type: Type.STRING, description: "Floor level (e.g., 中楼层, 5层)" },
          orientation: { type: Type.STRING, description: "Facing direction (e.g., 南, 南北通透)" },
          contactName: { type: Type.STRING, description: "Contact person name (e.g., 王先生)" },
          contactPhone: { type: Type.STRING, description: "Phone number extracted" },
          additionalNotes: { type: Type.STRING, description: "Any other details in Chinese" },
        },
        required: ["communityName", "rentOrSale"],
      }
    }
  }
};

export const processPropertyInput = async (
  textInput: string,
  imageFile?: File | null,
  audioBlob?: Blob | null
): Promise<PropertyData[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const modelId = "gemini-2.5-flash"; 

  const parts: any[] = [];

  // 1. Add System Instruction / Prompt (Optimized for Chinese & Multiple Items)
  const prompt = `
    你是一个专业的房地产数据助手。
    请分析提供的输入（文本、图片或音频），提取房源关键信息。
    
    规则：
    1. 输入可能包含 **多个** 房源信息，请务必将它们全部分开提取。
    2. 如果缺少某个字段，请使用合理的默认值（例如空字符串或0）。
    3. rentOrSale 字段必须严格对应 "Rent" (出租/租房) 或 "Sale" (出售/卖房)。
    4. 如果是中文输入，提取的内容（如朝向、户型）请保持中文。
    5. 如果提供了音频，请先在内部转录音频内容，然后提取数据。
  `;
  
  if (textInput) {
    parts.push({ text: prompt + `\n\n用户描述: ${textInput}` });
  } else {
     parts.push({ text: prompt });
  }

  // 2. Handle Image
  if (imageFile) {
    const base64Image = await fileToBase64(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64Image,
      },
    });
  }

  // 3. Handle Audio
  if (audioBlob) {
    const base64Audio = await blobToBase64(audioBlob);
    parts.push({
      inlineData: {
        mimeType: audioBlob.type || "audio/webm",
        data: base64Audio,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: propertySchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const parsedResponse = JSON.parse(jsonText);
    
    if (parsedResponse && Array.isArray(parsedResponse.listings)) {
        return parsedResponse.listings;
    }
    
    return [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper utils
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};