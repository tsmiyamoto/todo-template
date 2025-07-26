'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { signOut, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Todo {
  id: number
  title: string
  description: string | null
  completed: boolean
  userId: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const session = useSession()
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // 認証チェック
  useEffect(() => {
    if (session.error || (!session.isPending && !session.data)) {
      router.push('/auth/login')
    }
  }, [session, router])

  // ToDoリストを取得
  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error('ToDoの取得に失敗しました:', error)
    }
  }

  // 初回読み込み
  useEffect(() => {
    if (session.data) {
      fetchTodos()
    }
  }, [session.data])

  // 新しいToDoを追加
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newTodoTitle,
          description: newTodoDescription,
        }),
      })

      if (response.ok) {
        setNewTodoTitle('')
        setNewTodoDescription('')
        fetchTodos() // リスト更新
      }
    } catch (error) {
      console.error('ToDoの追加に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // ToDoの完了状態を切り替え
  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed }),
      })

      if (response.ok) {
        fetchTodos() // リスト更新
      }
    } catch (error) {
      console.error('ToDoの更新に失敗しました:', error)
    }
  }

  // ToDoを削除
  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchTodos() // リスト更新
      }
    } catch (error) {
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
              <Button type="submit" disabled={loading}>
                {loading ? '追加中...' : 'タスクを追加'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ToDoリスト */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            あなたのタスク ({todos.length})
          </h2>
          
          {todos.length === 0 ? (
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
                          {new Date(todo.created_at).toLocaleDateString('ja-JP')}
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