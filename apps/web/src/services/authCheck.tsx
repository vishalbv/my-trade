"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import React from "react";
import notify from "./notification";

// Define paths that don't need authentication
const IGNORE_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Add more public paths here
];

function AuthCheckComponent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const loggedIn = useSelector((state) => state.app?.loggedIn);

  const handleClick = (e: MouseEvent) => {
    // Skip check if current path is in ignore list
    console.log(pathname);
    if (IGNORE_PATHS.includes(pathname)) {
      return;
    }

    if (!loggedIn) {
      e.preventDefault();
      e.stopPropagation();
      notify.error({
        title: "Token Expired",
        description: "Please login to continue",
      });
      router.push("/");
    }
  };

  React.useEffect(() => {
    // Skip adding listener if current path is in ignore list
    if (IGNORE_PATHS.includes(pathname)) {
      return;
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [loggedIn, pathname]);

  return null;
}

export default AuthCheckComponent;
