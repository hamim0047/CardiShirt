import { createSlice } from "@reduxjs/toolkit";

const savedUser = localStorage.getItem("cardishirt_user");
const savedToken = localStorage.getItem("cardishirt_token");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,
  },
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem("cardishirt_user", JSON.stringify(action.payload.user));
      localStorage.setItem("cardishirt_token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("cardishirt_user");
      localStorage.removeItem("cardishirt_token");
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export default authSlice.reducer;