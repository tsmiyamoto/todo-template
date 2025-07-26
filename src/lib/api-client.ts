import type { AppType } from "@/app/api/[...route]/route";
import { hc } from "hono/client";

// Hono RPC Client（公式準拠）
export const client = hc<AppType>("/", {
  init: {
    credentials: "include",
  },
});
