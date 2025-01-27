"use client";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const NoSSRWrapper = (props: { children: React.ReactNode }) => (
  <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>
);

export default dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});
