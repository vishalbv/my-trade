"use client";
import React, { useEffect, useState } from "react";

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <button
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={() => setHasError(false)}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return null;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error in ErrorBoundary:", error);
    setHasError(true);
    return null;
  }
};

export default ErrorBoundary;
