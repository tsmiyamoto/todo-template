'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signIn, signUp } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    // Better Auth公式形式でサインアップ
    const { data, error: signUpError } = await signUp.email({
      email,
      password,
      name,
      callbackURL: '/dashboard'
    }, {
      onRequest: () => {
        setLoading(true)
      },
      onSuccess: () => {
        router.push('/dashboard')
      },
      onError: (ctx) => {
        setError(ctx.error.message || 'アカウント作成に失敗しました')
        setLoading(false)
      }
    })

    // エラーハンドリング（コールバック以外）
    if (signUpError) {
      setError(signUpError.message || 'アカウント作成に失敗しました')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      })
    } catch (err) {
      setError('Googleログインに失敗しました')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>
            新しいアカウントを作成してToDoアプリを始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Googleログインボタン */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでアカウント作成
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-gray-500">または</span>
              </div>
            </div>

            {/* メール登録フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="お名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="パスワード（8文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="パスワード確認"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'アカウント作成中...' : 'メールでアカウントを作成'}
              </Button>
            </form>

            <div className="text-center text-sm">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                ログイン
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 