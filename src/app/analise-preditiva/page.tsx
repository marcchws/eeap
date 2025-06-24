'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar seções específicas
import DashboardPreditivo from './dashboard-preditivo'
import CentralAlertas from './central-alertas'
import AnaliseIndividual from './analise-individual'
import AnaliseCohorts from './analise-cohorts'
import ConfiguracaoModelos from './configuracao-modelos'

// Tipos para o contexto global
interface PerfilUsuario {
  id: string
  nome: string
  tipo: 'executivo' | 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'data_scientist'
  departamento: string
  permissoes: string[]
}

interface EstadoGlobal {
  departamentoSelecionado: string
  periodoSelecionado: string
  filtrosGlobais: {
    departamentos: string[]
    cargos: string[]
    faixasRisco: string[]
  }
}

// Context para compartilhar estado entre seções
const AnalisePredicContext = React.createContext<{
  perfilUsuario: PerfilUsuario
  estadoGlobal: EstadoGlobal
  atualizarFiltrosGlobais: (filtros: Partial<EstadoGlobal['filtrosGlobais']>) => void
} | null>(null)

export default function AnalisePredictivaPage() {
  // Estados de navegação
  const [abaSelecionada, setAbaSelecionada] = useState<string>('dashboard')
  const [carregandoInicial, setCarregandoInicial] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  
  // Estados globais compartilhados
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null)
  const [estadoGlobal, setEstadoGlobal] = useState<EstadoGlobal>({
    departamentoSelecionado: 'todos',
    periodoSelecionado: '12_meses',
    filtrosGlobais: {
      departamentos: [],
      cargos: [],
      faixasRisco: []
    }
  })
  
  // Estados de alertas críticos (para badge na aba)
  const [alertasCriticos, setAlertasCriticos] = useState(0)
  
  const montadoRef = useRef(true)
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true
    carregarDadosIniciais()
    
    return () => {
      montadoRef.current = false
    }
  }, [])
  
  // Mock de perfil do usuário
  const carregarDadosIniciais = useCallback(async () => {
    if (!montadoRef.current) return
    
    setCarregandoInicial(true)
    setErro(null)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoInicial(false)
        setErro('Tempo de carregamento excedido. Tente novamente.')
      }
    }, 5000)
    
    try {
      // Simular carregamento do perfil do usuário
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      if (montadoRef.current) {
        const mockPerfil: PerfilUsuario = {
          id: 'user_001',
          nome: 'Ana Silva',
          tipo: 'rh_estrategico',
          departamento: 'Recursos Humanos',
          permissoes: ['visualizar_todos_scores', 'gerenciar_alertas', 'configurar_modelos']
        }
        
        setPerfilUsuario(mockPerfil)
        
        // Carregar contagem de alertas críticos
        const alertasCriticosCount = Math.floor(Math.random() * 8) + 2
        setAlertasCriticos(alertasCriticosCount)
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar dados do usuário. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregandoInicial(false)
      }
    }
  }, [])
  
  // Atualizar filtros globais
  const atualizarFiltrosGlobais = useCallback((novosFiltros: Partial<EstadoGlobal['filtrosGlobais']>) => {
    setEstadoGlobal(prev => ({
      ...prev,
      filtrosGlobais: {
        ...prev.filtrosGlobais,
        ...novosFiltros
      }
    }))
  }, [])
  
  // Handler para mudança de aba
  const handleMudarAba = useCallback((aba: string) => {
    setAbaSelecionada(aba)
    
    // Log de navegação para analytics
    console.log(`Navegação para aba: ${aba}`)
  }, [])
  
  // Verificar permissões para cada aba
  const verificarPermissaoAba = useCallback((aba: string): boolean => {
    if (!perfilUsuario) return false
    
    const permissoesPorAba = {
      dashboard: ['visualizar_todos_scores', 'visualizar_equipe'],
      alertas: ['gerenciar_alertas', 'visualizar_alertas'],
      individual: ['visualizar_todos_scores', 'visualizar_equipe'],
      cohorts: ['visualizar_todos_scores', 'analisar_cohorts'],
      configuracao: ['configurar_modelos', 'gerenciar_ml']
    }
    
    const permissoesNecessarias = permissoesPorAba[aba as keyof typeof permissoesPorAba] || []
    return permissoesNecessarias.some(perm => perfilUsuario.permissoes.includes(perm))
  }, [perfilUsuario])
  
  // Context value
  const contextValue = useMemo(() => {
    if (!perfilUsuario) return null
    
    return {
      perfilUsuario,
      estadoGlobal,
      atualizarFiltrosGlobais
    }
  }, [perfilUsuario, estadoGlobal, atualizarFiltrosGlobais])
  
  // Estados de loading e erro
  if (carregandoInicial) {
    return (
      <div className="p-6">
        <Toaster position="bottom-right" />
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando Análise Preditiva...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="p-6">
        <Toaster position="bottom-right" />
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center max-w-md mx-auto mt-16">
          <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar</h3>
          <p className="text-gray-700 mb-4">{erro}</p>
          <Button onClick={carregarDadosIniciais}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }
  
  if (!perfilUsuario || !contextValue) {
    return (
      <div className="p-6">
        <Toaster position="bottom-right" />
        <div className="text-center py-16">
          <LucideIcons.UserX className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Acesso não autorizado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Você não possui permissões para acessar o módulo de Análise Preditiva.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <AnalisePredicContext.Provider value={contextValue}>
      <div className="p-6 space-y-6">
        <Toaster position="bottom-right" />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Análise Preditiva</h1>
            <p className="text-gray-500 mt-2">
              Identificação proativa de riscos de turnover e insights para retenção
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              <LucideIcons.User className="mr-2 h-4 w-4" />
              {perfilUsuario.nome}
            </Badge>
            <Badge variant="outline" className="text-sm capitalize">
              {perfilUsuario.tipo.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {/* Alertas críticos banner */}
        {alertasCriticos > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <LucideIcons.AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>{alertasCriticos} alertas críticos</strong> requerem atenção imediata. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-red-700 underline ml-2"
                onClick={() => handleMudarAba('alertas')}
              >
                Ver alertas
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Navegação por abas */}
        <Tabs value={abaSelecionada} onValueChange={handleMudarAba}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger 
              value="dashboard" 
              disabled={!verificarPermissaoAba('dashboard')}
              className="relative"
            >
              <LucideIcons.BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            
            <TabsTrigger 
              value="alertas" 
              disabled={!verificarPermissaoAba('alertas')}
              className="relative"
            >
              <LucideIcons.AlertTriangle className="mr-2 h-4 w-4" />
              Alertas
              {alertasCriticos > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {alertasCriticos}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="individual" 
              disabled={!verificarPermissaoAba('individual')}
            >
              <LucideIcons.User className="mr-2 h-4 w-4" />
              Individual
            </TabsTrigger>
            
            <TabsTrigger 
              value="cohorts" 
              disabled={!verificarPermissaoAba('cohorts')}
            >
              <LucideIcons.Users className="mr-2 h-4 w-4" />
              Cohorts
            </TabsTrigger>
            
            <TabsTrigger 
              value="configuracao" 
              disabled={!verificarPermissaoAba('configuracao')}
            >
              <LucideIcons.Settings className="mr-2 h-4 w-4" />
              Modelos
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo das abas */}
          <TabsContent value="dashboard" className="mt-6">
            <DashboardPreditivo />
          </TabsContent>
          
          <TabsContent value="alertas" className="mt-6">
            <CentralAlertas onAlertasChange={setAlertasCriticos} />
          </TabsContent>
          
          <TabsContent value="individual" className="mt-6">
            <AnaliseIndividual />
          </TabsContent>
          
          <TabsContent value="cohorts" className="mt-6">
            <AnaliseCohorts />
          </TabsContent>
          
          <TabsContent value="configuracao" className="mt-6">
            <ConfiguracaoModelos />
          </TabsContent>
        </Tabs>
      </div>
    </AnalisePredicContext.Provider>
  )
}