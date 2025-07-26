'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.data) {
      router.push('/dashboard')
    }
  }, [session.data, router])

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            シンプルな
            <span className="text-blue-600">ToDo管理</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            認証付きのToDoアプリで、あなたのタスクを効率的に管理しましょう。
            Hono + Next.js + BetterAuth で構築された、モダンなタスク管理ツールです。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/register">
                無料で始める
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/login">
                ログイン
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  📝
                </div>
                簡単なタスク作成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                直感的なインターフェースで、素早くタスクを追加・編集できます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  🔐
                </div>
                セキュアな認証
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                BetterAuthによる安全な認証システムで、あなたのデータを保護します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  🚀
                </div>
                高速なパフォーマンス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                HonoとNext.jsの組み合わせで、高速で快適なユーザー体験を提供します。
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
