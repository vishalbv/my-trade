"use client";
import { useEffect } from "react";
import Ripple from "../../src/components/ripple";
import PreLogin from "../prelogin";
import { login } from "../../src/store/actions/appActions";
import { RootState } from "../../src/store/store";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function Login() {
  const { loggedIn } = useSelector(({ states }: RootState) => states.app || {});

  const router = useRouter();
  const loginBorkers = async () => {
    var url = new URL(window.location.href);
    var auth_code = url.searchParams.get("auth_code");
    const result = await login({ broker: "shoonya" });
    const result2 = await login({ broker: "fyers", auth_code });
    // const result3 = await login({ broker: "flattrade" });
    console.log(result, result2);
  };
  useEffect(() => {
    loginBorkers();
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
