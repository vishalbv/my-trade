"use client";

import { useState } from "react";
import { logout, preLogin } from "../store/actions/appActions";
import { sendMessage } from "../services/webSocket";
import { useRouter } from "next/navigation";

const LoginButton = () => {
  const [value, setValue] = useState(false);
  const loggedIn = false;
  const router = useRouter();

  const loginLogout = (e: any) => {
    if (e.target.checked) {
      if (!e.nativeEvent.metaKey) return;
      sendMessage("app", { loggingIn: true });
      const autoLoginCallback = () => {
        router.push("/login");
      };
      preLogin({ broker: "fyers" }, autoLoginCallback);
    } else {
      logout({});
      sendMessage("app", { loggingIn: false });
    }
    setValue(e.target.checked);
  };
  return (
    <div className="toggle-login">
      <div className="toggle-btn" id="login-toggle-btn">
        <input
          type="checkbox"
          checked={value || loggedIn || false}
          onChange={loginLogout}
        />
        <span></span>
      </div>
      <div>
        {/* <span>{value || loggedIn ? "Logout" : ""}</span>
      <span>{!(value || loggedIn) ? "Login" : ""}</span> */}
      </div>
    </div>
  );
};

export default LoginButton;
