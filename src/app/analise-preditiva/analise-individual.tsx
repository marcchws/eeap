'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAnalisePredicContext } from './context'

// Tipos específicos
interface ColaboradorDetalhado {
  id: string
  nome: string
  email: string
  cargo: string
  departamento: string
  gestor: string
  dataAdmissao: string
  salario: number
  scoreAtual: number
  scoreAnterior: number
  categoriaRisco: 'baixo' | 'medio' | 'alto' | 'critico'
  tendencia: 'subindo' | 'estavel' | 'descendo'
  ultimaAtualizacao: string
}

interface AnaliseDetalhada {
  colaboradorId: string
  decomposicaoScore: {
    categoria: string
    valor: number
    peso: number
    contribuicao: number
    status: 'positivo' | 'neutro' | 'negativo'
  }[]
  historicoScores: {
    data: string
    score: number
    evento?: string
  }[]
  fatoresRisco: {
    fator: string
    impacto: 'alto' | 'medio' | 'baixo'
    descricao: string
    dataIdentificacao: string
  }[]
  comparativoBenchmark: {
    scoreColaborador: number
    mediaCargo: number
    mediaDepartamento: number
    mediaEmpresa: number
  }
  recomendacoes: {
    prioridade: 'alta' | 'media' | 'baixa'
    acao: string
    justificativa: string
    prazoEstimado: string
    responsavel: string
  }[]
}

