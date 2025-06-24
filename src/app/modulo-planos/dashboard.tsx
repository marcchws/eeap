'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Tipos para o dashboard
interface MetricaDashboard {
  titulo: string;
  valor: string | number;
  variacao: number;
  tipo: 'positiva' | 'negativa' | 'neutra';
  icone: keyof typeof LucideIcons;
}

interface CasoUrgente {
  id: string;
  colaborador: string;
  risco: number;
  departamento: string;
  diasAberto: number;
  proximaAcao: string;
}

interface TendenciaMensal {
  mes: string;
  casosAbertos: number;
  casosResolvidos: number;
  taxaSucesso: number;
}

interface DashboardData {
  metricas: MetricaDashboard[];
  casosUrgentes: CasoUrgente[];
  tendencias: TendenciaMensal[];
  distribuicaoDepartamentos: Array<{
    departamento: string;
    casos: number;
    sucesso: number;
  }>;
}

// Props do componente
interface DashboardPlanosProps {
  perfilUsuario: any;
  metricas: any;
}

// API Mock do dashboard
const apiMockDashboard = {
  obterDadosDashboard: async (): Promise<DashboardData> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      metricas: [
        {
          titulo: 'Casos Ativos',
          valor: 47,
          variacao: -12,
          tipo: 'positiva',
          icone: 'Users'
        },
        {
          titulo: 'Taxa de Sucesso',
          valor: '73.5%',
          variacao: 8.5,
          tipo: 'positiva',
          icone: 'TrendingUp'
        },
        {
          titulo: 'ROI Médio',
          valor: '325%',
          variacao: 45,
          tipo: 'positiva',
          icone: 'DollarSign'
        },
        {
          titulo: 'Tempo Médio Resolução',
          valor: '42 dias',
          variacao: -18,
          tipo: 'positiva',
          icone: 'Clock'
        },
        {
          titulo: 'Custo por Retenção',
          valor: 'R$ 3.2K',
          variacao: -22,
          tipo: 'positiva',
          icone: 'PiggyBank'
        },
        {
          titulo: 'Aprovações Pendentes',
          valor: 12,
          variacao: 15,
          tipo: 'negativa',
          icone: 'AlertCircle'
        }
      ],
      casosUrgentes: [
        {
          id: 'caso_001',
          colaborador: 'João Silva',
          risco: 92,
          departamento: 'Tecnologia',
          diasAberto: 5,
          proximaAcao: 'Conversa de carreira'
        },
        {
          id: 'caso_002',
          colaborador: 'Maria Santos',
          risco: 88,
          departamento: 'Marketing',
          diasAberto: 3,
          proximaAcao: 'Aprovação promoção'
        },
        {
          id: 'caso_003',
          colaborador: 'Pedro Costa',
          risco: 85,
          departamento: 'Vendas',
          diasAberto: 7,
          proximaAcao: 'Ajuste salarial'
        },
        {
          id: 'caso_004',
          colaborador: 'Ana Oliveira',
          risco: 83,
          departamento: 'Operações',
          diasAberto: 2,
          proximaAcao: 'Mudança de projeto'
        }
      ],
      tendencias: [
        { mes: 'Jul', casosAbertos: 65, casosResolvidos: 48, taxaSucesso: 74 },
        { mes: 'Ago', casosAbertos: 72, casosResolvidos: 53, taxaSucesso: 71 },
        { mes: 'Set', casosAbertos: 58, casosResolvidos: 43, taxaSucesso: 79 },
        { mes: 'Out', casosAbertos: 61, casosResolvidos: 47, taxaSucesso: 77 },
        { mes: 'Nov', casosAbertos: 54, casosResolvidos: 41, taxaSucesso: 82 },
        { mes: 'Dez', casosAbertos: 47, casosResolvidos: 35, taxaSucesso: 74 }
      ],
      distribuicaoDepartamentos: [
        { departamento: 'Tecnologia', casos: 15, sucesso: 80 },
        { departamento: 'Vendas', casos: 12, sucesso: 65 },
        { departamento: 'Marketing', casos: 8, sucesso: 88 },
        { departamento: 'Operações', casos: 7, sucesso: 71 },
        { departamento: 'Financeiro', casos: 5, sucesso: 90 }
      ]
    };
  }
};

