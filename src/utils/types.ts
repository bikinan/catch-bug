export interface BaseLog {
  id: string;
  timestamp: string;
}

export interface ConsoleLog extends BaseLog {
  type: "console";
  message: string;
}

export interface NetworkLog extends BaseLog {
  type: "network";
  method: string;
  url: string;
  status: number;
  statusText: string;
  requestBody?: string;
  responseBody?: string;
}

export type CapturedLog = ConsoleLog | NetworkLog;

export interface Breadcrumb {
  id: string;
  timestamp: string;
  category: "click" | "input" | "navigation";
  target: string;
  detail?: string;
}

export type PostMessagePayload =
  | {
      source: "CATCHBUG_INTERCEPTOR";
      kind?: "log";
      payload: CapturedLog;
    }
  | {
      source: "CATCHBUG_INTERCEPTOR";
      kind: "breadcrumb";
      payload: Breadcrumb;
    };
