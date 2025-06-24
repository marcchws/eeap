'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAnalisePredicContext } from './context'

// Tipos específicos
interface MetricaRisco {
  faixa: 'baixo' | 'medio' | 'alto' | 'critico'
  label: string
  quantidade: number
  percentual: number
  variacao: number
  cor: string
}

interface DepartamentoMetrica {
  nome: string
  totalColaboradores: number
  scoreMedioRisco: number
  distribuicaoRisco: {
    baixo: number
    medio: number
    alto: number
    critico: number
  }
  tendencia: 'subindo' | 'estavel' | 'descendo'
}

interface ROIIntervencao {
  periodo: string
  intervencoeRealizadas: number
  colaboradoresRetidos: number
  economiaEstimada: number
  custoIntervencoes: number
  roiPercentual: number
}

export default function DashboardPreditivo() {
  // Estados
  const [metricas, setMetricas] = useState<MetricaRisco[]>([])
  const [departamentos, setDepartamentos] = useState<DepartamentoMetrica[]>([])
  const [roiData, setRoiData] = useState<ROIIntervencao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState('12_meses')
  const [departamentoFiltro, setDepartamentoFiltro] = useState('todos')
  
  const montadoRef = useRef(true)
  const { perfilUsuario, estadoGlobal } = useAnalisePredicContext()
  
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
      if (numero >= 1000000) {
        return `${(numero / 1000000).toFixed(1)}M`
      } else if (numero >= 1000) {
        return `${(numero / 1000).toFixed(1)}K`
      }
      return numero.toLocaleString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar número:', error)
      return numero.toString()
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
  
  const formatarPercentual = useCallback((valor: number | undefined): string => {
    if (valor === undefined || valor === null || isNaN(valor)) return '0%'
    
    try {
      return `${valor.toFixed(1)}%`
    } catch (error) {
      console.error('Erro ao formatar percentual:', error)
      return `${valor}%`
    }
  }, [])
  
  // API Mock
  const carregarMetricas = useCallback(async () => {
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
        // Mock das métricas de risco
        const mockMetricas: MetricaRisco[] = [
          {
            faixa: 'baixo',
            label: 'Baixo Risco',
            quantidade: 8420,
            percentual: 56.1,
            variacao: 2.3,
            cor: 'bg-green-500'
          },
          {
            faixa: 'medio',
            label: 'Médio Risco',
            quantidade: 4680,
            percentual: 31.2,
            variacao: -1.8,
            cor: 'bg-yellow-500'
          },
          {
            faixa: 'alto',
            label: 'Alto Risco',
            quantidade: 1560,
            percentual: 10.4,
            variacao: -0.5,
            cor: 'bg-orange-500'
          },
          {
            faixa: 'critico',
            label: 'Risco Crítico',
            quantidade: 340,
            percentual: 2.3,
            variacao: 0.8,
            cor: 'bg-red-500'
          }
        ]
        
        // Mock dos departamentos
        const mockDepartamentos: DepartamentoMetrica[] = [
          {
            nome: 'Tecnologia',
            totalColaboradores: 2840,
            scoreMedioRisco: 45.2,
            distribuicaoRisco: { baixo: 1420, medio: 980, alto: 320, critico: 120 },
            tendencia: 'subindo'
          },
          {
            nome: 'Vendas',
            totalColaboradores: 1950,
            scoreMedioRisco: 38.7,
            distribuicaoRisco: { baixo: 1180, medio: 580, alto: 150, critico: 40 },
            tendencia: 'estavel'
          },
          {
            nome: 'Marketing',
            totalColaboradores: 680,
            scoreMedioRisco: 42.1,
            distribuicaoRisco: { baixo: 380, medio: 220, alto: 60, critico: 20 },
            tendencia: 'descendo'
          },
          {
            nome: 'Operações',
            totalColaboradores: 3200,
            scoreMedioRisco: 35.8,
            distribuicaoRisco: { baixo: 2100, medio: 850, alto: 200, critico: 50 },
            tendencia: 'descendo'
          },
          {
            nome: 'Recursos Humanos',
            totalColaboradores: 320,
            scoreMedioRisco: 28.4,
            distribuicaoRisco: { baixo: 240, medio: 60, alto: 15, critico: 5 },
            tendencia: 'estavel'
          }
        ]
        
        // Mock do ROI
        const mockROI: ROIIntervencao[] = [
          {
            periodo: 'Último trimestre',
            intervencoeRealizadas: 287,
            colaboradoresRetidos: 203,
            economiaEstimada: 2450000,
            custoIntervencoes: 180000,
            roiPercentual: 1261
          }
        ]
        
        setMetricas(mockMetricas)
        setDepartamentos(mockDepartamentos)
        setRoiData(mockROI)
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar dados do dashboard. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregando(false)
      }
    }
  }, [periodoSelecionado, departamentoFiltro])
  
  // Efeito para carregar dados
  useEffect(() => {
    carregarMetricas()
  }, [carregarMetricas])
  
  // Cálculos derivados
  const totalColaboradores = useMemo(() => {
    return metricas.reduce((total, metrica) => total + metrica.quantidade, 0)
  }, [metricas])
  
  const scoreMedioGeral = useMemo(() => {
    if (departamentos.length === 0) return 0
    
    const somaScore = departamentos.reduce((soma, dept) => 
      soma + (dept.scoreMedioRisco * dept.totalColaboradores), 0
    )
    const totalPessoas = departamentos.reduce((total, dept) => total + dept.totalColaboradores, 0)
    
    return totalPessoas > 0 ? somaScore / totalPessoas : 0
  }, [departamentos])
  
  // Handlers
  const handleExportar = useCallback(() => {
    toast.success('Relatório exportado com sucesso')
    console.log('Exportando dados do dashboard...')
  }, [])
  
  const handleAtualizarDados = useCallback(() => {
    toast.info('Atualizando dados...')
    carregarMetricas()
  }, [carregarMetricas])
  
  // Renderização de estados
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando dashboard preditivo...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={carregarMetricas}>
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
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3_meses">Últimos 3 meses</SelectItem>
              <SelectItem value="6_meses">Últimos 6 meses</SelectItem>
              <SelectItem value="12_meses">Últimos 12 meses</SelectItem>
              <SelectItem value="24_meses">Últimos 24 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os departamentos</SelectItem>
              <SelectItem value="tecnologia">Tecnologia</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operacoes">Operações</SelectItem>
              <SelectItem value="rh">Recursos Humanos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleAtualizarDados}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={handleExportar}>
            <LucideIcons.Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica) => (
          <Card key={metrica.faixa}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metrica.label}
              </CardTitle>
              <div className={`h-3 w-3 rounded-full ${metrica.cor}`}></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(metrica.quantidade)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{formatarPercentual(metrica.percentual)} do total</span>
                <Badge 
                  variant={metrica.variacao >= 0 ? "destructive" : "secondary"}
                  className="ml-2"
                >
                  {metrica.variacao >= 0 ? '+' : ''}{formatarPercentual(metrica.variacao)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatarNumero(totalColaboradores)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Ativos na plataforma
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Médio de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scoreMedioGeral.toFixed(1)}</div>
            <Progress value={scoreMedioGeral} className="mt-3" />
            <p className="text-sm text-muted-foreground mt-1">
              Baseado em {departamentos.length} departamentos
            </p>
          </CardContent>
        </Card>
        
        {roiData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ROI de Intervenções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatarPercentual(roiData[0].roiPercentual)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {roiData[0].colaboradoresRetidos} colaboradores retidos
              </p>
              <p className="text-xs text-muted-foreground">
                Economia: {formatarMoeda(roiData[0].economiaEstimada)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Análise por departamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Departamentos</CardTitle>
          <CardDescription>
            Distribuição de risco e tendências por área organizacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departamentos.map((dept) => (
              <div key={dept.nome} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">{dept.nome}</h4>
                    <Badge variant="outline">
                      {formatarNumero(dept.totalColaboradores)} pessoas
                    </Badge>
                    <Badge 
                      variant={
                        dept.tendencia === 'subindo' ? 'destructive' : 
                        dept.tendencia === 'descendo' ? 'secondary' : 'outline'
                      }
                    >
                      {dept.tendencia === 'subindo' && <LucideIcons.TrendingUp className="mr-1 h-3 w-3" />}
                      {dept.tendencia === 'descendo' && <LucideIcons.TrendingDown className="mr-1 h-3 w-3" />}
                      {dept.tendencia === 'estavel' && <LucideIcons.Minus className="mr-1 h-3 w-3" />}
                      {dept.tendencia}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{dept.scoreMedioRisco.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Score médio</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600">
                      {formatarNumero(dept.distribuicaoRisco.baixo)}
                    </div>
                    <div className="text-xs text-muted-foreground">Baixo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-600">
                      {formatarNumero(dept.distribuicaoRisco.medio)}
                    </div>
                    <div className="text-xs text-muted-foreground">Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-600">
                      {formatarNumero(dept.distribuicaoRisco.alto)}
                    </div>
                    <div className="text-xs text-muted-foreground">Alto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-600">
                      {formatarNumero(dept.distribuicaoRisco.critico)}
                    </div>
                    <div className="text-xs text-muted-foreground">Crítico</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}