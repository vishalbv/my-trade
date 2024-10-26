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

export default notify;
