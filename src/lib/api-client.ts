import type { AppType } from "@/app/api/[...route]/route";
import type { InferResponseType } from "hono/client";
import { hc } from "hono/client";

// Hono RPC Client（公式準拠）
export const client = hc<AppType>("/", {
  init: {
    credentials: "include",
  },
});

// Hono RPCの型推論を使用（成功時の型のみ）
export type TodosResponse = InferResponseType<
  typeof client.api.todos.$get,
  200
>;
export type CategoriesResponse = InferResponseType<
  typeof client.api.categories.$get,
  200
>;

// 個別のTodo型（カテゴリ情報を含む）
export type TodoWithCategories = TodosResponse[0];
export type CategoryDetail = CategoriesResponse[0];