export default function AnaliseIndividual() {
  // Estados
  const [colaboradores, setColaboradores] = useState<ColaboradorDetalhado[]>([])
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState<ColaboradorDetalhado[]>([])
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string>('')
  const [analiseDetalhada, setAnaliseDetalhada] = useState<AnaliseDetalhada | null>(null)
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [carregandoAnalise, setCarregandoAnalise] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // Filtros
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroRisco, setFiltroRisco] = useState('todos')
  const [termoBusca, setTermoBusca] = useState('')
  
  const montadoRef = useRef(true)
  const { perfilUsuario } = useAnalisePredicContext()
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])
  
  // Funções utilitárias defensivas
  const gerarIniciaisNome = useCallback((nome: string | undefined): string => {
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
  }, [])
  
  const formatarData = useCallback((dataString: string | undefined): string => {
    if (!dataString) return 'N/A'
    
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) return 'Data inválida'
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Erro de formato'
    }
  }, [])
  
  const formatarMoeda = useCallback((valor: number | undefined): string => {
    if (valor === undefined || valor === null || isNaN(valor)) return 'R$ 0,00'
    
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    } catch (error) {
      console.error('Erro ao formatar moeda:', error)
      return `R$ ${valor.toFixed(2)}`
    }
  }, [])
  
  const getRiscoCor = useCallback((categoria: string) => {
    const cores = {
      baixo: 'bg-green-100 text-green-800',
      medio: 'bg-yellow-100 text-yellow-800',
      alto: 'bg-orange-100 text-orange-800',
      critico: 'bg-red-100 text-red-800'
    }
    return cores[categoria as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  const getTendenciaIcon = useCallback((tendencia: string) => {
    switch (tendencia) {
      case 'subindo': return <LucideIcons.TrendingUp className="h-4 w-4 text-red-500" />
      case 'descendo': return <LucideIcons.TrendingDown className="h-4 w-4 text-green-500" />
      default: return <LucideIcons.Minus className="h-4 w-4 text-gray-500" />
    }
  }, [])
  
  // API Mock
  const carregarColaboradores = useCallback(async () => {
    if (!montadoRef.current) return
    
    setCarregandoLista(true)
    setErro(null)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoLista(false)
        setErro('Tempo de carregamento excedido. Tente novamente.')
      }
    }, 8000)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      if (montadoRef.current) {
        const mockColaboradores: ColaboradorDetalhado[] = [
          {
            id: 'emp_001',
            nome: 'Carlos Silva',
            email: 'carlos.silva@empresa.com',
            cargo: 'Desenvolvedor Senior',
            departamento: 'Tecnologia',
            gestor: 'Ana Costa',
            dataAdmissao: '2021-03-15',
            salario: 12000,
            scoreAtual: 92,
            scoreAnterior: 65,
            categoriaRisco: 'critico',
            tendencia: 'subindo',
            ultimaAtualizacao: new Date().toISOString()
          },
          {
            id: 'emp_002',
            nome: 'Ana Santos',
            email: 'ana.santos@empresa.com',
            cargo: 'Analista de Marketing',
            departamento: 'Marketing',
            gestor: 'Roberto Lima',
            dataAdmissao: '2020-08-10',
            salario: 8500,
            scoreAtual: 78,
            scoreAnterior: 58,
            categoriaRisco: 'alto',
            tendencia: 'subindo',
            ultimaAtualizacao: new Date().toISOString()
          },
          {
            id: 'emp_003',
            nome: 'Pedro Oliveira',
            email: 'pedro.oliveira@empresa.com',
            cargo: 'Consultor de Vendas',
            departamento: 'Vendas',
            gestor: 'Maria Silva',
            dataAdmissao: '2019-11-20',
            salario: 9200,
            scoreAtual: 64,
            scoreAnterior: 45,
            categoriaRisco: 'medio',
            tendencia: 'subindo',
            ultimaAtualizacao: new Date().toISOString()
          },
          {
            id: 'emp_004',
            nome: 'Julia Ferreira',
            email: 'julia.ferreira@empresa.com',
            cargo: 'Coordenadora de Processos',
            departamento: 'Operações',
            gestor: 'Carlos Junior',
            dataAdmissao: '2018-05-12',
            salario: 11000,
            scoreAtual: 89,
            scoreAnterior: 71,
            categoriaRisco: 'critico',
            tendencia: 'subindo',
            ultimaAtualizacao: new Date().toISOString()
          },
          {
            id: 'emp_005',
            nome: 'Roberto Lima',
            email: 'roberto.lima@empresa.com',
            cargo: 'Tech Lead',
            departamento: 'Tecnologia',
            gestor: 'João Silva',
            dataAdmissao: '2017-02-28',
            salario: 15000,
            scoreAtual: 32,
            scoreAnterior: 38,
            categoriaRisco: 'baixo',
            tendencia: 'descendo',
            ultimaAtualizacao: new Date().toISOString()
          },
          {
            id: 'emp_006',
            nome: 'Mariana Costa',
            email: 'mariana.costa@empresa.com',
            cargo: 'Designer UX',
            departamento: 'Tecnologia',
            gestor: 'Ana Costa',
            dataAdmissao: '2022-01-10',
            salario: 10500,
            scoreAtual: 45,
            scoreAnterior: 42,
            categoriaRisco: 'medio',
            tendencia: 'estavel',
            ultimaAtualizacao: new Date().toISOString()
          }
        ]
        
        setColaboradores(mockColaboradores)
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar lista de colaboradores. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregandoLista(false)
      }
    }
  }, [])
  
