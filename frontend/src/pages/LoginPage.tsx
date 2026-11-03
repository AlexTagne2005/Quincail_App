import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Wrench, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function LoginPage() {
  const [email, setEmail] = useState("admin@quincail.com")
  const [password, setPassword] = useState("admin123")
  const { login, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate("/")
    } catch {
      // Error is stored in auth store
    }
  }

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 mb-2">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quincail Express
          </h1>
          <p className="text-sm text-slate-500">
            Gestion commerciale & suivi des stocks de quincaillerie
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Connexion au système</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@quincail.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
                size="lg"
              >
                {isLoading ? (
                  <span>Connexion en cours...</span>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Accounts Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
                Comptes de test préconfigurés
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoAccount("admin@quincail.com", "admin123")}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    email === "admin@quincail.com"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold">Admin</span>
                  <span className="text-[10px] text-slate-500">Tous droits</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount("stock@quincail.com", "stock123")}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    email === "stock@quincail.com"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold">Stock</span>
                  <span className="text-[10px] text-slate-500">Réceptions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount("caisse@quincail.com", "caisse123")}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    email === "caisse@quincail.com"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold">Caisse</span>
                  <span className="text-[10px] text-slate-500">Comptoir POS</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
