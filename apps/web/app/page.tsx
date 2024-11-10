"use client";
import { useSelector } from "react-redux";
import LoginButton from "../src/components/loginButton";
import PreLogin from "./prelogin";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ripple from "../src/components/ripple";

export default function Home() {
  const loggedIn = useSelector(({ state }: any) => state.app?.loggedIn);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (loggedIn === undefined) return;
    if (loggedIn) {
      router.push("/home");
    } else {
      setLoading(false);
    }
  }, [loggedIn]);
  return <PreLogin>{loading ? <Ripple /> : <LoginButton />}</PreLogin>;
}