const carregarAnaliseDetalhada = useCallback(async (colaboradorId: string) => {
    if (!montadoRef.current || !colaboradorId) return
    
    setCarregandoAnalise(true)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoAnalise(false)
        toast.error('Tempo excedido ao carregar análise detalhada.')
      }
    }, 8000)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (montadoRef.current) {
        const mockAnalise: AnaliseDetalhada = {
          colaboradorId,
          decomposicaoScore: [
            {
              categoria: 'Performance',
              valor: 85,
              peso: 25,
              contribuicao: 21.25,
              status: 'positivo'
            },
            {
              categoria: 'Engagement',
              valor: 45,
              peso: 20,
              contribuicao: 9.0,
              status: 'negativo'
            },
            {
              categoria: 'Comportamento',
              valor: 70,
              peso: 20,
              contribuicao: 14.0,
              status: 'neutro'
            },
            {
              categoria: 'Relacionamentos',
              valor: 35,
              peso: 15,
              contribuicao: 5.25,
              status: 'negativo'
            },
            {
              categoria: 'Jornada',
              valor: 80,
              peso: 10,
              contribuicao: 8.0,
              status: 'positivo'
            },
            {
              categoria: 'Demografia',
              valor: 60,
              peso: 10,
              contribuicao: 6.0,
              status: 'neutro'
            }
          ],
          historicoScores: [
            { data: '2024-01-01', score: 35, evento: 'Baseline inicial' },
            { data: '2024-02-01', score: 42, evento: 'Promoção para Senior' },
            { data: '2024-03-01', score: 38 },
            { data: '2024-04-01', score: 45, evento: 'Mudança de projeto' },
            { data: '2024-05-01', score: 52 },
            { data: '2024-06-01', score: 65, evento: 'Mudança de gestor' },
            { data: '2024-07-01', score: 78 },
            { data: '2024-08-01', score: 85 },
            { data: '2024-09-01', score: 92 }
          ],
          fatoresRisco: [
            {
              fator: 'Feedback negativo sobre liderança',
              impacto: 'alto',
              descricao: 'Relatou insatisfação com estilo de liderança do novo gestor',
              dataIdentificacao: '2024-06-15'
            },
            {
              fator: 'Horas extras excessivas',
              impacto: 'alto',
              descricao: 'Média de 15h extras por semana nas últimas 3 semanas',
              dataIdentificacao: '2024-08-20'
            },
            {
              fator: 'Baixa participação em atividades de equipe',
              impacto: 'medio',
              descricao: 'Ausente em 3 dos últimos 4 eventos sociais da equipe',
              dataIdentificacao: '2024-08-01'
            },
            {
              fator: 'Interesse em vagas externas',
              impacto: 'alto',
              descricao: 'Atividade aumentada no LinkedIn e contatos com recrutadores',
              dataIdentificacao: '2024-09-01'
            }
          ],
          comparativoBenchmark: {
            scoreColaborador: 92,
            mediaCargo: 45,
            mediaDepartamento: 52,
            mediaEmpresa: 48
          },
          recomendacoes: [
            {
              prioridade: 'alta',
              acao: 'Conversa imediata com gestor direto',
              justificativa: 'Score crítico com fatores de risco múltiplos identificados',
              prazoEstimado: '24 horas',
              responsavel: 'Gestor direto + RH'
            },
            {
              prioridade: 'alta',
              acao: 'Revisão da carga de trabalho',
              justificativa: 'Horas extras excessivas indicam sobrecarga',
              prazoEstimado: '1 semana',
              responsavel: 'Gestor direto'
            },
            {
              prioridade: 'media',
              acao: 'Avaliação de mudança de equipe/projeto',
              justificativa: 'Conflito com estilo de liderança atual',
              prazoEstimado: '2 semanas',
              responsavel: 'RH + Liderança'
            },
            {
              prioridade: 'media',
              acao: 'Revisão salarial e benefícios',
              justificativa: 'Competir com propostas externas',
              prazoEstimado: '3 semanas',
              responsavel: 'RH + Finance'
            }
          ]
        }
        
        setAnaliseDetalhada(mockAnalise)
      }
    } catch (error) {
      console.error('Erro ao carregar análise detalhada:', error)
      if (montadoRef.current) {
        toast.error('Falha ao carregar análise detalhada. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregandoAnalise(false)
      }
    }
  }, [])
  
  // Efeito para carregar dados
  useEffect(() => {
    carregarColaboradores()
  }, [carregarColaboradores])
  
  // Filtrar colaboradores
  useEffect(() => {
    let filtrados = [...colaboradores]
    
    // Filtro por departamento
    if (filtroDepartamento !== 'todos') {
      filtrados = filtrados.filter(col => col.departamento.toLowerCase() === filtroDepartamento)
    }
    
    // Filtro por risco
    if (filtroRisco !== 'todos') {
      filtrados = filtrados.filter(col => col.categoriaRisco === filtroRisco)
    }
    
    // Busca por termo
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase()
      filtrados = filtrados.filter(col =>
        col.nome.toLowerCase().includes(termo) ||
        col.email.toLowerCase().includes(termo) ||
        col.cargo.toLowerCase().includes(termo) ||
        col.departamento.toLowerCase().includes(termo)
      )
    }
    
    // Ordenar por score (maiores primeiro)
    filtrados.sort((a, b) => b.scoreAtual - a.scoreAtual)
    
    setColaboradoresFiltrados(filtrados)
  }, [colaboradores, filtroDepartamento, filtroRisco, termoBusca])
  
  // Handlers
  const handleSelecionarColaborador = useCallback((colaboradorId: string) => {
    setColaboradorSelecionado(colaboradorId)
    setAnaliseDetalhada(null)
    carregarAnaliseDetalhada(colaboradorId)
  }, [carregarAnaliseDetalhada])
  
  const handleLimparFiltros = useCallback(() => {
    setFiltroDepartamento('todos')
    setFiltroRisco('todos')
    setTermoBusca('')
    toast.info('Filtros limpos')
  }, [])
  
  const filtrosAplicados = filtroDepartamento !== 'todos' || filtroRisco !== 'todos' || termoBusca.trim() !== ''
  const colaboradorAtual = colaboradores.find(col => col.id === colaboradorSelecionado)
  
  // Renderização de estados
  if (carregandoLista) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando colaboradores...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={carregarColaboradores}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Colaboradores */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>
              Selecione um colaborador para análise detalhada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="space-y-3">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar colaborador..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os departamentos</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="operações">Operações</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroRisco} onValueChange={setFiltroRisco}>
                <SelectTrigger>
                  <SelectValue placeholder="Nível de risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os níveis</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
              
              {filtrosAplicados && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimparFiltros}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
            
            {filtrosAplicados && (
              <div className="text-sm text-muted-foreground border-t pt-3">
                {colaboradoresFiltrados.length} de {colaboradores.length} colaboradores
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Lista */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {colaboradoresFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <LucideIcons.Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {filtrosAplicados 
                  ? 'Nenhum colaborador encontrado com os filtros aplicados'
                  : 'Nenhum colaborador encontrado'
                }
              </p>
            </div>
          ) : (
            colaboradoresFiltrados.map((colaborador) => (
              <Card 
                key={colaborador.id} 
                className={`cursor-pointer transition-colors ${
                  colaboradorSelecionado === colaborador.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelecionarColaborador(colaborador.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {gerarIniciaisNome(colaborador.nome)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{colaborador.nome}</h4>
                        {getTendenciaIcon(colaborador.tendencia)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {colaborador.cargo}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getRiscoCor(colaborador.categoriaRisco)}>
                          {colaborador.categoriaRisco}
                        </Badge>
                        <span className="text-lg font-bold">{colaborador.scoreAtual}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Análise Detalhada */}
      <div className="lg:col-span-2">
        {!colaboradorSelecionado ? (
          <div className="text-center py-16">
            <LucideIcons.UserSearch className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium mb-2">Selecione um colaborador</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Escolha um colaborador da lista ao lado para visualizar a análise preditiva detalhada.
            </p>
          </div>
        ) : carregandoAnalise ? (
          <div className="text-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando análise detalhada...</p>
          </div>
        ) : !analiseDetalhada ? (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
            <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro na análise</h3>
            <p className="text-gray-700 mb-4">Falha ao carregar análise detalhada</p>
            <Button onClick={() => carregarAnaliseDetalhada(colaboradorSelecionado)}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header do Colaborador */}
            {colaboradorAtual && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">
                          {gerarIniciaisNome(colaboradorAtual.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{colaboradorAtual.nome}</h2>
                        <p className="text-muted-foreground">
                          {colaboradorAtual.cargo} • {colaboradorAtual.departamento}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Gestor: {colaboradorAtual.gestor} • 
                          Admissão: {formatarData(colaboradorAtual.dataAdmissao)} • 
                          Salário: {formatarMoeda(colaboradorAtual.salario)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold mb-1">{colaboradorAtual.scoreAtual}</div>
                      <Badge className={getRiscoCor(colaboradorAtual.categoriaRisco)}>
                        {colaboradorAtual.categoriaRisco} risco
                      </Badge>
                      <div className="flex items-center justify-end mt-2 text-sm text-muted-foreground">
                        {getTendenciaIcon(colaboradorAtual.tendencia)}
                        <span className="ml-1">
                          {colaboradorAtual.scoreAnterior} → {colaboradorAtual.scoreAtual}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Decomposição do Score */}
            <Card>
              <CardHeader>
                <CardTitle>Decomposição do Score de Risco</CardTitle>
                <CardDescription>
                  Contribuição de cada categoria para o score final
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analiseDetalhada.decomposicaoScore.map((item) => (
                    <div key={item.categoria} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{item.categoria}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {item.valor}/100 (peso {item.peso}%)
                            </span>
                            <Badge
                              variant={
                                item.status === 'positivo' ? 'secondary' :
                                item.status === 'negativo' ? 'destructive' : 'outline'
                              }
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={item.valor} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          Contribuição: {item.contribuicao.toFixed(1)} pontos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Comparativo com Benchmark */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativo com Benchmark</CardTitle>
                <CardDescription>
                  Posicionamento em relação às médias organizacionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analiseDetalhada.comparativoBenchmark.scoreColaborador}
                    </div>
                    <div className="text-sm text-muted-foreground">Colaborador</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analiseDetalhada.comparativoBenchmark.mediaCargo}
                    </div>
                    <div className="text-sm text-muted-foreground">Média do Cargo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analiseDetalhada.comparativoBenchmark.mediaDepartamento}
                    </div>
                    <div className="text-sm text-muted-foreground">Média Dept.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analiseDetalhada.comparativoBenchmark.mediaEmpresa}
                    </div>
                    <div className="text-sm text-muted-foreground">Média Empresa</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Fatores de Risco */}
            <Card>
              <CardHeader>
                <CardTitle>Principais Fatores de Risco</CardTitle>
                <CardDescription>
                  Elementos identificados que contribuem para o score alto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analiseDetalhada.fatoresRisco.map((fator, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{fator.fator}</h4>
                            <Badge
                              variant={
                                fator.impacto === 'alto' ? 'destructive' :
                                fator.impacto === 'medio' ? 'default' : 'secondary'
                              }
                            >
                              Impacto {fator.impacto}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {fator.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Identificado em: {formatarData(fator.dataIdentificacao)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Recomendações */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações de Intervenção</CardTitle>
                <CardDescription>
                  Ações sugeridas baseadas na análise preditiva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analiseDetalhada.recomendacoes.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{rec.acao}</h4>
                        <Badge
                          variant={
                            rec.prioridade === 'alta' ? 'destructive' :
                            rec.prioridade === 'media' ? 'default' : 'secondary'
                          }
                        >
                          Prioridade {rec.prioridade}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.justificativa}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Prazo: {rec.prazoEstimado}</span>
                        <span>Responsável: {rec.responsavel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Histórico de Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Score</CardTitle>
                <CardDescription>
                  Histórico dos últimos 9 meses com eventos relevantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analiseDetalhada.historicoScores.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium">
                          {formatarData(item.data)}
                        </div>
                        {item.evento && (
                          <Badge variant="outline" className="text-xs">
                            {item.evento}
                          </Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        {item.score}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}