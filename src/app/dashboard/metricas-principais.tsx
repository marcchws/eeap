'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

// Tipos
interface Usuario {
  id: string;
  nome: string;
  perfil: 'executivo' | 'chro' | 'gestor';
  departamentos_acesso: string[];
}

interface AlertaCritico {
  id: string;
  tipo: string;
  titulo: string;
  severidade: 'alta' | 'media' | 'baixa';
}

interface MetricaPrincipal {
  id: string;
  nome: string;
  valor_atual: number;
  valor_anterior: number;
  unidade: string;
  meta: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
  status: 'critico' | 'atencao' | 'bom' | 'excelente';
  descricao: string;
  ultima_atualizacao: string;
}

interface DepartamentoMetrica {
  id: string;
  nome: string;
  enps: number;
  turnover: number;
  engajamento: number;
  colaboradores_total: number;
  colaboradores_risco: number;
}

interface Props {
  usuario?: Usuario;
  alertasCriticos: AlertaCritico[];
}

// API Mock
const apiMock = {
  obterMetricasPrincipais: async (): Promise<MetricaPrincipal[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return [
      {
        id: '1',
        nome: 'eNPS Global',
        valor_atual: 42,
        valor_anterior: 38,
        unidade: 'pontos',
        meta: 50,
        tendencia: 'subindo',
        status: 'bom',
        descricao: 'Employee Net Promoter Score da organização',
        ultima_atualizacao: '2024-06-23T06:00:00'
      },
      {
        id: '2',
        nome: 'Taxa de Turnover',
        valor_atual: 14.5,
        valor_anterior: 16.2,
        unidade: '%',
        meta: 12.0,
        tendencia: 'descendo',
        status: 'atencao',
        descricao: 'Percentual de saídas voluntárias nos últimos 12 meses',
        ultima_atualizacao: '2024-06-23T06:00:00'
      },
      {
        id: '3',
        nome: 'Score de Engajamento',
        valor_atual: 7.2,
        valor_anterior: 6.8,
        unidade: '/10',
        meta: 8.0,
        tendencia: 'subindo',
        status: 'bom',
        descricao: 'Média do score de engajamento dos colaboradores',
        ultima_atualizacao: '2024-06-23T06:00:00'
      },
      {
        id: '4',
        nome: 'Colaboradores em Risco',
        valor_atual: 47,
        valor_anterior: 52,
        unidade: 'pessoas',
        meta: 30,
        tendencia: 'descendo',
        status: 'critico',
        descricao: 'Colaboradores com alto risco de saída (score > 70)',
        ultima_atualizacao: '2024-06-23T06:00:00'
      },
      {
        id: '5',
        nome: 'Tempo Médio de Permanência',
        valor_atual: 3.8,
        valor_anterior: 3.6,
        unidade: 'anos',
        meta: 4.5,
        tendencia: 'subindo',
        status: 'bom',
        descricao: 'Tempo médio que colaboradores permanecem na empresa',
        ultima_atualizacao: '2024-06-23T06:00:00'
      },
      {
        id: '6',
        nome: 'Taxa de Promoção Interna',
        valor_atual: 68,
        valor_anterior: 71,
        unidade: '%',
        meta: 75,
        tendencia: 'descendo',
        status: 'atencao',
        descricao: 'Percentual de vagas preenchidas internamente',
        ultima_atualizacao: '2024-06-23T06:00:00'
      }
    ];
  },
  
  obterRankingDepartamentos: async (): Promise<DepartamentoMetrica[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        nome: 'Produto & Design',
        enps: 68,
        turnover: 8.5,
        engajamento: 8.4,
        colaboradores_total: 145,
        colaboradores_risco: 3
      },
      {
        id: '2',
        nome: 'Tecnologia da Informação',
        enps: 52,
        turnover: 22.1,
        engajamento: 7.8,
        colaboradores_total: 287,
        colaboradores_risco: 18
      },
      {
        id: '3',
        nome: 'Marketing',
        enps: 45,
        turnover: 12.3,
        engajamento: 7.2,
        colaboradores_total: 89,
        colaboradores_risco: 4
      },
      {
        id: '4',
        nome: 'Recursos Humanos',
        enps: 41,
        turnover: 9.8,
        engajamento: 7.9,
        colaboradores_total: 67,
        colaboradores_risco: 2
      },
      {
        id: '5',
        nome: 'Vendas',
        enps: -15,
        turnover: 28.4,
        engajamento: 5.1,
        colaboradores_total: 234,
        colaboradores_risco: 15
      },
      {
        id: '6',
        nome: 'Financeiro',
        enps: 38,
        turnover: 11.2,
        engajamento: 6.8,
        colaboradores_total: 78,
        colaboradores_risco: 5
      }
    ];
  }
};

// Funções utilitárias
const formatarNumero = (valor: number, unidade: string): string => {
  try {
    if (unidade === '%') {
      return `${valor.toFixed(1)}%`;
    } else if (unidade === '/10') {
      return `${valor.toFixed(1)}/10`;
    } else if (unidade === 'pessoas') {
      return `${valor.toString()} pessoas`;
    } else if (unidade === 'anos') {
      return `${valor.toFixed(1)} anos`;
    } else {
      return `${valor.toString()} ${unidade}`;
    }
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return 'N/A';
  }
};

