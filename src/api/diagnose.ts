import http from "@/common/http";
import { SlowSubConfig, SlowSubStatistic } from "@/types/diagnose";
import { downloadBlobData } from "@/common/tools";
import axios from "axios";
import { API_BASE_URL } from "@/common/constants";
import {
  requestInterceptorAddHeader,
  requestInterceptorHandleError,
  requestInterceptorHandleRequestQueue,
  responseInterceptorHandleError,
  setProgressBarDone,
} from "@/common/http";

export const querySlowSubConfig = (): Promise<SlowSubConfig> => {
  return http.get("/slow_subscriptions/settings");
};

export const updateSlowSubConfig = (data: SlowSubConfig) => {
  return http.put("/slow_subscriptions/settings", data);
};

export const clearSlowSubData = () => {
  return http.delete("/slow_subscriptions");
};

export const querySlowSubStatistics = async (): Promise<Array<SlowSubStatistic>> => {
  try {
    const { data = [] } = await http.get("/slow_subscriptions", { params: { limit: 1000, page: 1 } });
    return Promise.resolve(data);
  } catch (error) {
    return Promise.reject(error);
  }
};

export function getTraceList() {
  return http.get("/trace");
}

export function addTrace(body: Record<string, unknown>) {
  return http.post("/trace", body);
}

export function getTraceLog(name: string, params: Record<string, unknown>) {
  if (!name) return false;
  return http.get(`/trace/${encodeURIComponent(name)}/log`, { params });
}

export async function downloadTrace(name: string) {
  try {
    const selfHttp = axios.create({ baseURL: API_BASE_URL });
    selfHttp.interceptors.request.use(
      requestInterceptorAddHeader,
      requestInterceptorHandleError
    );
    selfHttp.interceptors.request.use(requestInterceptorHandleRequestQueue);
    selfHttp.interceptors.response.use((res) => {
      setProgressBarDone();
      return res;
    }, responseInterceptorHandleError);
    const res = await selfHttp.get(
      `/trace/${encodeURIComponent(name)}/download`,
      {
        responseType: "blob",
      }
    );
    downloadBlobData(res);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}
export function stopTrace(name: string) {
  return http.put(`/trace/${encodeURIComponent(name)}/stop`);
}

export function deleteTrace(name: string) {
  return http.delete(`/trace/${encodeURIComponent(name)}`);
}
