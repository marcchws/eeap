'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Tipos para relatórios
interface MetricaEfetividade {
  periodo: string;
  planosExecutados: number;
  planosComSucesso: number;
  taxaSucesso: number;
  custoTotal: number;
  custoMedio: number;
  roiMedio: number;
  tempoMedioResolucao: number;
  economiaGerada: number;
}

interface EfetividadePorTipo {
  tipoAcao: string;
  totalUsos: number;
  sucessos: number;
  taxaSucesso: number;
  custoMedio: number;
  roiMedio: number;
  tempoMedio: number;
}

interface EfetividadePorDepartamento {
  departamento: string;
  colaboradores: number;
  planosAtivos: number;
  planosResolvidos: number;
  taxaSucesso: number;
  custoMedio: number;
  principaisCausas: string[];
}

interface TendenciaTemporeal {
  mes: string;
  planosAbertos: number;
  planosResolvidos: number;
  taxaSucesso: number;
  custoTotal: number;
  roi: number;
}

interface RelatoriosData {
  metricas: MetricaEfetividade;
  efetividadePorTipo: EfetividadePorTipo[];
  efetividadePorDepartamento: EfetividadePorDepartamento[];
  tendenciaTemporeal: TendenciaTemporeal[];
  melhoresPraticas: Array<{
    acao: string;
    contexto: string;
    taxaSucesso: number;
    roi: number;
    casos: number;
  }>;
  fatoresSucesso: Array<{
    fator: string;
    impacto: number;
    descricao: string;
  }>;
}

// Props do componente
interface RelatoriosEfetividadeProps {
  perfilUsuario: any;
  isPerfilEstrategico: boolean;
}

