'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Configuração dos módulos do sistema
const modulosDoSistema = [
  {
    id: 'home',
    nome: 'Início',
    path: '/',
    icone: LucideIcons.Home,
    categoria: 'principal'
  },
  {
    id: 'dashboard',
    nome: 'Dashboard',
    path: '/dashboard',
    icone: LucideIcons.BarChart3,
    categoria: 'analytics'
  },
  {
    id: 'analise-preditiva',
    nome: 'Análise Preditiva',
    path: '/analise-preditiva',
    icone: LucideIcons.TrendingUp,
    categoria: 'analytics'
  },
  {
    id: 'journey-analytics',
    nome: 'Journey Analytics',
    path: '/journey-analytics',
    icone: LucideIcons.Route,
    categoria: 'analytics'
  },
  {
    id: 'desenvolvimento-carreira',
    nome: 'Desenvolvimento de Carreira',
    path: '/desenvolvimento-carreira',
    icone: LucideIcons.GraduationCap,
    categoria: 'gestao'
  },
  {
    id: 'modulo-planos',
    nome: 'Módulo Planos',
    path: '/modulo-planos',
    icone: LucideIcons.Package,
    categoria: 'gestao'
  },
  {
    id: 'surveys-feedback',
    nome: 'Surveys & Feedback',
    path: '/surveys-feedback',
    icone: LucideIcons.MessageSquareText,
    categoria: 'pesquisa'
  }
]

// Dados mock do usuário
const usuarioMock = {
  nome: 'Carlos Silva',
  email: 'carlos.silva@empresa.com',
  avatar: '/avatar-placeholder.jpg',
  cargo: 'Analista de Dados Senior',
  empresa: 'Tech Analytics Corp'
}

// Função utilitária para gerar iniciais
const gerarIniciaisNome = (nome: string | undefined): string => {
  if (!nome) return '??'
  
  try {
    const partesNome = nome.trim().split(' ').filter(parte => parte.length > 0)
    
    if (partesNome.length === 0) return '??'
    if (partesNome.length === 1) {
      return partesNome[0].substring(0, 2).toUpperCase()
    }
    
    const primeiraLetra = partesNome[0][0] || '?'
    const ultimaLetra = partesNome[partesNome.length - 1][0] || '?'
    
    return (primeiraLetra + ultimaLetra).toUpperCase()
  } catch (error) {
    console.error('Erro ao gerar iniciais:', error)
    return '??'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarAberta, setSidebarAberta] = useState(true)
  const [carregandoModulo, setCarregandoModulo] = useState<string | null>(null)
  const pathname = usePathname()
  const montadoRef = useRef(true)

  // Inicialização do montadoRef
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  // Handler para navegação com feedback
  const handleNavegacao = (moduloId: string, path: string) => {
    if (!montadoRef.current) return

    setCarregandoModulo(moduloId)

    // Simular carregamento e limpar após navegação
    setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoModulo(null)
      }
    }, 500)
  }

  // Handler para logout
  const handleLogout = () => {
    toast.success('Logout realizado com sucesso')
    // Aqui implementaria a lógica real de logout
  }

  // Verificar se é a rota ativa
  const isRotaAtiva = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Header Superior */}
          <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-40">
            <div className="flex items-center justify-between h-full px-6">
              {/* Logo e Toggle Sidebar */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarAberta(!sidebarAberta)}
                  className="lg:hidden"
                >
                  <LucideIcons.Menu className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center">
                    <LucideIcons.BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">CareerAnalytics</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">Plataforma de Analytics e Gestão</p>
                  </div>
                </div>
              </div>

              {/* Ações do Usuário */}
              <div className="flex items-center space-x-4">
                {/* Notificações */}
                <Button variant="ghost" size="icon" className="relative">
                  <LucideIcons.Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                    3
                  </Badge>
                </Button>

                {/* Menu do Usuário */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuarioMock.avatar} alt={usuarioMock.nome} />
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {gerarIniciaisNome(usuarioMock.nome)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{usuarioMock.nome}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {usuarioMock.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground font-medium">
                          {usuarioMock.cargo}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LucideIcons.User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LucideIcons.Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LucideIcons.LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Layout Principal */}
          <div className="flex pt-16">
            {/* Sidebar */}
            <aside className={`
              bg-white border-r border-gray-200 transition-all duration-300
              ${sidebarAberta ? 'w-64' : 'w-16'}
              fixed left-0 top-16 bottom-0 z-30 lg:relative lg:z-0
              ${sidebarAberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <nav className="p-4 space-y-2">
                {modulosDoSistema.map((modulo) => {
                  const IconeModulo = modulo.icone
                  const ativo = isRotaAtiva(modulo.path)
                  const carregando = carregandoModulo === modulo.id
                  
                  return (
                    <Link
                      key={modulo.id}
                      href={modulo.path}
                      onClick={() => handleNavegacao(modulo.id, modulo.path)}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${ativo 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                        ${carregando ? 'opacity-75' : ''}
                      `}
                    >
                      {carregando ? (
                        <LucideIcons.Loader2 className="h-5 w-5 animate-spin mr-3" />
                      ) : (
                        <IconeModulo className="h-5 w-5 mr-3" />
                      )}
                      
                      {sidebarAberta && (
                        <span className="truncate">{modulo.nome}</span>
                      )}
                      
                      {ativo && sidebarAberta && (
                        <LucideIcons.ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Informações da Empresa (quando sidebar expandida) */}
              {sidebarAberta && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-600 w-6 h-6 rounded flex items-center justify-center">
                        <LucideIcons.Building2 className="h-3 w-3 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {usuarioMock.empresa}
                        </p>
                        <p className="text-xs text-gray-500">Plano Pro</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* Conteúdo Principal */}
            <main className={`
              flex-1 transition-all duration-300
              ${sidebarAberta ? 'lg:ml-0' : 'lg:ml-0'}
            `}>
              <div className="min-h-screen bg-gray-50">
                {children}
              </div>
            </main>
          </div>

          {/* Overlay para mobile quando sidebar aberta */}
          {sidebarAberta && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarAberta(false)}
            />
          )}

          {/* Toast Container */}
          <Toaster position="bottom-right" />
        </div>
      </body>
    </html>
  )
}