"use client";
import { useEffect } from "react";
import Ripple from "../../src/components/ripple";
import PreLogin from "../prelogin";
import { login } from "../../src/store/reducerActions/appActions";
import { RootState } from "../../src/store/store";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function Login() {
  const { loggedIn } = useSelector((state: RootState) => state.app || {});
  console.log("state2222222", loggedIn);
  const router = useRouter();
  const loginBorkers = async () => {
    var url = new URL(window.location.href);
    var auth_code = url.searchParams.get("auth_code");
    const result = await login({ broker: "shoonya" });
    const result2 = await login({ broker: "fyers", auth_code });
    console.log(result, result2);
  };
  useEffect(() => {
    loginBorkers();
    console.log("llllll");
  }, []);

  useEffect(() => {
    if (loggedIn) {
      setTimeout(() => {
        router.push("/home");
      }, 2000);
    }
  }, [loggedIn]);
  return (
    <PreLogin>
      <Ripple />
    </PreLogin>
  );
}
