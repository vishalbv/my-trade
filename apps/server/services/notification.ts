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
  sendMessage("notification", {
    type,
    data,
    // You can add more properties from data if needed
  });
};

export default notify;
