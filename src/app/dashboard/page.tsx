'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/api-client'
import { signOut, useSession } from '@/lib/auth-client'
import type { InferResponseType } from 'hono/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

// Hono RPCの型推論を使用（成功時の型のみ）
type TodosResponse = InferResponseType<typeof client.api.todos.$get, 200>

export default function DashboardPage() {
  const session = useSession()
  const router = useRouter()
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')

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

  // ToDo追加（Optimistic Updates）
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    const newTodo = {
      id: Date.now(), // 一時的なID
      title: newTodoTitle,
      description: newTodoDescription || null,
      completed: false,
      userId: session.data?.user.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        }
      })

      if (!res.ok) {
        throw new Error('ToDoの追加に失敗しました')
      }

      // 成功時：フォームクリア & データ再取得
      setNewTodoTitle('')
      setNewTodoDescription('')
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 新しいToDo追加フォーム */}
        <Card className="mb-8">
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