export default function DashboardPlanos({ perfilUsuario, metricas }: DashboardPlanosProps) {
  // Estados
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar dados do dashboard
  useEffect(() => {
    carregarDadosDashboard();
  }, []);

  const carregarDadosDashboard = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregando(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 6000);

    try {
      const dadosDashboard = await apiMockDashboard.obterDadosDashboard();
      if (montadoRef.current) {
        setDados(dadosDashboard);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar dados do dashboard. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, []);

  // Função para obter cor da variação
  const getCorVariacao = useCallback((tipo: 'positiva' | 'negativa' | 'neutra', variacao: number) => {
    if (tipo === 'neutra') return 'text-gray-500';
    if (tipo === 'positiva') {
      return variacao > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return variacao > 0 ? 'text-red-600' : 'text-green-600';
    }
  }, []);

  // Função para obter ícone da variação
  const getIconeVariacao = useCallback((tipo: 'positiva' | 'negativa' | 'neutra', variacao: number) => {
    if (tipo === 'neutra') return LucideIcons.Minus;
    if (tipo === 'positiva') {
      return variacao > 0 ? LucideIcons.TrendingUp : LucideIcons.TrendingDown;
    } else {
      return variacao > 0 ? LucideIcons.TrendingDown : LucideIcons.TrendingUp;
    }
  }, []);

  // Função para obter cor do risco
  const getCorRisco = useCallback((risco: number) => {
    if (risco >= 90) return 'bg-red-100 text-red-800';
    if (risco >= 80) return 'bg-orange-100 text-orange-800';
    if (risco >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }, []);

  // Handler para recarregar
  const handleRecarregar = useCallback(() => {
    carregarDadosDashboard();
  }, [carregarDadosDashboard]);

  // Renderizar loading
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (!carregando && erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={handleRecarregar}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Renderizar dashboard
  if (!dados) return null;

  return (
    <div className="space-y-8">
      {/* Métricas principais */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Métricas Principais</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dados.metricas.map((metrica, index) => {
            const IconeComponent = LucideIcons[metrica.icone as keyof typeof LucideIcons] as React.ComponentType<any>;
            const IconeVariacao = getIconeVariacao(metrica.tipo, metrica.variacao);
            
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metrica.titulo}
                  </CardTitle>
                  <IconeComponent className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">
                    {metrica.valor}
                  </div>
                  <div className={`flex items-center text-sm ${getCorVariacao(metrica.tipo, metrica.variacao)}`}>
                    <IconeVariacao className="h-3 w-3 mr-1" />
                    {Math.abs(metrica.variacao)}% vs mês anterior
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Casos urgentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Casos Urgentes</h2>
          <Badge variant="destructive">
            {dados.casosUrgentes.length} casos críticos
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {dados.casosUrgentes.map((caso, index) => (
                <div key={caso.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <LucideIcons.AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium">{caso.colaborador}</h3>
                            <Badge variant="outline" className="text-xs">
                              {caso.departamento}
                            </Badge>
                            <Badge className={`text-xs ${getCorRisco(caso.risco)}`}>
                              Risco {caso.risco}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Próxima ação: {caso.proximaAcao} • Aberto há {caso.diasAberto} dias
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <LucideIcons.Eye className="h-4 w-4 mr-1" />
                        Ver Caso
                      </Button>
                      <Button size="sm">
                        <LucideIcons.MessageSquare className="h-4 w-4 mr-1" />
                        Ação Rápida
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por departamento */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Departamento</CardTitle>
            <CardDescription>
              Casos ativos e taxa de sucesso por área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dados.distribuicaoDepartamentos.map((dept, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.departamento}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{dept.casos} casos</span>
                    <span className="text-green-600">{dept.sucesso}% sucesso</span>
                  </div>
                </div>
                <Progress value={dept.sucesso} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
            <CardDescription>
              Evolução de casos abertos vs resolvidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dados.tendencias.slice(-3).map((tendencia, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">{tendencia.mes}</div>
                    <div className="text-sm text-gray-600">
                      {tendencia.casosAbertos} abertos
                    </div>
                    <div className="text-sm text-green-600">
                      {tendencia.casosResolvidos} resolvidos
                    </div>
                  </div>
                  <Badge 
                    variant={tendencia.taxaSucesso > 75 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {tendencia.taxaSucesso}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}