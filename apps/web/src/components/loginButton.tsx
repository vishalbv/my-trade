"use client";

import { useState } from "react";
import { preLogin } from "../store/reducerActions/appActions";

const LoginButton = () => {
  const [value, setValue] = useState(false);
  const loggedIn = false;

  const loginLogout = (e: any) => {
    if (e.target.checked) {
      if (!e.nativeEvent.metaKey) return;
      // getSocketRef().emit("app", { loggingIn: true });
      preLogin({ broker: "fyers" });
    } else {
      // getSocketRef().emit("app", { loggingIn: false });
      // logout({});
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
