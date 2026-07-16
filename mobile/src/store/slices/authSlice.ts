import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../../api/endpoints";
import { setTokens, clearTokens, loadTokensFromStorage, getAccessToken } from "../../api/client";
import { User } from "../../types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  pendingMobile: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  pendingMobile: null,
};

export const requestOtp = createAsyncThunk("auth/requestOtp", async (mobile: string) => {
  const { data } = await authApi.requestOtp(mobile);
  return { mobile, devOtp: data.devOtp as string | undefined };
});

export const verifyOtp = createAsyncThunk("auth/verifyOtp", async ({ mobile, otp }: { mobile: string; otp: string }) => {
  const { data } = await authApi.verifyOtp(mobile, otp);
  await setTokens(data.accessToken, data.refreshToken);
  return data.user as User;
});

export const createAccount = createAsyncThunk(
  "auth/createAccount",
  async ({ mobile, name }: { mobile: string; name: string }) => {
    const { data } = await authApi.createAccount(mobile, name);
    return data.user as User;
  }
);

export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async () => {
  await loadTokensFromStorage();
  if (!getAccessToken()) return null;
  const { data } = await authApi.me();
  return data.user as User;
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } finally {
    await clearTokens();
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.status = "idle";
        state.pendingMobile = action.payload.mobile;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Failed to send OTP";
      })
      .addCase(verifyOtp.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Invalid OTP";
      })
      .addCase(createAccount.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? "authenticated" : "idle";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
      });
  },
});

export default authSlice.reducer;
