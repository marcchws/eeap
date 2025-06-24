'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Configuração dos módulos com informações detalhadas
const modulosDisponíveis = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    descricao: 'Visão geral de métricas e KPIs em tempo real',
    icone: LucideIcons.BarChart3,
    path: '/dashboard',
    categoria: 'Analytics',
    status: 'ativo',
    features: ['Métricas em tempo real', 'Gráficos interativos', 'Relatórios customizados'],
    cor: 'bg-blue-600',
    corSecundaria: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'analise-preditiva',
    titulo: 'Análise Preditiva',
    descricao: 'Algoritmos de machine learning para previsões estratégicas',
    icone: LucideIcons.TrendingUp,
    path: '/analise-preditiva',
    categoria: 'IA & Analytics',
    status: 'ativo',
    features: ['Modelos de ML', 'Previsões automáticas', 'Análise de tendências'],
    cor: 'bg-purple-600',
    corSecundaria: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'journey-analytics',
    titulo: 'Journey Analytics',
    descricao: 'Análise completa da jornada do usuário e pontos de conversão',
    icone: LucideIcons.Route,
    path: '/journey-analytics',
    categoria: 'UX Analytics',
    status: 'ativo',
    features: ['Mapeamento de jornadas', 'Funis de conversão', 'Heatmaps'],
    cor: 'bg-green-600',
    corSecundaria: 'bg-green-50 text-green-700 border-green-200'
  },
  {
    id: 'desenvolvimento-carreira',
    titulo: 'Desenvolvimento de Carreira',
    descricao: 'Gestão de progressão profissional e planos de desenvolvimento',
    icone: LucideIcons.GraduationCap,
    path: '/desenvolvimento-carreira',
    categoria: 'RH & Gestão',
    status: 'ativo',
    features: ['Planos de carreira', 'Avaliações', 'Certificações'],
    cor: 'bg-orange-600',
    corSecundaria: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    id: 'modulo-planos',
    titulo: 'Módulo Planos',
    descricao: 'Gestão de planos, assinaturas e billing inteligente',
    icone: LucideIcons.Package,
    path: '/modulo-planos',
    categoria: 'Comercial',
    status: 'ativo',
    features: ['Gestão de planos', 'Billing automático', 'Análise de receita'],
    cor: 'bg-indigo-600',
    corSecundaria: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    id: 'surveys-feedback',
    titulo: 'Surveys & Feedback',
    descricao: 'Coleta, análise e insights de pesquisas e feedback',
    icone: LucideIcons.MessageSquareText,
    path: '/surveys-feedback',
    categoria: 'Pesquisa',
    status: 'ativo',
    features: ['Criação de surveys', 'Análise de sentimento', 'Relatórios automáticos'],
    cor: 'bg-pink-600',
    corSecundaria: 'bg-pink-50 text-pink-700 border-pink-200'
  }
]

// Estatísticas gerais do sistema
const estatisticasGerais = [
  {
    titulo: 'Usuários Ativos',
    valor: '2.847',
    mudanca: '+12%',
    icone: LucideIcons.Users,
    cor: 'text-blue-600'
  },
  {
    titulo: 'Módulos Ativos',
    valor: '6',
    mudanca: 'Completo',
    icone: LucideIcons.Grid3X3,
    cor: 'text-green-600'
  },
  {
    titulo: 'Análises Processadas',
    valor: '15.2K',
    mudanca: '+23%',
    icone: LucideIcons.BarChart3,
    cor: 'text-purple-600'
  },
  {
    titulo: 'Uptime do Sistema',
    valor: '99.9%',
    mudanca: 'Estável',
    icone: LucideIcons.Activity,
    cor: 'text-emerald-600'
  }
]

export default function HomePage() {
  const [carregandoModulo, setCarregandoModulo] = useState<string | null>(null)
  const [estatisticasCarregando, setEstatisticasCarregando] = useState(true)
  const montadoRef = useRef(true)

  // Inicialização do montadoRef
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  // Simular carregamento inicial das estatísticas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setEstatisticasCarregando(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Handler para navegação com feedback
  const handleAcessarModulo = useCallback((moduloId: string) => {
    if (!montadoRef.current) return

    setCarregandoModulo(moduloId)
    
    // Feedback de loading
    setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoModulo(null)
        toast.success('Carregando módulo...')
      }
    }, 300)
  }, [])

  return (
    <div className="p-6 space-y-8">

      {/* Grid de Módulos */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Módulos Disponíveis
          </h2>
          <p className="text-gray-600">
            Acesse os diferentes módulos da plataforma para análises completas e insights estratégicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulosDisponíveis.map((modulo) => {
            const IconeModulo = modulo.icone
            const carregando = carregandoModulo === modulo.id
            
            return (
              <Card 
                key={modulo.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg"
              >
                <CardHeader className="relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className={`
                      ${modulo.cor} w-14 h-14 rounded-xl flex items-center justify-center
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <IconeModulo className="h-7 w-7 text-white" />
                    </div>
                    <Badge className={modulo.corSecundaria}>
                      {modulo.categoria}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {modulo.titulo}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {modulo.descricao}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features do módulo */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Principais recursos:
                    </h4>
                    <ul className="space-y-1">
                      {modulo.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <LucideIcons.Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botão de acesso */}
                  <Link href={modulo.path}>
                    <Button 
                      className="w-full group-hover:bg-blue-600 transition-colors"
                      onClick={() => handleAcessarModulo(modulo.id)}
                      disabled={carregando}
                    >
                      {carregando ? (
                        <>
                          <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          Acessar Módulo
                          <LucideIcons.ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Seção de Ajuda Rápida */}
    </div>
  )
}