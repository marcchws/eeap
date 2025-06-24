'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAnalisePredicContext } from './context'

// Tipos específicos
interface ModeloPreditivo {
  id: string
  nome: string
  tipo: 'principal' | 'segmentado' | 'especializado'
  algoritmo: 'random_forest' | 'gradient_boosting' | 'neural_network' | 'ensemble'
  versao: string
  dataCriacao: string
  dataUltimoTreinamento: string
  acuraciaAtual: number
  precisao: number
  recall: number
  f1Score: number
  status: 'ativo' | 'inativo' | 'treinamento' | 'erro'
  variaveisUtilizadas: VariavelPreditiva[]
  segmentoAlvo?: string
  observacoes?: string
}

interface VariavelPreditiva {
  id: string
  nome: string
  tipo: 'numerica' | 'categorica' | 'booleana'
  fonte: 'hris' | 'surveys' | 'jornada' | 'comportamento'
  importancia: number
  correlacao: number
  qualidadeDados: number
  dataUltimaAtualizacao: string
  ativa: boolean
}

interface MonitoramentoDrift {
  modeloId: string
  tipo: 'data_drift' | 'concept_drift' | 'prediction_drift' | 'performance_drift'
  severidade: 'baixa' | 'media' | 'alta'
  dataDeteccao: string
  descricao: string
  impactoEstimado: number
  acaoRecomendada: string
  status: 'novo' | 'em_analise' | 'resolvido'
}

interface ModalNovoModeloProps {
  isOpen: boolean
  onClose: () => void
  onSalvar: (modelo: Partial<ModeloPreditivo>) => Promise<void>
}