// API Mock para relatórios
const apiMockRelatorios = {
  obterRelatorios: async (periodo: string): Promise<RelatoriosData> => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      metricas: {
        periodo: periodo,
        planosExecutados: 234,
        planosComSucesso: 172,
        taxaSucesso: 73.5,
        custoTotal: 1248000,
        custoMedio: 5333,
        roiMedio: 325,
        tempoMedioResolucao: 42,
        economiaGerada: 4056000
      },
      efetividadePorTipo: [
        {
          tipoAcao: 'Conversa de Desenvolvimento',
          totalUsos: 67,
          sucessos: 58,
          taxaSucesso: 86.6,
          custoMedio: 200,
          roiMedio: 890,
          tempoMedio: 7
        },
        {
          tipoAcao: 'Ajuste Salarial',
          totalUsos: 23,
          sucessos: 22,
          taxaSucesso: 95.7,
          custoMedio: 8500,
          roiMedio: 180,
          tempoMedio: 30
        },
        {
          tipoAcao: 'Flexibilidade Horários',
          totalUsos: 45,
          sucessos: 35,
          taxaSucesso: 77.8,
          custoMedio: 150,
          roiMedio: 650,
          tempoMedio: 14
        },
        {
          tipoAcao: 'Treinamento Especialização',
          totalUsos: 38,
          sucessos: 31,
          taxaSucesso: 81.6,
          custoMedio: 3200,
          roiMedio: 420,
          tempoMedio: 60
        },
        {
          tipoAcao: 'Mudança de Projeto',
          totalUsos: 29,
          sucessos: 25,
          taxaSucesso: 86.2,
          custoMedio: 500,
          roiMedio: 780,
          tempoMedio: 21
        },
        {
          tipoAcao: 'Reconhecimento Público',
          totalUsos: 32,
          sucessos: 24,
          taxaSucesso: 75.0,
          custoMedio: 800,
          roiMedio: 290,
          tempoMedio: 10
        }
      ],
      efetividadePorDepartamento: [
        {
          departamento: 'Tecnologia',
          colaboradores: 120,
          planosAtivos: 15,
          planosResolvidos: 48,
          taxaSucesso: 81.3,
          custoMedio: 4200,
          principaisCausas: ['Falta de perspectiva técnica', 'Salário abaixo do mercado', 'Sobrecarga de trabalho']
        },
        {
          departamento: 'Vendas',
          colaboradores: 85,
          planosAtivos: 12,
          planosResolvidos: 32,
          taxaSucesso: 68.8,
          custoMedio: 6800,
          principaisCausas: ['Metas inalcançáveis', 'Comissões baixas', 'Falta de suporte']
        },
        {
          departamento: 'Marketing',
          colaboradores: 45,
          planosAtivos: 8,
          planosResolvidos: 22,
          taxaSucesso: 86.4,
          custoMedio: 3100,
          principaisCausas: ['Falta de criatividade no trabalho', 'Pouco reconhecimento', 'Orçamento limitado']
        },
        {
          departamento: 'Operações',
          colaboradores: 95,
          planosAtivos: 7,
          planosResolvidos: 28,
          taxaSucesso: 75.0,
          custoMedio: 2900,
          principaisCausas: ['Trabalho repetitivo', 'Falta de desenvolvimento', 'Gestão autoritária']
        },
        {
          departamento: 'Financeiro',
          colaboradores: 35,
          planosAtivos: 5,
          planosResolvidos: 15,
          taxaSucesso: 93.3,
          custoMedio: 5200,
          principaisCausas: ['Pressão por resultados', 'Necessidade de certificações', 'Crescimento limitado']
        }
      ],
      tendenciaTemporeal: [
        { mes: 'Jan', planosAbertos: 28, planosResolvidos: 22, taxaSucesso: 78.6, custoTotal: 156000, roi: 310 },
        { mes: 'Fev', planosAbertos: 31, planosResolvidos: 25, taxaSucesso: 80.6, custoTotal: 189000, roi: 285 },
        { mes: 'Mar', planosAbertos: 35, planosResolvidos: 28, taxaSucesso: 80.0, custoTotal: 198000, roi: 295 },
        { mes: 'Abr', planosAbertos: 42, planosResolvidos: 31, taxaSucesso: 73.8, custoTotal: 234000, roi: 278 },
        { mes: 'Mai', planosAbertos: 38, planosResolvidos: 29, taxaSucesso: 76.3, custoTotal: 212000, roi: 320 },
        { mes: 'Jun', planosAbertos: 33, planosResolvidos: 27, taxaSucesso: 81.8, custoTotal: 178000, roi: 340 }
      ],
      melhoresPraticas: [
        {
          acao: 'Conversa de carreira + flexibilidade',
          contexto: 'Profissionais sêniores com filhos',
          taxaSucesso: 94.7,
          roi: 1200,
          casos: 19
        },
        {
          acao: 'Treinamento + projeto estratégico',
          contexto: 'Desenvolvedores mid-level',
          taxaSucesso: 91.2,
          roi: 980,
          casos: 34
        },
        {
          acao: 'Ajuste salarial + reconhecimento',
          contexto: 'Top performers sub-remunerados',
          taxaSucesso: 100.0,
          roi: 450,
          casos: 12
        },
        {
          acao: 'Mudança de gestor + mentoring',
          contexto: 'Conflitos interpessoais',
          taxaSucesso: 88.9,
          roi: 750,
          casos: 18
        }
      ],
      fatoresSucesso: [
        {
          fator: 'Rapidez na intervenção',
          impacto: 85,
          descricao: 'Ações iniciadas em até 7 dias têm 85% mais chance de sucesso'
        },
        {
          fator: 'Envolvimento do gestor direto',
          impacto: 78,
          descricao: 'Gestores engajados aumentam sucesso em 78%'
        },
        {
          fator: 'Múltiplas ações coordenadas',
          impacto: 65,
          descricao: 'Planos com 2-3 ações têm 65% mais efetividade'
        },
        {
          fator: 'Personalização por perfil',
          impacto: 58,
          descricao: 'Ações personalizadas por características aumentam 58% o sucesso'
        },
        {
          fator: 'Follow-up estruturado',
          impacto: 71,
          descricao: 'Acompanhamento semanal melhora resultados em 71%'
        }
      ]
    };
  },

  exportarRelatorio: async (formato: 'pdf' | 'excel', periodo: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simular exportação
  }
};

