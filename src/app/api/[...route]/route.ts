import { auth } from "@/lib/auth";
import { categories, db, todos } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

export const runtime = "nodejs";

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
const requireAuth = async (c: Context, next: () => Promise<void>) => {
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

// Hello endpoint (テスト用)
app.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono + BetterAuth + Next.js!",
  });
});

// ToDo API Routes
app.get("/todos", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, user.id))
      .orderBy(todos.createdAt);

    return c.json(userTodos);
  } catch (error) {
    return c.json({ error: "Failed to fetch todos" }, 500);
  }
});

app.post("/todos", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    if (!body.title || body.title.trim() === "") {
      return c.json({ error: "Title is required" }, 400);
    }

    const newTodo = await db
      .insert(todos)
      .values({
        title: body.title.trim(),
        description: body.description || null,
        userId: user.id,
      })
      .returning();

    return c.json(newTodo[0]);
  } catch (error) {
    return c.json({ error: "Failed to create todo" }, 500);
  }
});

app.put("/todos/:id", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const todoId = parseInt(c.req.param("id"));
    const body = await c.req.json();

    if (isNaN(todoId)) {
      return c.json({ error: "Invalid todo ID" }, 400);
    }

    const updatedTodo = await db
      .update(todos)
      .set({
        title: body.title?.trim(),
        description: body.description,
        completed: body.completed,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, todoId), eq(todos.userId, user.id)))
      .returning();

    if (updatedTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json(updatedTodo[0]);
  } catch (error) {
    return c.json({ error: "Failed to update todo" }, 500);
  }
});

app.delete("/todos/:id", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const todoId = parseInt(c.req.param("id"));

    if (isNaN(todoId)) {
      return c.json({ error: "Invalid todo ID" }, 400);
    }

    const deletedTodo = await db
      .delete(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, user.id)))
      .returning();

    if (deletedTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

// Categories API
app.get("/categories", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(categories.createdAt);

    return c.json(userCategories);
  } catch (error) {
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

app.post("/categories", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    if (!body.name || body.name.trim() === "") {
      return c.json({ error: "Category name is required" }, 400);
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name: body.name.trim(),
        color: body.color || "#3b82f6",
        userId: user.id,
      })
      .returning();

    return c.json(newCategory[0]);
  } catch (error) {
    return c.json({ error: "Failed to create category" }, 500);
  }
});

// Hono RPC用の型エクスポート
export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