const obterCorStatus = (status: string): string => {
  switch (status) {
    case 'excelente': return 'text-green-600 bg-green-50 border-green-200';
    case 'bom': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'atencao': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critico': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const obterIconeTendencia = (tendencia: string) => {
  switch (tendencia) {
    case 'subindo': return LucideIcons.TrendingUp;
    case 'descendo': return LucideIcons.TrendingDown;
    case 'estavel': return LucideIcons.Minus;
    default: return LucideIcons.Minus;
  }
};

const calcularProgressoMeta = (valorAtual: number, meta: number): number => {
  try {
    if (meta === 0) return 0;
    return Math.min(100, Math.max(0, (valorAtual / meta) * 100));
  } catch (error) {
    console.error('Erro ao calcular progresso:', error);
    return 0;
  }
};

export default function MetricasPrincipais({ usuario, alertasCriticos }: Props) {
  // Estados
  const [metricas, setMetricas] = useState<MetricaPrincipal[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoMetrica[]>([]);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [carregandoDepartamentos, setCarregandoDepartamentos] = useState(true);
  const [erroMetricas, setErroMetricas] = useState<string | null>(null);
  const [erroDepartamentos, setErroDepartamentos] = useState<string | null>(null);
  const montadoRef = useRef(true);
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);
  
  // Carregar métricas principais
  const carregarMetricas = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoMetricas(true);
    setErroMetricas(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoMetricas(false);
        setErroMetricas('Tempo excedido ao carregar métricas.');
      }
    }, 5000);
    
    try {
      const dados = await apiMock.obterMetricasPrincipais();
      if (montadoRef.current) {
        setMetricas(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      if (montadoRef.current) {
        setErroMetricas('Falha ao carregar métricas principais.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoMetricas(false);
      }
    }
  }, []);
  
  // Carregar ranking departamentos
  const carregarDepartamentos = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoDepartamentos(true);
    setErroDepartamentos(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoDepartamentos(false);
        setErroDepartamentos('Tempo excedido ao carregar departamentos.');
      }
    }, 5000);
    
    try {
      const dados = await apiMock.obterRankingDepartamentos();
      if (montadoRef.current) {
        setDepartamentos(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      if (montadoRef.current) {
        setErroDepartamentos('Falha ao carregar ranking de departamentos.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoDepartamentos(false);
      }
    }
  }, []);
  
  // Carregar dados ao montar
  useEffect(() => {
    carregarMetricas();
    carregarDepartamentos();
  }, [carregarMetricas, carregarDepartamentos]);
  
  // Recarregar ambas as seções
  const handleRecarregarTudo = useCallback(() => {
    carregarMetricas();
    carregarDepartamentos();
    toast.success('Dados atualizados com sucesso');
  }, [carregarMetricas, carregarDepartamentos]);
  
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Métricas Principais</h2>
          <p className="text-gray-600">Visão geral dos indicadores de experiência do colaborador</p>
        </div>
        <Button onClick={handleRecarregarTudo} variant="outline">
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>
      
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carregandoMetricas ? (
          // Loading states
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : erroMetricas ? (
          <div className="col-span-full">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-center">
                <LucideIcons.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{erroMetricas}</p>
                <Button onClick={carregarMetricas} variant="outline" className="mt-3">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          metricas.map((metrica) => {
            const IconeTendencia = obterIconeTendencia(metrica.tendencia);
            const progressoMeta = calcularProgressoMeta(metrica.valor_atual, metrica.meta);
            const variacao = metrica.valor_atual - metrica.valor_anterior;
            const percentualVariacao = metrica.valor_anterior !== 0 ? 
              ((variacao / metrica.valor_anterior) * 100) : 0;
            
            return (
              <Card key={metrica.id} className={`border-2 ${obterCorStatus(metrica.status)}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metrica.nome}</CardTitle>
                    <Badge variant="outline" className={obterCorStatus(metrica.status)}>
                      {metrica.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{metrica.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold">
                      {formatarNumero(metrica.valor_atual, metrica.unidade)}
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      metrica.tendencia === 'subindo' ? 'text-green-600' :
                      metrica.tendencia === 'descendo' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <IconeTendencia className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {percentualVariacao > 0 ? '+' : ''}{percentualVariacao.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso da Meta</span>
                      <span>{formatarNumero(metrica.meta, metrica.unidade)}</span>
                    </div>
                    <Progress value={progressoMeta} className="h-2" />
                    <div className="text-xs text-gray-500">
                      {progressoMeta.toFixed(0)}% da meta atingida
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Ranking de departamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LucideIcons.Building2 className="h-5 w-5" />
            <span>Ranking de Departamentos</span>
          </CardTitle>
          <CardDescription>
            Performance dos departamentos por principais métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregandoDepartamentos ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="space-x-4 flex">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : erroDepartamentos ? (
            <div className="text-center py-8">
              <LucideIcons.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700">{erroDepartamentos}</p>
              <Button onClick={carregarDepartamentos} variant="outline" className="mt-3">
                Tentar Novamente
              </Button>
            </div>
          ) : departamentos.length === 0 ? (
            <div className="text-center py-8">
              <LucideIcons.Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum Departamento</h3>
              <p className="text-gray-500">Não há dados de departamentos disponíveis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departamentos.map((dept, index) => (
                <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{dept.nome}</div>
                      <div className="text-sm text-gray-500">
                        {dept.colaboradores_total} colaboradores • {dept.colaboradores_risco} em risco
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">eNPS</div>
                      <div className={`${
                        dept.enps >= 50 ? 'text-green-600' :
                        dept.enps >= 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {dept.enps}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">Turnover</div>
                      <div className={`${
                        dept.turnover <= 12 ? 'text-green-600' :
                        dept.turnover <= 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {dept.turnover.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">Engajamento</div>
                      <div className={`${
                        dept.engajamento >= 8 ? 'text-green-600' :
                        dept.engajamento >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {dept.engajamento.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}