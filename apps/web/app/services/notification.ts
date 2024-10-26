import { toast } from "@repo/ui/use-toast";
import { sendMessage } from "./webSocket";

type NotifyType = "success" | "error" | "info";

interface ToastData {
  description: string;
  title?: string;
  [key: string]: any; // Allow for additional properties
}

type ToastInput = string | ToastData;

const notify = {
  success: (data: ToastInput) => showToast(data, "success"),
  error: (data: ToastInput) => showToast(data, "error"),
  info: (data: ToastInput) => showToast(data, "info"),
  speak: (data: ToastInput, type?: NotifyType) => {
    speakText(typeof data === "string" ? data : data.description);
    if (type) {
      showToast(data, type);
    }
  },
};

const showToast = (data: ToastInput, type: NotifyType) => {
  const toastData = typeof data === "string" ? { description: data } : data;
  toast({
    title: toastData.title,
    description: toastData.description,
    variant: type === "error" ? "destructive" : "default",
  });
};

export const notifyServerSide = ({
  data,
  type,
}: {
  data: ToastInput;
  type: NotifyType;
}) => {
  showToast(data, type);
};

export const speakText = (text: string, pitch?: number, rate?: number) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = window.speechSynthesis.getVoices()[1] || null;
  utterance.pitch = pitch || 1;
  utterance.rate = rate || 0.8;
  speechSynthesis.speak(utterance);
};

export default notify;
