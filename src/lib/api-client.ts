import type { AppType } from "@/app/api/[...route]/route";
import { hc } from "hono/client";

// Hono RPC Client（公式準拠）
export const client = hc<AppType>("/", {
  init: {
    credentials: "include",
  },
});

// 型定義（Drizzleスキーマに合わせて修正）
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: string; // Drizzleスキーマに合わせて修正
  updatedAt: string; // Drizzleスキーマに合わせて修正
}

export interface Category {
  id: number;
  name: string;
  color: string;
  userId: string;
  createdAt: string; // Drizzleスキーマに合わせて修正
}