// Funções utilitárias
const formatarMoeda = (valor: number | undefined): string => {
  if (!valor) return 'R$ 0,00';
  
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
};

const formatarNumero = (valor: number | undefined): string => {
  if (!valor) return '0';
  
  try {
    return valor.toLocaleString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return '0';
  }
};

export default function RelatoriosEfetividade({ perfilUsuario, isPerfilEstrategico }: RelatoriosEfetividadeProps) {
  // Estados principais
  const [dados, setDados] = useState<RelatoriosData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ultimo_semestre');
  const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);
  
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar relatórios
  useEffect(() => {
    carregarRelatorios();
  }, [periodoSelecionado]);

  const carregarRelatorios = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregando(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 8000);

    try {
      const dadosRelatorios = await apiMockRelatorios.obterRelatorios(periodoSelecionado);
      if (montadoRef.current) {
        setDados(dadosRelatorios);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar relatórios de efetividade. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [periodoSelecionado]);

  // Handler para mudança de período
  const handlePeriodoChange = useCallback((periodo: string) => {
    setPeriodoSelecionado(periodo);
  }, []);

  // Handler para exportar
  const handleExportar = useCallback(async (formato: 'pdf' | 'excel') => {
    if (!montadoRef.current) return;

    setExportando(formato);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setExportando(null);
        toast.error('Tempo excedido ao exportar relatório. Tente novamente.');
      }
    }, 10000);

    try {
      await apiMockRelatorios.exportarRelatorio(formato, periodoSelecionado);
      if (montadoRef.current) {
        toast.success(`Relatório ${formato.toUpperCase()} exportado com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      if (montadoRef.current) {
        toast.error('Falha ao exportar relatório. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setExportando(null);
      }
    }
  }, [periodoSelecionado]);

  // Função para obter cor baseada em taxa
  const getCorPorTaxa = useCallback((taxa: number) => {
    if (taxa >= 80) return 'text-green-600';
    if (taxa >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Handler para recarregar
  const handleRecarregar = useCallback(() => {
    carregarRelatorios();
  }, [carregarRelatorios]);

  // Renderizar loading
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
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
        <h3 className="text-lg font-medium mb-2">Erro ao carregar relatórios</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={handleRecarregar}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!dados) return null;

  return (
    <div className="space-y-8">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Relatórios de Efetividade</h2>
          <p className="text-gray-600">Análise de performance dos planos de ação</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <Label>Período</Label>
            <Select value={periodoSelecionado} onValueChange={handlePeriodoChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                <SelectItem value="ultimo_trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ultimo_semestre">Último Semestre</SelectItem>
                <SelectItem value="ultimo_ano">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isPerfilEstrategico && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportar('pdf')}
                disabled={!!exportando}
              >
                {exportando === 'pdf' ? (
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LucideIcons.FileText className="mr-2 h-4 w-4" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportar('excel')}
                disabled={!!exportando}
              >
                {exportando === 'excel' ? (
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LucideIcons.Download className="mr-2 h-4 w-4" />
                )}
                Excel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Métricas principais */}
      <div>
        <h3 className="text-md font-semibold mb-4">Resumo Executivo</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <LucideIcons.TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dados.metricas.taxaSucesso}%
              </div>
              <p className="text-xs text-gray-500">
                {dados.metricas.planosComSucesso} de {dados.metricas.planosExecutados} planos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
              <LucideIcons.DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dados.metricas.roiMedio}%
              </div>
              <p className="text-xs text-gray-500">
                Return on Investment
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Gerada</CardTitle>
              <LucideIcons.PiggyBank className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatarMoeda(dados.metricas.economiaGerada)}
              </div>
              <p className="text-xs text-gray-500">
                vs {formatarMoeda(dados.metricas.custoTotal)} investido
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <LucideIcons.Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dados.metricas.tempoMedioResolucao} dias
              </div>
              <p className="text-xs text-gray-500">
                Para resolução
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Efetividade por tipo de ação */}
      <div>
        <h3 className="text-md font-semibold mb-4">Efetividade por Tipo de Ação</h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Tipo de Ação</th>
                    <th className="text-center p-4 font-medium">Usos</th>
                    <th className="text-center p-4 font-medium">Taxa Sucesso</th>
                    <th className="text-center p-4 font-medium">Custo Médio</th>
                    <th className="text-center p-4 font-medium">ROI Médio</th>
                    <th className="text-center p-4 font-medium">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.efetividadePorTipo.map((tipo, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{tipo.tipoAcao}</td>
                      <td className="p-4 text-center">{tipo.totalUsos}</td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold ${getCorPorTaxa(tipo.taxaSucesso)}`}>
                          {tipo.taxaSucesso.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">{formatarMoeda(tipo.custoMedio)}</td>
                      <td className="p-4 text-center text-blue-600 font-semibold">
                        {tipo.roiMedio}%
                      </td>
                      <td className="p-4 text-center">{tipo.tempoMedio} dias</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efetividade por departamento */}
      <div>
        <h3 className="text-md font-semibold mb-4">Performance por Departamento</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Área</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dados.efetividadePorDepartamento.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dept.departamento}</span>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-600">{dept.planosAtivos} ativos</span>
                      <span className={`font-semibold ${getCorPorTaxa(dept.taxaSucesso)}`}>
                        {dept.taxaSucesso.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={dept.taxaSucesso} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {dept.planosResolvidos} casos resolvidos • {formatarMoeda(dept.custoMedio)} custo médio
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Principais Causas por Departamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dados.efetividadePorDepartamento.slice(0, 3).map((dept, index) => (
                <div key={index}>
                  <h4 className="font-medium mb-2">{dept.departamento}</h4>
                  <ul className="space-y-1">
                    {dept.principaisCausas.slice(0, 3).map((causa, i) => (
                      <li key={i} className="flex items-start space-x-2 text-sm">
                        <LucideIcons.AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{causa}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Melhores práticas e fatores de sucesso */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Melhores Práticas Identificadas</CardTitle>
            <CardDescription>
              Combinações de ações com maior efetividade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dados.melhoresPraticas.map((pratica, index) => (
              <div key={index} className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-green-800">{pratica.acao}</h4>
                  <Badge className="bg-green-100 text-green-800">
                    {pratica.taxaSucesso.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-sm text-green-700 mb-2">{pratica.contexto}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">ROI: {pratica.roi}%</span>
                  <span className="text-green-600">{pratica.casos} casos</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Fatores Críticos de Sucesso</CardTitle>
            <CardDescription>
              Elementos que mais impactam o resultado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dados.fatoresSucesso.map((fator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{fator.fator}</span>
                  <span className="text-sm font-semibold text-blue-600">
                    +{fator.impacto}%
                  </span>
                </div>
                <Progress value={fator.impacto} className="h-2" />
                <p className="text-xs text-gray-600">{fator.descricao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tendência temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Temporal</CardTitle>
          <CardDescription>
            Tendência de efetividade e custos ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dados.tendenciaTemporeal.map((periodo, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-6">
                  <div className="text-sm font-medium w-12">{periodo.mes}</div>
                  <div className="text-sm text-gray-600">
                    {periodo.planosAbertos} abertos
                  </div>
                  <div className="text-sm text-green-600">
                    {periodo.planosResolvidos} resolvidos
                  </div>
                  <div className="text-sm">
                    <span className={`font-semibold ${getCorPorTaxa(periodo.taxaSucesso)}`}>
                      {periodo.taxaSucesso.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-gray-500">Custo: </span>
                    <span className="font-medium">{formatarMoeda(periodo.custoTotal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ROI: </span>
                    <span className="font-medium text-blue-600">{periodo.roi}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}