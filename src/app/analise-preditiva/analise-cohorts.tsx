'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAnalisePredicContext } from './page'

// Tipos específicos
interface CohortAnalise {
  id: string
  nome: string
  criterioAgrupamento: string
  dataInicioPeriodo: string
  tamanhoInicial: number
  colaboradoresRemanescentes: number
  taxaRetencao: number
  tempoMedioPermanencia: number
  scoreMedioRisco: number
  principaisCausasSaida: string[]
  intervencaoAplicadas: string[]
  efetividadeAcoes: number
  status: 'ativo' | 'concluido' | 'monitoramento'
  dadosEvoluacao: {
    mes: string
    remanescentes: number
    saidasMes: number
    scoreMedio: number
  }[]
}

interface ComparativoCohorts {
  cohorts: {
    nome: string
    taxaRetencao: number
    tempoMedio: number
    scoreMedio: number
    cor: string
  }[]
  insights: string[]
}

export default function AnaliseCohorts() {
  // Estados
  const [cohorts, setCohorts] = useState<CohortAnalise[]>([])
  const [cohortSelecionado, setCohortSelecionado] = useState<string>('')
  const [comparativo, setComparativo] = useState<ComparativoCohorts | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('12_meses')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  
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
  const formatarNumero = useCallback((numero: number | undefined): string => {
    if (numero === undefined || numero === null || isNaN(numero)) return '0'
    
    try {
      return numero.toLocaleString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar número:', error)
      return numero.toString()
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
  
  const formatarTempo = useCallback((meses: number | undefined): string => {
    if (meses === undefined || meses === null || isNaN(meses)) return 'N/A'
    
    try {
      if (meses < 1) {
        const dias = Math.round(meses * 30)
        return `${dias} dias`
      } else if (meses < 12) {
        return `${meses.toFixed(1)} meses`
      } else {
        const anos = Math.floor(meses / 12)
        const mesesRestantes = Math.round(meses % 12)
        return mesesRestantes > 0 ? `${anos}a ${mesesRestantes}m` : `${anos} anos`
      }
    } catch (error) {
      console.error('Erro ao formatar tempo:', error)
      return `${meses} meses`
    }
  }, [])
  
  const formatarData = useCallback((dataString: string | undefined): string => {
    if (!dataString) return 'N/A'
    
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) return 'Data inválida'
      
      return data.toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Erro de formato'
    }
  }, [])
  
  const getStatusCor = useCallback((status: string) => {
    const cores = {
      ativo: 'bg-green-100 text-green-800',
      concluido: 'bg-blue-100 text-blue-800',
      monitoramento: 'bg-yellow-100 text-yellow-800'
    }
    return cores[status as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  // API Mock
  const carregarCohorts = useCallback(async () => {
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
        const mockCohorts: CohortAnalise[] = [
          {
            id: 'cohort_001',
            nome: 'Admissões Q1 2024',
            criterioAgrupamento: 'Data de admissão (Jan-Mar 2024)',
            dataInicioPeriodo: '2024-01-01',
            tamanhoInicial: 145,
            colaboradoresRemanescentes: 132,
            taxaRetencao: 91.0,
            tempoMedioPermanencia: 9.2,
            scoreMedioRisco: 35.8,
            principaisCausasSaida: [
              'Expectativas não atendidas (38%)',
              'Problemas de fit cultural (31%)',
              'Proposta melhor externa (23%)',
              'Questões pessoais (8%)'
            ],
            intervencaoAplicadas: [
              'Programa de mentoria intensivo',
              'Check-ins semanais nos primeiros 3 meses',
              'Ajuste de expectativas sobre carreira'
            ],
            efetividadeAcoes: 78.5,
            status: 'ativo',
            dadosEvoluacao: [
              { mes: '2024-01', remanescentes: 145, saidasMes: 0, scoreMedio: 25.0 },
              { mes: '2024-02', remanescentes: 142, saidasMes: 3, scoreMedio: 28.5 },
              { mes: '2024-03', remanescentes: 139, saidasMes: 3, scoreMedio: 32.1 },
              { mes: '2024-04', remanescentes: 137, saidasMes: 2, scoreMedio: 34.8 },
              { mes: '2024-05', remanescentes: 135, saidasMes: 2, scoreMedio: 36.2 },
              { mes: '2024-06', remanescentes: 134, saidasMes: 1, scoreMedio: 35.9 },
              { mes: '2024-07', remanescentes: 133, saidasMes: 1, scoreMedio: 35.1 },
              { mes: '2024-08', remanescentes: 132, saidasMes: 1, scoreMedio: 35.8 },
              { mes: '2024-09', remanescentes: 132, saidasMes: 0, scoreMedio: 35.8 }
            ]
          },
          {
            id: 'cohort_002',
            nome: 'Desenvolvedores Senior',
            criterioAgrupamento: 'Cargo: Desenvolvedor Senior (todos)',
            dataInicioPeriodo: '2023-01-01',
            tamanhoInicial: 89,
            colaboradoresRemanescentes: 67,
            taxaRetencao: 75.3,
            tempoMedioPermanencia: 18.4,
            scoreMedioRisco: 52.1,
            principaisCausasSaida: [
              'Melhores propostas salariais (45%)',
              'Falta de crescimento técnico (32%)',
              'Mudança para remote-first (14%)',
              'Conflitos com liderança (9%)'
            ],
            intervencaoAplicadas: [
              'Revisão salarial emergencial',
              'Programa de certificações técnicas',
              'Flexibilização de horários',
              'Coaching de liderança'
            ],
            efetividadeAcoes: 65.2,
            status: 'monitoramento',
            dadosEvoluacao: [
              { mes: '2023-01', remanescentes: 89, saidasMes: 0, scoreMedio: 42.1 },
              { mes: '2023-03', remanescentes: 85, saidasMes: 4, scoreMedio: 45.8 },
              { mes: '2023-06', remanescentes: 79, saidasMes: 6, scoreMedio: 48.9 },
              { mes: '2023-09', remanescentes: 74, saidasMes: 5, scoreMedio: 51.2 },
              { mes: '2023-12', remanescentes: 70, saidasMes: 4, scoreMedio: 52.1 },
              { mes: '2024-03', remanescentes: 68, saidasMes: 2, scoreMedio: 51.8 },
              { mes: '2024-06', remanescentes: 67, saidasMes: 1, scoreMedio: 52.1 },
              { mes: '2024-09', remanescentes: 67, saidasMes: 0, scoreMedio: 52.1 }
            ]
          },
          {
            id: 'cohort_003',
            nome: 'Gestores Intermediários',
            criterioAgrupamento: 'Nível: Coordenador/Supervisor',
            dataInicioPeriodo: '2022-01-01',
            tamanhoInicial: 56,
            colaboradoresRemanescentes: 41,
            taxaRetencao: 73.2,
            tempoMedioPermanencia: 24.1,
            scoreMedioRisco: 41.7,
            principaisCausasSaida: [
              'Promoção externa (40%)',
              'Estresse/burnout (27%)',
              'Falta de suporte da liderança (20%)',
              'Mudança de carreira (13%)'
            ],
            intervencaoAplicadas: [
              'Programa de desenvolvimento gerencial',
              'Suporte psicológico/coaching',
              'Clarificação de expectations',
              'Programa de sucessão'
            ],
            efetividadeAcoes: 72.8,
            status: 'ativo',
            dadosEvoluacao: [
              { mes: '2022-01', remanescentes: 56, saidasMes: 0, scoreMedio: 32.5 },
              { mes: '2022-06', remanescentes: 53, saidasMes: 3, scoreMedio: 36.8 },
              { mes: '2022-12', remanescentes: 49, saidasMes: 4, scoreMedio: 39.2 },
              { mes: '2023-06', remanescentes: 46, saidasMes: 3, scoreMedio: 40.1 },
              { mes: '2023-12', remanescentes: 43, saidasMes: 3, scoreMedio: 41.2 },
              { mes: '2024-06', remanescentes: 42, saidasMes: 1, scoreMedio: 41.5 },
              { mes: '2024-09', remanescentes: 41, saidasMes: 1, scoreMedio: 41.7 }
            ]
          }
        ]
        
        const mockComparativo: ComparativoCohorts = {
          cohorts: [
            { nome: 'Q1 2024', taxaRetencao: 91.0, tempoMedio: 9.2, scoreMedio: 35.8, cor: 'bg-green-500' },
            { nome: 'Dev Senior', taxaRetencao: 75.3, tempoMedio: 18.4, scoreMedio: 52.1, cor: 'bg-orange-500' },
            { nome: 'Gestores', taxaRetencao: 73.2, tempoMedio: 24.1, scoreMedio: 41.7, cor: 'bg-blue-500' }
          ],
          insights: [
            'Novos admitidos têm melhor taxa de retenção quando passam por mentoria',
            'Desenvolvedores seniors são o grupo de maior risco por questões salariais',
            'Gestores intermediários precisam de mais suporte da liderança senior',
            'Intervenções nos primeiros 6 meses são 3x mais efetivas'
          ]
        }
        
        setCohorts(mockCohorts)
        setComparativo(mockComparativo)
        
        // Selecionar primeiro cohort por padrão
        if (mockCohorts.length > 0) {
          setCohortSelecionado(mockCohorts[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cohorts:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar análise de cohorts. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregando(false)
      }
    }
  }, [filtroPeriodo, filtroTipo, filtroStatus])
  
  // Efeito para carregar dados
  useEffect(() => {
    carregarCohorts()
  }, [carregarCohorts])
  
  // Dados filtrados
  const cohortsExibidos = useMemo(() => {
    let filtrados = [...cohorts]
    
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(cohort => {
        if (filtroTipo === 'admissao') return cohort.criterioAgrupamento.includes('admissão')
        if (filtroTipo === 'cargo') return cohort.criterioAgrupamento.includes('Cargo')
        if (filtroTipo === 'nivel') return cohort.criterioAgrupamento.includes('Nível')
        return true
      })
    }
    
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(cohort => cohort.status === filtroStatus)
    }
    
    return filtrados
  }, [cohorts, filtroTipo, filtroStatus])
  
  const cohortAtual = cohorts.find(c => c.id === cohortSelecionado)
  
  // Handlers
  const handleExportar = useCallback(() => {
    toast.success('Relatório de cohorts exportado com sucesso')
    console.log('Exportando análise de cohorts...')
  }, [])
  
  // Renderização de estados
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando análise de cohorts...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar análise</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={carregarCohorts}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="admissao">Por admissão</SelectItem>
              <SelectItem value="cargo">Por cargo</SelectItem>
              <SelectItem value="nivel">Por nível</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6_meses">Últimos 6 meses</SelectItem>
              <SelectItem value="12_meses">Últimos 12 meses</SelectItem>
              <SelectItem value="24_meses">Últimos 24 meses</SelectItem>
              <SelectItem value="todos">Todo período</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="monitoramento">Monitoramento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleExportar}>
          <LucideIcons.Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>
      
      {/* Comparativo entre Cohorts */}
      {comparativo && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo entre Cohorts</CardTitle>
            <CardDescription>
              Visão geral das principais métricas de retenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {comparativo.cohorts.map((cohort, index) => (
                <div key={index} className="text-center">
                  <div className={`h-3 w-full ${cohort.cor} rounded mb-2`}></div>
                  <h4 className="font-medium">{cohort.nome}</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <div>Retenção: {formatarPercentual(cohort.taxaRetencao)}</div>
                    <div>Permanência: {formatarTempo(cohort.tempoMedio)}</div>
                    <div>Score médio: {cohort.scoreMedio.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Principais Insights</h4>
              <ul className="space-y-2">
                {comparativo.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <LucideIcons.ArrowRight className="h-4 w-4 mt-0.5 mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Seletor de Cohort */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Cohort</CardTitle>
          <CardDescription>
            Selecione um cohort para análise aprofundada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={cohortSelecionado} onValueChange={setCohortSelecionado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um cohort..." />
            </SelectTrigger>
            <SelectContent>
              {cohortsExibidos.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.nome} - {formatarPercentual(cohort.taxaRetencao)} retenção
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {/* Análise Detalhada */}
      {cohortAtual && (
        <div className="space-y-6">
          {/* Header do Cohort */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{cohortAtual.nome}</h2>
                  <p className="text-muted-foreground">{cohortAtual.criterioAgrupamento}</p>
                  <p className="text-sm text-muted-foreground">
                    Período: {formatarData(cohortAtual.dataInicioPeriodo)} • 
                    Duração: {formatarTempo(cohortAtual.tempoMedioPermanencia)} médio
                  </p>
                </div>
                
                <div className="text-right">
                  <Badge className={getStatusCor(cohortAtual.status)}>
                    {cohortAtual.status}
                  </Badge>
                  <div className="text-3xl font-bold mt-2">
                    {formatarPercentual(cohortAtual.taxaRetencao)}
                  </div>
                  <div className="text-sm text-muted-foreground">retenção</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatarNumero(cohortAtual.tamanhoInicial)}</div>
                <p className="text-sm text-muted-foreground">Tamanho inicial</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatarNumero(cohortAtual.colaboradoresRemanescentes)}</div>
                <p className="text-sm text-muted-foreground">Remanescentes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{cohortAtual.scoreMedioRisco.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">Score médio risco</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatarPercentual(cohortAtual.efetividadeAcoes)}</div>
                <p className="text-sm text-muted-foreground">Efetividade ações</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Evolução Temporal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Cohort</CardTitle>
              <CardDescription>
                Acompanhamento mensal de remanescentes e score médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cohortAtual.dadosEvoluacao.map((dados, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium w-20">
                        {formatarData(dados.mes)}
                      </div>
                      <div className="text-sm">
                        {formatarNumero(dados.remanescentes)} remanescentes
                      </div>
                      {dados.saidasMes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          -{dados.saidasMes} saídas
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Score: {dados.scoreMedio.toFixed(1)}
                      </div>
                      <Progress value={dados.scoreMedio} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Principais Causas de Saída */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Causas de Saída</CardTitle>
              <CardDescription>
                Análise dos motivos de desligamento no cohort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cohortAtual.principaisCausasSaida.map((causa, index) => (
                  <div key={index} className="flex items-center">
                    <LucideIcons.ArrowRight className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{causa}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Intervenções Aplicadas */}
          <Card>
            <CardHeader>
              <CardTitle>Intervenções Aplicadas</CardTitle>
              <CardDescription>
                Ações implementadas para melhorar retenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {cohortAtual.intervencaoAplicadas.map((intervencao, index) => (
                  <div key={index} className="flex items-center">
                    <LucideIcons.CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">{intervencao}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Efetividade geral das ações:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={cohortAtual.efetividadeAcoes} className="w-24" />
                    <span className="text-sm font-bold">
                      {formatarPercentual(cohortAtual.efetividadeAcoes)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {cohortsExibidos.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.Users className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhum cohort encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Não há cohorts disponíveis com os filtros aplicados. Tente ajustar os critérios.
          </p>
        </div>
      )}
    </div>
  )
}