// Componente Modal Novo Modelo
function ModalNovoModelo({ isOpen, onClose, onSalvar }: ModalNovoModeloProps) {
  const [dados, setDados] = useState({
    nome: '',
    tipo: 'segmentado' as const,
    algoritmo: 'random_forest' as const,
    segmentoAlvo: '',
    observacoes: ''
  })
  const [salvando, setSalvando] = useState(false)
  const montadoRef = useRef(true)
  
  useEffect(() => {
    montadoRef.current = true
    return () => { montadoRef.current = false }
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      setDados({
        nome: '',
        tipo: 'segmentado',
        algoritmo: 'random_forest',
        segmentoAlvo: '',
        observacoes: ''
      })
    }
  }, [isOpen])
  
  const handleSalvar = useCallback(async () => {
    if (!dados.nome.trim()) {
      toast.error('Nome do modelo é obrigatório')
      return
    }
    
    setSalvando(true)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvando(false)
        toast.error('Tempo excedido. Tente novamente.')
      }
    }, 10000)
    
    try {
      await onSalvar(dados)
      if (montadoRef.current) {
        toast.success('Modelo criado com sucesso')
        onClose()
      }
    } catch (error) {
      console.error('Erro ao criar modelo:', error)
      if (montadoRef.current) {
        toast.error('Falha ao criar modelo. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setSalvando(false)
      }
    }
  }, [dados, onSalvar, onClose])
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Modelo Preditivo</DialogTitle>
          <DialogDescription>
            Configure um novo modelo de machine learning para análise preditiva
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Modelo</Label>
            <Input
              id="nome"
              value={dados.nome}
              onChange={(e) => setDados(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Modelo Tech Q4 2024"
              disabled={salvando}
            />
          </div>
          
          <div>
            <Label htmlFor="tipo">Tipo de Modelo</Label>
            <Select value={dados.tipo} onValueChange={(valor) => setDados(prev => ({ ...prev, tipo: valor as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="principal">Principal (toda empresa)</SelectItem>
                <SelectItem value="segmentado">Segmentado (departamento/cargo)</SelectItem>
                <SelectItem value="especializado">Especializado (grupo específico)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="algoritmo">Algoritmo</Label>
            <Select value={dados.algoritmo} onValueChange={(valor) => setDados(prev => ({ ...prev, algoritmo: valor as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o algoritmo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random_forest">Random Forest</SelectItem>
                <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
                <SelectItem value="neural_network">Neural Network</SelectItem>
                <SelectItem value="ensemble">Ensemble (combinado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dados.tipo !== 'principal' && (
            <div>
              <Label htmlFor="segmento">Segmento Alvo</Label>
              <Input
                id="segmento"
                value={dados.segmentoAlvo}
                onChange={(e) => setDados(prev => ({ ...prev, segmentoAlvo: e.target.value }))}
                placeholder="Ex: Tecnologia, Desenvolvedores Senior, etc."
                disabled={salvando}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              value={dados.observacoes}
              onChange={(e) => setDados(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Objetivo, contexto, informações adicionais..."
              disabled={salvando}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando || !dados.nome.trim()}>
            {salvando ? (
              <>
                <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Modelo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente principal
export default function ConfiguracaoModelos() {
  // Estados
  const [modelos, setModelos] = useState<ModeloPreditivo[]>([])
  const [variaveis, setVariaveis] = useState<VariavelPreditiva[]>([])
  const [alertasDrift, setAlertasDrift] = useState<MonitoramentoDrift[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  
  // Filtros e seleções
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('')
  
  // Modal
  const [modalNovoModelo, setModalNovoModelo] = useState(false)
  
  const montadoRef = useRef(true)
  const { perfilUsuario } = useAnalisePredicContext()
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])
  
  // Funções utilitárias
  const formatarData = useCallback((dataString: string | undefined): string => {
    if (!dataString) return 'N/A'
    
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) return 'Data inválida'
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Erro de formato'
    }
  }, [])
  
  const formatarPercentual = useCallback((valor: number | undefined): string => {
    if (valor === undefined || valor === null || isNaN(valor)) return '0%'
    
    try {
      return `${valor.toFixed(1)}%`
    } catch (error) {
      console.error('Erro ao formatar percentual:', error)
      return `${valor}%`
    }
  }, [])
  
  const getStatusCor = useCallback((status: string) => {
    const cores = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      treinamento: 'bg-blue-100 text-blue-800',
      erro: 'bg-red-100 text-red-800'
    }
    return cores[status as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  const getTipoCor = useCallback((tipo: string) => {
    const cores = {
      principal: 'bg-purple-100 text-purple-800',
      segmentado: 'bg-blue-100 text-blue-800',
      especializado: 'bg-orange-100 text-orange-800'
    }
    return cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  // API Mock
  const carregarDados = useCallback(async () => {
    if (!montadoRef.current) return
    
    setCarregando(true)
    setErro(null)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false)
        setErro('Tempo de carregamento excedido. Tente novamente.')
      }
    }, 8000)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (montadoRef.current) {
        const mockModelos: ModeloPreditivo[] = [
          {
            id: 'modelo_001',
            nome: 'Modelo Principal EEAP',
            tipo: 'principal',
            algoritmo: 'ensemble',
            versao: '2.1.3',
            dataCriacao: '2024-01-15',
            dataUltimoTreinamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            acuraciaAtual: 84.2,
            precisao: 82.8,
            recall: 85.6,
            f1Score: 84.1,
            status: 'ativo',
            variaveisUtilizadas: [],
            observacoes: 'Modelo principal para toda a organização'
          },
          {
            id: 'modelo_002',
            nome: 'Modelo Tecnologia',
            tipo: 'segmentado',
            algoritmo: 'gradient_boosting',
            versao: '1.8.2',
            dataCriacao: '2024-03-20',
            dataUltimoTreinamento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            acuraciaAtual: 87.5,
            precisao: 89.2,
            recall: 85.8,
            f1Score: 87.4,
            status: 'ativo',
            segmentoAlvo: 'Departamento de Tecnologia',
            variaveisUtilizadas: [],
            observacoes: 'Modelo especializado para área técnica'
          },
          {
            id: 'modelo_003',
            nome: 'Modelo New Hires',
            tipo: 'especializado',
            algoritmo: 'random_forest',
            versao: '1.2.1',
            dataCriacao: '2024-06-10',
            dataUltimoTreinamento: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            acuraciaAtual: 79.3,
            precisao: 77.9,
            recall: 80.7,
            f1Score: 79.2,
            status: 'treinamento',
            segmentoAlvo: 'Colaboradores 0-6 meses',
            variaveisUtilizadas: [],
            observacoes: 'Foco em retenção nos primeiros meses'
          },
          {
            id: 'modelo_004',
            nome: 'Modelo Liderança',
            tipo: 'especializado',
            algoritmo: 'neural_network',
            versao: '0.9.5',
            dataCriacao: '2024-08-01',
            dataUltimoTreinamento: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            acuraciaAtual: 68.4,
            precisao: 65.2,
            recall: 71.6,
            f1Score: 68.2,
            status: 'erro',
            segmentoAlvo: 'Cargos de liderança',
            variaveisUtilizadas: [],
            observacoes: 'Modelo em desenvolvimento - baixa acurácia'
          }
        ]
        
        const mockVariaveis: VariavelPreditiva[] = [
          {
            id: 'var_001',
            nome: 'Idade',
            tipo: 'numerica',
            fonte: 'hris',
            importancia: 85.2,
            correlacao: 0.42,
            qualidadeDados: 98.5,
            dataUltimaAtualizacao: new Date().toISOString(),
            ativa: true
          },
          {
            id: 'var_002',
            nome: 'Tempo de Empresa',
            tipo: 'numerica',
            fonte: 'hris',
            importancia: 92.7,
            correlacao: -0.38,
            qualidadeDados: 100.0,
            dataUltimaAtualizacao: new Date().toISOString(),
            ativa: true
          },
          {
            id: 'var_003',
            nome: 'eNPS Individual',
            tipo: 'numerica',
            fonte: 'surveys',
            importancia: 94.1,
            correlacao: -0.67,
            qualidadeDados: 87.3,
            dataUltimaAtualizacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            ativa: true
          },
          {
            id: 'var_004',
            nome: 'Score Última Avaliação',
            tipo: 'numerica',
            fonte: 'hris',
            importancia: 78.5,
            correlacao: -0.29,
            qualidadeDados: 92.1,
            dataUltimaAtualizacao: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            ativa: true
          },
          {
            id: 'var_005',
            nome: 'Mudanças de Gestor',
            tipo: 'numerica',
            fonte: 'jornada',
            importancia: 71.3,
            correlacao: 0.34,
            qualidadeDados: 95.8,
            dataUltimaAtualizacao: new Date().toISOString(),
            ativa: true
          },
          {
            id: 'var_006',
            nome: 'Trabalho Remoto',
            tipo: 'booleana',
            fonte: 'comportamento',
            importancia: 56.8,
            correlacao: -0.12,
            qualidadeDados: 89.2,
            dataUltimaAtualizacao: new Date().toISOString(),
            ativa: false
          }
        ]
        
        const mockAlertasDrift: MonitoramentoDrift[] = [
          {
            modeloId: 'modelo_002',
            tipo: 'performance_drift',
            severidade: 'media',
            dataDeteccao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            descricao: 'Queda de 3.2% na acurácia nas últimas 2 semanas',
            impactoEstimado: 3.2,
            acaoRecomendada: 'Retreinamento com dados mais recentes',
            status: 'novo'
          },
          {
            modeloId: 'modelo_004',
            tipo: 'data_drift',
            severidade: 'alta',
            dataDeteccao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            descricao: 'Mudança significativa na distribuição da variável eNPS',
            impactoEstimado: 8.7,
            acaoRecomendada: 'Recalibração do modelo e revisão de features',
            status: 'em_analise'
          }
        ]
        
        setModelos(mockModelos)
        setVariaveis(mockVariaveis)
        setAlertasDrift(mockAlertasDrift)
        
        // Selecionar primeiro modelo por padrão
        if (mockModelos.length > 0) {
          setModeloSelecionado(mockModelos[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar configuração de modelos. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregando(false)
      }
    }
  }, [])
  
  // Efeito para carregar dados
  useEffect(() => {
    carregarDados()
  }, [carregarDados])
  
  // Dados filtrados
  const modelosFiltrados = useMemo(() => {
    let filtrados = [...modelos]
    
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(modelo => modelo.tipo === filtroTipo)
    }
    
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(modelo => modelo.status === filtroStatus)
    }
    
    return filtrados.sort((a, b) => {
      // Ordenar por status (ativo primeiro) e depois por acurácia
      if (a.status !== b.status) {
        if (a.status === 'ativo') return -1
        if (b.status === 'ativo') return 1
      }
      return b.acuraciaAtual - a.acuraciaAtual
    })
  }, [modelos, filtroTipo, filtroStatus])
  
  const modeloAtual = modelos.find(m => m.id === modeloSelecionado)
  const alertasCriticos = alertasDrift.filter(a => a.severidade === 'alta' && a.status === 'novo').length
  
  // Handlers
  const handleCriarModelo = useCallback(async (novoModelo: Partial<ModeloPreditivo>) => {
    // Simular criação
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const modelo: ModeloPreditivo = {
      id: `modelo_${Date.now()}`,
      nome: novoModelo.nome!,
      tipo: novoModelo.tipo!,
      algoritmo: novoModelo.algoritmo!,
      versao: '1.0.0',
      dataCriacao: new Date().toISOString(),
      dataUltimoTreinamento: new Date().toISOString(),
      acuraciaAtual: 0,
      precisao: 0,
      recall: 0,
      f1Score: 0,
      status: 'treinamento',
      segmentoAlvo: novoModelo.segmentoAlvo,
      observacoes: novoModelo.observacoes,
      variaveisUtilizadas: []
    }
    
    setModelos(prev => [modelo, ...prev])
  }, [])
  
  const handleTreinarModelo = useCallback(async (modeloId: string) => {
    toast.info('Iniciando treinamento do modelo...')
    
    // Simular treinamento
    setModelos(prev => prev.map(modelo => 
      modelo.id === modeloId 
        ? { ...modelo, status: 'treinamento' as const }
        : modelo
    ))
    
    setTimeout(() => {
      if (montadoRef.current) {
        setModelos(prev => prev.map(modelo => 
          modelo.id === modeloId 
            ? { 
                ...modelo, 
                status: 'ativo' as const,
                dataUltimoTreinamento: new Date().toISOString(),
                acuraciaAtual: Math.random() * 10 + 80, // 80-90%
                versao: `${modelo.versao.split('.')[0]}.${parseInt(modelo.versao.split('.')[1]) + 1}.0`
              }
            : modelo
        ))
        toast.success('Modelo treinado com sucesso')
      }
    }, 3000)
  }, [])
  
  const handleToggleVariavel = useCallback((variavelId: string, ativa: boolean) => {
    setVariaveis(prev => prev.map(variavel =>
      variavel.id === variavelId
        ? { ...variavel, ativa }
        : variavel
    ))
    toast.success(ativa ? 'Variável ativada' : 'Variável desativada')
  }, [])
  
  // Verificar permissões
  const podeGerenciarModelos = perfilUsuario.permissoes.includes('configurar_modelos') || 
                              perfilUsuario.permissoes.includes('gerenciar_ml')
  
  // Renderização de estados
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando configuração de modelos...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar configuração</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={carregarDados}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header com alertas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Modelos</h2>
          <p className="text-muted-foreground">
            Gestão e monitoramento dos modelos de machine learning
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {alertasCriticos > 0 && (
            <Badge variant="destructive">
              {alertasCriticos} alertas críticos
            </Badge>
          )}
          
          {podeGerenciarModelos && (
            <Button onClick={() => setModalNovoModelo(true)}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          )}
        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="principal">Principal</SelectItem>
                <SelectItem value="segmentado">Segmentado</SelectItem>
                <SelectItem value="especializado">Especializado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="treinamento">Treinamento</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="erro">Com erro</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1"></div>
            
            <span className="text-sm text-muted-foreground">
              {modelosFiltrados.length} de {modelos.length} modelos
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelosFiltrados.map((modelo) => (
          <Card 
            key={modelo.id}
            className={`cursor-pointer transition-colors ${
              modeloSelecionado === modelo.id 
                ? 'border-primary bg-primary/5' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setModeloSelecionado(modelo.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getTipoCor(modelo.tipo)}>
                    {modelo.tipo}
                  </Badge>
                  <Badge className={getStatusCor(modelo.status)}>
                    {modelo.status}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {modelo.algoritmo} v{modelo.versao}
                {modelo.segmentoAlvo && ` • ${modelo.segmentoAlvo}`}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatarPercentual(modelo.acuraciaAtual)}</div>
                  <div className="text-sm text-muted-foreground">Acurácia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatarPercentual(modelo.f1Score)}</div>
                  <div className="text-sm text-muted-foreground">F1-Score</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Precisão: {formatarPercentual(modelo.precisao)}</div>
                <div>Recall: {formatarPercentual(modelo.recall)}</div>
                <div>Último treinamento: {formatarData(modelo.dataUltimoTreinamento)}</div>
              </div>
              
              {podeGerenciarModelos && modelo.status === 'ativo' && (
                <div className="mt-4 pt-4 border-t">''
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTreinarModelo(modelo.id)
                    }}
                    disabled={modelo.status === 'treinamento'}
                  >
                    <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                    Retreinar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {modelosFiltrados.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.Brain className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhum modelo encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Não há modelos disponíveis com os filtros aplicados.
          </p>
        </div>
      )}
      
      {/* Detalhes do Modelo Selecionado */}
      {modeloAtual && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Modelo: {modeloAtual.nome}</CardTitle>
              <CardDescription>
                Informações técnicas e configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <div>Algoritmo: <span className="font-medium">{modeloAtual.algoritmo}</span></div>
                    <div>Versão: <span className="font-medium">{modeloAtual.versao}</span></div>
                    <div>Criado em: <span className="font-medium">{formatarData(modeloAtual.dataCriacao)}</span></div>
                    <div>Segmento: <span className="font-medium">{modeloAtual.segmentoAlvo || 'Todos'}</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Métricas de Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Acurácia</span>
                        <span className="font-medium">{formatarPercentual(modeloAtual.acuraciaAtual)}</span>
                      </div>
                      <Progress value={modeloAtual.acuraciaAtual} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Precisão</span>
                        <span className="font-medium">{formatarPercentual(modeloAtual.precisao)}</span>
                      </div>
                      <Progress value={modeloAtual.precisao} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Recall</span>
                        <span className="font-medium">{formatarPercentual(modeloAtual.recall)}</span>
                      </div>
                      <Progress value={modeloAtual.recall} />
                    </div>
                  </div>
                </div>
              </div>
              
              {modeloAtual.observacoes && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{modeloAtual.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Variáveis Preditivas */}
          <Card>
            <CardHeader>
              <CardTitle>Variáveis Preditivas</CardTitle>
              <CardDescription>
                Configuração das features utilizadas no modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variaveis.map((variavel) => (
                  <div key={variavel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{variavel.nome}</h4>
                        <Badge variant="outline" className="text-xs">
                          {variavel.tipo}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {variavel.fonte}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Importância:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={variavel.importancia} className="flex-1 h-2" />
                            <span className="font-medium">{formatarPercentual(variavel.importancia)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Correlação:</span>
                          <div className="font-medium mt-1">{variavel.correlacao.toFixed(3)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qualidade:</span>
                          <div className="font-medium mt-1">{formatarPercentual(variavel.qualidadeDados)}</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Última atualização: {formatarData(variavel.dataUltimaAtualizacao)}
                      </div>
                    </div>
                    
                    {podeGerenciarModelos && (
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={variavel.ativa}
                            onCheckedChange={(checked) => handleToggleVariavel(variavel.id, checked)}
                          />
                          <Label className="text-sm">
                            {variavel.ativa ? 'Ativa' : 'Inativa'}
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Alertas de Drift */}
          {alertasDrift.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento de Drift</CardTitle>
                <CardDescription>
                  Alertas de degradação ou mudanças no modelo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertasDrift
                    .filter(alerta => alerta.modeloId === modeloAtual.id)
                    .map((alerta, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      alerta.severidade === 'alta' ? 'border-red-200 bg-red-50' :
                      alerta.severidade === 'media' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium capitalize">
                              {alerta.tipo.replace('_', ' ')}
                            </h4>
                            <Badge 
                              variant={
                                alerta.severidade === 'alta' ? 'destructive' :
                                alerta.severidade === 'media' ? 'default' : 'secondary'
                              }
                            >
                              {alerta.severidade}
                            </Badge>
                            <Badge variant="outline">
                              {alerta.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mb-2">{alerta.descricao}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Ação recomendada:</strong> {alerta.acaoRecomendada}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Detectado em: {formatarData(alerta.dataDeteccao)} • 
                            Impacto estimado: {formatarPercentual(alerta.impactoEstimado)}
                          </div>
                        </div>
                        
                        {alerta.severidade === 'alta' && (
                          <LucideIcons.AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {alertasDrift.filter(alerta => alerta.modeloId === modeloAtual.id).length === 0 && (
                    <div className="text-center py-8">
                      <LucideIcons.CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-green-600 font-medium">Nenhum alerta de drift detectado</p>
                      <p className="text-sm text-muted-foreground">O modelo está funcionando dentro dos parâmetros esperados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Modal Novo Modelo */}
      <ModalNovoModelo
        isOpen={modalNovoModelo}
        onClose={() => setModalNovoModelo(false)}
        onSalvar={handleCriarModelo}
      />
    </div>
  )
}