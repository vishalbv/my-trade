import { RequestInit } from "next/dist/server/web/spec-extension/request";
import notify from "./notification";
import { API_URL } from "@repo/utils/constants";

interface ApiResponse<T> {
  status: number;
  message?: string;
  data?: T;
}

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const defaultHeaders = {
  "Content-Type": "application/json",
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiResponse<T> = await response.json();
    throw new ApiError(
      errorData.message || "An error occurred",
      response.status,
      errorData.data
    );
  }

  const data: ApiResponse<T> = await response.json();

  if (data.message) {
    data.status === 200
      ? notify.success(data.message)
      : notify.error(data.message);
  }

  return data.data as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: defaultHeaders,
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  };

  try {
    const response = await fetch(url, mergedOptions);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else if (error instanceof Error) {
      notify.error("An unexpected error occurred");
      console.error("API request failed:", error);
      throw new ApiError(error.message, 500);
    } else {
      notify.error("An unknown error occurred");
      console.error("Unknown error:", error);
      throw new ApiError("An unknown error occurred", 500);
    }
  }
}

export async function postRequest<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Example usage:
// const data = await postRequest<YourDataType>('/your-endpoint', { key: 'value' });
