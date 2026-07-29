import { hashDeviceToken } from "@/src/lib/device-token";

export function hashWatchDeviceToken(token: string) {
  return hashDeviceToken(token);
}
