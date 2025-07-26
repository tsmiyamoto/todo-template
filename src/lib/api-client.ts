// 型定義
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  userId: string;
  created_at: string;
}

// 型安全なAPIクライアント
class ApiClient {
  private baseURL = "";

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // ToDo API
  todos = {
    list: (): Promise<Todo[]> => this.request<Todo[]>("/api/todos"),

    create: (data: { title: string; description?: string }): Promise<Todo> =>
      this.request<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      id: number,
      data: { title?: string; description?: string; completed?: boolean }
    ): Promise<Todo> =>
      this.request<Todo>(`/api/todos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: number): Promise<{ message: string }> =>
      this.request<{ message: string }>(`/api/todos/${id}`, {
        method: "DELETE",
      }),
  };

  // Categories API
  categories = {
    list: (): Promise<Category[]> =>
      this.request<Category[]>("/api/categories"),

    create: (data: { name: string; color?: string }): Promise<Category> =>
      this.request<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Test API
  hello = (): Promise<{ message: string }> =>
    this.request<{ message: string }>("/api/hello");
}

export const api = new ApiClient();
