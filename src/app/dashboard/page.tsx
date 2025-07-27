'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategorySelector } from '@/components/ui/category-selector'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { client, type CategoriesResponse, type TodosResponse, type TodoWithCategories } from '@/lib/api-client'
import { signOut, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

export default function DashboardPage() {
  const session = useSession()
  const router = useRouter()
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])

  // 認証チェック（middlewareでも行うが念のため）
  useEffect(() => {
    if (session.error || (!session.isPending && !session.data)) {
      router.push('/auth/login')
    }
  }, [session, router])

  // ToDoリスト取得（SWR）
  const todosKey = session.data ? ['todos'] : null
  const todosFetcher = async () => {
    const res = await client.api.todos.$get()
    if (!res.ok) throw new Error('ToDoの取得に失敗しました')
    return res.json()
  }

  const {
    data: todos = [],
    error: todosError,
    isLoading: todosLoading,
  } = useSWR<TodosResponse>(todosKey, todosFetcher)

  // カテゴリリスト取得（SWR）
  const categoriesKey = session.data ? ['categories'] : null
  const categoriesFetcher = async () => {
    const res = await client.api.categories.$get()
    if (!res.ok) throw new Error('カテゴリの取得に失敗しました')
    return res.json()
  }

  const {
    data: categories = [],
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR<CategoriesResponse>(categoriesKey, categoriesFetcher)

  // カテゴリ作成（CategorySelectorから呼び出される）
  const createCategory = async (name: string, color: string): Promise<void> => {
    const res = await client.api.categories.$post({
      json: { name, color }
    })

    if (!res.ok) {
      throw new Error('カテゴリの作成に失敗しました')
    }

    // データ再取得
    mutate(['categories'])
  }

  // カテゴリ更新（CategorySelectorから呼び出される）
  const updateCategory = async (id: number, name: string, color: string): Promise<void> => {
    const res = await client.api.categories[':id'].$put({
      param: { id: id.toString() },
      json: { name, color }
    })

    if (!res.ok) {
      throw new Error('カテゴリの更新に失敗しました')
    }

    // データ再取得
    mutate(['categories'])
    mutate(['todos']) // ToDoのカテゴリ表示も更新
  }

  // カテゴリ削除（CategorySelectorから呼び出される）
  const deleteCategory = async (id: number): Promise<void> => {
    const res = await client.api.categories[':id'].$delete({
      param: { id: id.toString() }
    })

    if (!res.ok) {
      throw new Error('カテゴリの削除に失敗しました')
    }

    // データ再取得
    mutate(['categories'])
    mutate(['todos']) // ToDoのカテゴリ表示も更新
  }

  // ToDo追加（Optimistic Updates）
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    const newTodo: TodoWithCategories = {
      id: Date.now(), // 一時的なID
      title: newTodoTitle,
      description: newTodoDescription || null,
      completed: false,
      userId: session.data?.user.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: selectedCategories.map(id => {
        const cat = categories.find(c => c.id === id)
        return cat ? { id: cat.id, name: cat.name, color: cat.color } : { id, name: '不明', color: '#gray' }
      }),
    }

    try {
      // 楽観的更新：即座にUIに反映
      mutate(
        ['todos'],
        (currentTodos: TodosResponse = []) => [newTodo, ...currentTodos],
        false
      )

      // サーバーに送信
      const res = await client.api.todos.$post({
        json: {
          title: newTodoTitle,
          description: newTodoDescription || undefined,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        }
      })

      if (!res.ok) {
        throw new Error('ToDoの追加に失敗しました')
      }

      // 成功時：フォームクリア & データ再取得
      setNewTodoTitle('')
      setNewTodoDescription('')
      setSelectedCategories([])
      mutate(['todos'])
    } catch (error) {
      // エラー時：元のデータに戻す
      mutate(['todos'])
      console.error('ToDoの追加に失敗しました:', error)
    }
  }

  // 完了状態切り替え（Optimistic Updates）
  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      // 楽観的更新：即座にUIに反映
      mutate(
        ['todos'],
        (currentTodos: TodosResponse = []) =>
          currentTodos.map(todo => 
            todo.id === id 
              ? { ...todo, completed, updatedAt: new Date().toISOString() }
              : todo
          ),
        false
      )

      // サーバーに送信
      const res = await client.api.todos[':id'].$put({
        param: { id: id.toString() },
        json: { completed }
      })

      if (!res.ok) {
        throw new Error('ToDoの更新に失敗しました')
      }

      // 成功時：データ再取得
      mutate(['todos'])
    } catch (error) {
      // エラー時：元のデータに戻す
      mutate(['todos'])
      console.error('ToDoの更新に失敗しました:', error)
    }
  }

  // 削除（Optimistic Updates）
  const deleteTodo = async (id: number) => {
    try {
      // 楽観的更新：即座にUIから削除
      mutate(
        ['todos'],
        (currentTodos: TodosResponse = []) =>
          currentTodos.filter(todo => todo.id !== id),
        false
      )

      // サーバーに送信
      const res = await client.api.todos[':id'].$delete({
        param: { id: id.toString() }
      })

      if (!res.ok) {
        throw new Error('ToDoの削除に失敗しました')
      }

      // 成功時：データ再取得
      mutate(['todos'])
    } catch (error) {
      // エラー時：元のデータに戻す
      mutate(['todos'])
      console.error('ToDoの削除に失敗しました:', error)
    }
  }

  // ログアウト
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!session.data) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            ToDoアプリ
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              こんにちは、{session.data.user.name}さん
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 新しいToDo追加フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>新しいタスクを追加</CardTitle>
            <CardDescription>
              今日やることを追加しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTodo} className="space-y-4">
              <Input
                placeholder="タスクのタイトル"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                required
              />
              <Input
                placeholder="詳細（任意）"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
              />
              
              {/* Notionスタイルのカテゴリ選択 */}
              <CategorySelector
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                placeholder="カテゴリを選択または作成..."
              />

              <Button type="submit">
                タスクを追加
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ToDoリスト */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            あなたのタスク ({todos.length})
          </h2>

          {todosLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                読み込み中...
              </CardContent>
            </Card>
          ) : todosError ? (
            <Card>
              <CardContent className="py-8 text-center text-red-500">
                エラーが発生しました: {todosError.message}
              </CardContent>
            </Card>
          ) : todos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                まだタスクがありません。上のフォームから新しいタスクを追加してみましょう！
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <Card key={todo.id} className={todo.completed ? 'opacity-75' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) =>
                          toggleTodo(todo.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {todo.description}
                          </p>
                        )}
                        
                        {/* カテゴリバッジ */}
                        {todo.categories && todo.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {todo.categories.map((category: { id: number; name: string; color: string }) => (
                              <Badge 
                                key={category.id} 
                                variant="secondary"
                                style={{ backgroundColor: category.color + '20', color: category.color }}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 