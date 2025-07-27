import { auth } from "@/lib/auth";
import { categories, db, todoCategories, todos } from "@/lib/db";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import { z } from "zod";

export const runtime = "nodejs";

// Zod スキーマ定義
const todoCreateSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  categoryIds: z.array(z.number()).optional(), // カテゴリID配列を追加
});

const todoUpdateSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  categoryIds: z.array(z.number()).optional(), // カテゴリID配列を追加
});

const todoParamSchema = z.object({
  id: z.string().pipe(z.coerce.number()),
});

const categoryCreateSchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  color: z.string().default("#3b82f6"),
});

const categoryUpdateSchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").optional(),
  color: z.string().optional(),
});

const categoryParamSchema = z.object({
  id: z.string().pipe(z.coerce.number()),
});

// Hono型定義
type Env = {
  Variables: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
};

const app = new Hono<Env>().basePath("/api");

// CORS設定
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// BetterAuth API
app.mount("/auth", auth.handler);

// 認証ミドルウェア
const requireAuth = async (c: Context<Env>, next: () => Promise<void>) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// Hono RPC用のチェーン形式ルーティング定義
const routes = app
  // Hello endpoint (テスト用)
  .get("/hello", (c) => {
    return c.json({
      message: "Hello from Hono + BetterAuth + Zod!",
    });
  })

  // ToDo API Routes（Zod validation付き）
  .get("/todos", requireAuth, async (c) => {
    try {
      const user = c.get("user");

      // ToDoとカテゴリを結合して取得
      const userTodos = await db
        .select({
          id: todos.id,
          title: todos.title,
          description: todos.description,
          completed: todos.completed,
          userId: todos.userId,
          createdAt: todos.createdAt,
          updatedAt: todos.updatedAt,
        })
        .from(todos)
        .where(eq(todos.userId, user.id))
        .orderBy(desc(todos.createdAt));

      // 各ToDoのカテゴリを個別に取得
      const todosWithCategories = await Promise.all(
        userTodos.map(async (todo) => {
          const todoCategs = await db
            .select({
              id: categories.id,
              name: categories.name,
              color: categories.color,
            })
            .from(todoCategories)
            .innerJoin(categories, eq(todoCategories.categoryId, categories.id))
            .where(eq(todoCategories.todoId, todo.id));

          return {
            ...todo,
            categories: todoCategs,
          };
        })
      );

      return c.json(todosWithCategories);
    } catch (error) {
      return c.json({ error: "Failed to fetch todos" }, 500);
    }
  })

  .post(
    "/todos",
    requireAuth,
    zValidator("json", todoCreateSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { title, description, categoryIds } = c.req.valid("json");

        // ToDoを作成
        const newTodo = await db
          .insert(todos)
          .values({
            title,
            description: description || null,
            userId: user.id,
          })
          .returning();

        // カテゴリが指定されている場合は関係を作成
        if (categoryIds && categoryIds.length > 0) {
          await db.insert(todoCategories).values(
            categoryIds.map((categoryId) => ({
              todoId: newTodo[0].id,
              categoryId,
            }))
          );
        }

        // カテゴリ情報を含めて返す
        const todoCategs = categoryIds
          ? await db
              .select({
                id: categories.id,
                name: categories.name,
                color: categories.color,
              })
              .from(categories)
              .where(eq(categories.id, categoryIds[0])) // 最初のカテゴリのみ簡易実装
          : [];

        return c.json({
          ...newTodo[0],
          categories: todoCategs,
        });
      } catch (error) {
        return c.json({ error: "Failed to create todo" }, 500);
      }
    }
  )

  .put(
    "/todos/:id",
    requireAuth,
    zValidator("param", todoParamSchema),
    zValidator("json", todoUpdateSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { id } = c.req.valid("param");
        const { categoryIds, ...updateData } = c.req.valid("json");

        // ToDoを更新
        const updatedTodo = await db
          .update(todos)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
          .returning();

        if (updatedTodo.length === 0) {
          return c.json({ error: "Todo not found" }, 404);
        }

        // カテゴリが指定されている場合は更新
        if (categoryIds !== undefined) {
          // 既存のカテゴリ関係を削除
          await db.delete(todoCategories).where(eq(todoCategories.todoId, id));

          // 新しいカテゴリ関係を作成
          if (categoryIds.length > 0) {
            await db.insert(todoCategories).values(
              categoryIds.map((categoryId) => ({
                todoId: id,
                categoryId,
              }))
            );
          }
        }

        // カテゴリ情報を含めて返す
        const todoCategs = await db
          .select({
            id: categories.id,
            name: categories.name,
            color: categories.color,
          })
          .from(todoCategories)
          .innerJoin(categories, eq(todoCategories.categoryId, categories.id))
          .where(eq(todoCategories.todoId, id));

        return c.json({
          ...updatedTodo[0],
          categories: todoCategs,
        });
      } catch (error) {
        return c.json({ error: "Failed to update todo" }, 500);
      }
    }
  )

  .delete(
    "/todos/:id",
    requireAuth,
    zValidator("param", todoParamSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { id } = c.req.valid("param");

        // カテゴリ関係を先に削除（外部キー制約のため）
        await db.delete(todoCategories).where(eq(todoCategories.todoId, id));

        // ToDoを削除
        const deletedTodo = await db
          .delete(todos)
          .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
          .returning();

        if (deletedTodo.length === 0) {
          return c.json({ error: "Todo not found" }, 404);
        }

        return c.json({ message: "Todo deleted successfully" });
      } catch (error) {
        return c.json({ error: "Failed to delete todo" }, 500);
      }
    }
  )

  // Categories API（Zod validation付き）
  .get("/categories", requireAuth, async (c) => {
    try {
      const user = c.get("user");
      const userCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, user.id))
        .orderBy(desc(categories.createdAt));

      return c.json(userCategories);
    } catch (error) {
      return c.json({ error: "Failed to fetch categories" }, 500);
    }
  })

  .post(
    "/categories",
    requireAuth,
    zValidator("json", categoryCreateSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { name, color } = c.req.valid("json");

        const newCategory = await db
          .insert(categories)
          .values({
            name,
            color,
            userId: user.id,
          })
          .returning();

        return c.json(newCategory[0]);
      } catch (error) {
        return c.json({ error: "Failed to create category" }, 500);
      }
    }
  )

  .put(
    "/categories/:id",
    requireAuth,
    zValidator("param", categoryParamSchema),
    zValidator("json", categoryUpdateSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { id } = c.req.valid("param");
        const { name, color } = c.req.valid("json");

        const updatedCategory = await db
          .update(categories)
          .set({
            name: name || undefined,
            color: color || undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
          .returning();

        if (updatedCategory.length === 0) {
          return c.json({ error: "Category not found" }, 404);
        }

        return c.json(updatedCategory[0]);
      } catch (error) {
        return c.json({ error: "Failed to update category" }, 500);
      }
    }
  )

  .delete(
    "/categories/:id",
    requireAuth,
    zValidator("param", categoryParamSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const { id } = c.req.valid("param");

        // カテゴリ関係を先に削除（外部キー制約のため）
        await db
          .delete(todoCategories)
          .where(eq(todoCategories.categoryId, id));

        // カテゴリを削除
        const deletedCategory = await db
          .delete(categories)
          .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
          .returning();

        if (deletedCategory.length === 0) {
          return c.json({ error: "Category not found" }, 404);
        }

        return c.json({ message: "Category deleted successfully" });
      } catch (error) {
        return c.json({ error: "Failed to delete category" }, 500);
      }
    }
  );

// Hono RPC用の型エクスポート（チェーン形式）
export type AppType = typeof routes;

export const GET = handle(routes);
export const POST = handle(routes);
export const PUT = handle(routes);
export const DELETE = handle(routes);
