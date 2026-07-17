import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: point this at your deployed backend URL for a real device/build.
// For the Expo Go / simulator + local backend combo:
//   iOS simulator -> http://localhost:4000
//   Android emulator -> http://10.0.2.2:4000
//   Physical device -> http://<your-machine-lan-ip>:4000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://lts-customer-app.onrender.com";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function loadTokensFromStorage() {
  const result = await AsyncStorage.getMany(["accessToken", "refreshToken"]);
  accessToken = result["accessToken"];
  refreshToken = result["refreshToken"];
}

export async function setTokens(at: string, rt: string) {
  accessToken = at;
  refreshToken = rt;
  await AsyncStorage.setMany({ accessToken: at, refreshToken: rt });
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await AsyncStorage.removeMany(["accessToken", "refreshToken"]);
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      if (isRefreshing) {
        // wait for the in-flight refresh to finish, then retry
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        await setTokens(data.accessToken, data.refreshToken);
        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        await clearTokens();
        pendingQueue = [];
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
