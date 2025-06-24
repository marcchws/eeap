'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Tipos específicos de relatórios
interface RelatorioJornada {
  colaborador: {
    id: string;
    nome: string;
    cargo: string;
    departamento: string;
    tempo_empresa: string;
  };
  estatisticas: {
    total_eventos: number;
    eventos_positivos: number;
    eventos_negativos: number;
    total_friccoes: number;
    friccoes_resolvidas: number;
    total_milestones: number;
    milestones_concluidos: number;
    score_jornada: number;
    tendencia: 'crescente' | 'estavel' | 'decrescente';
  };
  principais_friccoes: Array<{
    tipo: string;
    descricao: string;
    impacto: number;
    status: string;
  }>;
  proximos_milestones: Array<{
    titulo: string;
    data_prevista: string;
    categoria: string;
  }>;
}

interface RelatorioComparativo {
  departamento: string;
  funcionarios: number;
  score_medio_jornada: number;
  friccoes_por_funcionario: number;
  milestones_por_funcionario: number;
  satisfacao_media: number;
  tendencia: 'crescente' | 'estavel' | 'decrescente';
}

interface RelatorioPadroes {
  padrao: string;
  descricao: string;
  frequencia: number;
  impacto_medio: number;
  departamentos_afetados: string[];
  recomendacoes: string[];
}

interface RelatoriosSectionProps {
  colaboradorSelecionado: any;
  filtrosGlobais: any;
}

// API Mock para relatórios
const apiMockRelatorios = {
  gerarRelatorioJornada: async (colaboradorId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!colaboradorId) {
      throw new Error('Colaborador não selecionado');
    }

    const relatorio: RelatorioJornada = {
      colaborador: {
        id: colaboradorId,
        nome: 'Ana Silva Santos',
        cargo: 'Analista de RH Senior',
        departamento: 'Recursos Humanos',
        tempo_empresa: '2 anos e 9 meses'
      },
      estatisticas: {
        total_eventos: 8,
        eventos_positivos: 6,
        eventos_negativos: 2,
        total_friccoes: 5,
        friccoes_resolvidas: 2,
        total_milestones: 7,
        milestones_concluidos: 4,
        score_jornada: 78,
        tendencia: 'crescente'
      },
      principais_friccoes: [
        {
          tipo: 'Desenvolvimento',
          descricao: 'Falta de oportunidades de crescimento',
          impacto: 15,
          status: 'Em análise'
        },
        {
          tipo: 'Recurso',
          descricao: 'Equipamento de trabalho inadequado',
          impacto: 8,
          status: 'Em resolução'
        }
      ],
      proximos_milestones: [
        {
          titulo: '3 Anos na Empresa',
          data_prevista: '2025-03-15',
          categoria: 'Aniversário'
        },
        {
          titulo: 'MBA em Gestão de Pessoas',
          data_prevista: '2025-06-30',
          categoria: 'Certificação'
        }
      ]
    };

    return relatorio;
  },

  gerarRelatorioComparativo: async () => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const relatorio: RelatorioComparativo[] = [
      {
        departamento: 'Recursos Humanos',
        funcionarios: 25,
        score_medio_jornada: 82,
        friccoes_por_funcionario: 1.2,
        milestones_por_funcionario: 3.4,
        satisfacao_media: 85,
        tendencia: 'crescente'
      },
      {
        departamento: 'Tecnologia',
        funcionarios: 180,
        score_medio_jornada: 75,
        friccoes_por_funcionario: 2.1,
        milestones_por_funcionario: 2.8,
        satisfacao_media: 78,
        tendencia: 'estavel'
      },
      {
        departamento: 'Marketing',
        funcionarios: 45,
        score_medio_jornada: 71,
        friccoes_por_funcionario: 2.8,
        milestones_por_funcionario: 2.2,
        satisfacao_media: 72,
        tendencia: 'decrescente'
      },
      {
        departamento: 'Financeiro',
        funcionarios: 60,
        score_medio_jornada: 68,
        friccoes_por_funcionario: 3.2,
        milestones_por_funcionario: 1.9,
        satisfacao_media: 69,
        tendencia: 'decrescente'
      },
      {
        departamento: 'Comercial',
        funcionarios: 95,
        score_medio_jornada: 79,
        friccoes_por_funcionario: 1.8,
        milestones_por_funcionario: 3.1,
        satisfacao_media: 81,
        tendencia: 'crescente'
      }
    ];

    return relatorio.sort((a, b) => b.score_medio_jornada - a.score_medio_jornada);
  },

  gerarRelatorioPadroes: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const relatorio: RelatorioPadroes[] = [
      {
        padrao: 'Fricção pós-mudança de gestor',
        descricao: 'Colaboradores apresentam queda na satisfação 3-6 meses após mudança de gestão',
        frequencia: 68,
        impacto_medio: 15,
        departamentos_afetados: ['Tecnologia', 'Marketing', 'Comercial'],
        recomendacoes: [
          'Implementar processo estruturado de transição',
          'Acompanhamento quinzenal nos primeiros 3 meses',
          'Treinamento específico para novos gestores'
        ]
      },
      {
        padrao: 'Milestone de aniversário impacta positivamente',
        descricao: 'Comemorações de aniversário de empresa aumentam engajamento em 12 pontos em média',
        frequencia: 92,
        impacto_medio: 12,
        departamentos_afetados: ['Todos'],
        recomendacoes: [
          'Personalizar comemorações por tempo de casa',
          'Incluir reconhecimento público',
          'Conversa sobre próximos passos na carreira'
        ]
      },
      {
        padrao: 'Equipamento inadequado gera fricção recorrente',
        descricao: 'Problemas com ferramentas de trabalho são a causa #1 de fricções reportadas',
        frequencia: 45,
        impacto_medio: 8,
        departamentos_afetados: ['Tecnologia', 'Financeiro'],
        recomendacoes: [
          'Audit semestral de equipamentos',
          'Processo acelerado de upgrade',
          'Budget dedicado para atualizações'
        ]
      },
      {
        padrao: 'Promoções tardias aumentam risco de saída',
        descricao: 'Colaboradores sem promoção após 2+ anos apresentam risco de turnover 3x maior',
        frequencia: 34,
        impacto_medio: 25,
        departamentos_afetados: ['Marketing', 'Financeiro'],
        recomendacoes: [
          'Revisão de critérios de promoção',
          'Conversas de carreira semestrais',
          'Planos de desenvolvimento personalizados'
        ]
      }
    ];

    return relatorio;
  },

  exportarRelatorio: async (tipo: string, dados: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Simulação de exportação
    return { url: '#', formato: 'PDF' };
  }
};

// Funções utilitárias
const formatarData = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

const getCorTendencia = (tendencia: string) => {
  switch (tendencia) {
    case 'crescente': return 'text-green-600';
    case 'estavel': return 'text-blue-600';
    case 'decrescente': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getIconeTendencia = (tendencia: string) => {
  switch (tendencia) {
    case 'crescente': return LucideIcons.TrendingUp;
    case 'estavel': return LucideIcons.Minus;
    case 'decrescente': return LucideIcons.TrendingDown;
    default: return LucideIcons.Minus;
  }
};

const getCorScore = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export default function RelatoriosSection({ colaboradorSelecionado, filtrosGlobais }: RelatoriosSectionProps) {
  // Estados dos relatórios
  const [relatorioJornada, setRelatorioJornada] = useState<RelatorioJornada | null>(null);
  const [relatorioComparativo, setRelatorioComparativo] = useState<RelatorioComparativo[]>([]);
  const [relatorioPadroes, setRelatorioPadroes] = useState<RelatorioPadroes[]>([]);
  
  // Estados de carregamento
  const [carregandoJornada, setCarregandoJornada] = useState(false);
  const [carregandoComparativo, setCarregandoComparativo] = useState(false);
  const [carregandoPadroes, setCarregandoPadroes] = useState(false);
  const [exportando, setExportando] = useState(false);
  
  // Estados de erro
  const [erroJornada, setErroJornada] = useState<string | null>(null);
  const [erroComparativo, setErroComparativo] = useState<string | null>(null);
  const [erroPadroes, setErroPadroes] = useState<string | null>(null);

  // Aba selecionada
  const [abaRelatorio, setAbaRelatorio] = useState<'individual' | 'comparativo' | 'padroes'>('individual');

  // Ref para controle de montagem
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    carregarRelatorioComparativo();
    carregarRelatorioPadroes();
    
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar relatório individual quando colaborador muda
  useEffect(() => {
    if (colaboradorSelecionado?.id && abaRelatorio === 'individual') {
      carregarRelatorioJornada();
    }
  }, [colaboradorSelecionado, abaRelatorio]);

  // Carregar relatório de jornada individual
  const carregarRelatorioJornada = useCallback(async () => {
    if (!montadoRef.current || !colaboradorSelecionado?.id) return;
    
    setCarregandoJornada(true);
    setErroJornada(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoJornada(false);
        setErroJornada('Tempo excedido. Tente novamente.');
      }
    }, 8000);
    
    try {
      const relatorio = await apiMockRelatorios.gerarRelatorioJornada(colaboradorSelecionado.id);
      if (montadoRef.current) {
        setRelatorioJornada(relatorio);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de jornada:', error);
      if (montadoRef.current) {
        setErroJornada('Falha ao gerar relatório de jornada. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoJornada(false);
      }
    }
  }, [colaboradorSelecionado]);

  // Carregar relatório comparativo
  const carregarRelatorioComparativo = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoComparativo(true);
    setErroComparativo(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoComparativo(false);
        setErroComparativo('Tempo excedido. Tente novamente.');
      }
    }, 8000);
    
    try {
      const relatorio = await apiMockRelatorios.gerarRelatorioComparativo();
      if (montadoRef.current) {
        setRelatorioComparativo(relatorio);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório comparativo:', error);
      if (montadoRef.current) {
        setErroComparativo('Falha ao gerar relatório comparativo. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoComparativo(false);
      }
    }
  }, []);

  // Carregar relatório de padrões
  const carregarRelatorioPadroes = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoPadroes(true);
    setErroPadroes(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoPadroes(false);
        setErroPadroes('Tempo excedido. Tente novamente.');
      }
    }, 8000);
    
    try {
      const relatorio = await apiMockRelatorios.gerarRelatorioPadroes();
      if (montadoRef.current) {
        setRelatorioPadroes(relatorio);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de padrões:', error);
      if (montadoRef.current) {
        setErroPadroes('Falha ao gerar relatório de padrões. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoPadroes(false);
      }
    }
  }, []);

  // Exportar relatório
  const handleExportar = useCallback(async (tipo: string) => {
    setExportando(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setExportando(false);
        toast.error('Tempo excedido na exportação');
      }
    }, 5000);
    
    try {
      let dados;
      switch (tipo) {
        case 'individual':
          dados = relatorioJornada;
          break;
        case 'comparativo':
          dados = relatorioComparativo;
          break;
        case 'padroes':
          dados = relatorioPadroes;
          break;
        default:
          dados = null;
      }
      
      const resultado = await apiMockRelatorios.exportarRelatorio(tipo, dados);
      if (montadoRef.current) {
        toast.success(`Relatório exportado com sucesso! Formato: ${resultado.formato}`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      if (montadoRef.current) {
        toast.error('Falha na exportação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setExportando(false);
      }
    }
  }, [relatorioJornada, relatorioComparativo, relatorioPadroes]);

  // Mudar aba
  const handleMudarAba = useCallback((aba: 'individual' | 'comparativo' | 'padroes') => {
    setAbaRelatorio(aba);
    
    // Carregar dados específicos da aba se necessário
    if (aba === 'individual' && colaboradorSelecionado?.id && !relatorioJornada) {
      carregarRelatorioJornada();
    }
  }, [colaboradorSelecionado, relatorioJornada, carregarRelatorioJornada]);

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <LucideIcons.BarChart3 className="mr-2 h-5 w-5" />
                Relatórios Especializados
              </CardTitle>
              <CardDescription>
                Análises detalhadas e insights sobre jornadas de colaboradores
              </CardDescription>
            </div>
            <Button
              onClick={() => handleExportar(abaRelatorio)}
              disabled={exportando}
              className="flex items-center"
            >
              {exportando ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <LucideIcons.Download className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Abas de Relatórios */}
      <Tabs value={abaRelatorio} onValueChange={handleMudarAba}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual" className="flex items-center">
            <LucideIcons.User className="mr-2 h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center">
            <LucideIcons.BarChart2 className="mr-2 h-4 w-4" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="padroes" className="flex items-center">
            <LucideIcons.Search className="mr-2 h-4 w-4" />
            Padrões
          </TabsTrigger>
        </TabsList>

        {/* Relatório Individual */}
        <TabsContent value="individual" className="mt-6 space-y-6">
          {!colaboradorSelecionado && (
            <Card>
              <CardContent className="text-center py-12">
                <LucideIcons.User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um colaborador</h3>
                <p className="text-gray-500">
                  Para gerar o relatório individual, primeiro selecione um colaborador usando os filtros globais acima.
                </p>
              </CardContent>
            </Card>
          )}

          {colaboradorSelecionado && carregandoJornada && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Gerando relatório individual</h3>
                <p className="text-gray-500">Analisando jornada completa do colaborador...</p>
              </CardContent>
            </Card>
          )}

          {colaboradorSelecionado && !carregandoJornada && erroJornada && (
            <Card>
              <CardContent className="text-center py-12">
                <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Erro ao gerar relatório</h3>
                <p className="text-gray-500 mb-4">{erroJornada}</p>
                <Button onClick={carregarRelatorioJornada}>
                  <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {colaboradorSelecionado && !carregandoJornada && !erroJornada && relatorioJornada && (
            <div className="space-y-6">
              {/* Cabeçalho do colaborador */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{relatorioJornada.colaborador.nome}</h2>
                      <p className="text-gray-600 mt-1">
                        {relatorioJornada.colaborador.cargo} • {relatorioJornada.colaborador.departamento}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getCorScore(relatorioJornada.estatisticas.score_jornada)}`}>
                        {relatorioJornada.estatisticas.score_jornada}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Score da Jornada</p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Estatísticas gerais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{relatorioJornada.estatisticas.total_eventos}</div>
                    <p className="text-xs text-muted-foreground">Total de Eventos</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="outline" className="text-xs mr-1">
                        {relatorioJornada.estatisticas.eventos_positivos} positivos
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{relatorioJornada.estatisticas.total_friccoes}</div>
                    <p className="text-xs text-muted-foreground">Fricções Identificadas</p>
                    <div className="flex items-center mt-2">
                      <Badge variant={relatorioJornada.estatisticas.friccoes_resolvidas > 0 ? "default" : "secondary"} className="text-xs">
                        {relatorioJornada.estatisticas.friccoes_resolvidas} resolvidas
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{relatorioJornada.estatisticas.total_milestones}</div>
                    <p className="text-xs text-muted-foreground">Milestones</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="default" className="text-xs">
                        {relatorioJornada.estatisticas.milestones_concluidos} concluídos
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">{relatorioJornada.colaborador.tempo_empresa}</div>
                      {(() => {
                        const IconeTendencia = getIconeTendencia(relatorioJornada.estatisticas.tendencia);
                        return <IconeTendencia className={`h-5 w-5 ${getCorTendencia(relatorioJornada.estatisticas.tendencia)}`} />;
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Tempo de Empresa</p>
                  </CardContent>
                </Card>
              </div>

              {/* Principais fricções */}
              {relatorioJornada.principais_friccoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Principais Fricções Identificadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relatorioJornada.principais_friccoes.map((friccao, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{friccao.tipo}</h4>
                            <p className="text-sm text-gray-600">{friccao.descricao}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              Impacto: {friccao.impacto}
                            </Badge>
                            <p className="text-xs text-gray-500">{friccao.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Próximos milestones */}
              {relatorioJornada.proximos_milestones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Próximos Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relatorioJornada.proximos_milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{milestone.titulo}</h4>
                            <p className="text-sm text-gray-600">Previsto para {formatarData(milestone.data_prevista)}</p>
                          </div>
                          <Badge variant="secondary">
                            {milestone.categoria}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Relatório Comparativo */}
        <TabsContent value="comparativo" className="mt-6 space-y-6">
          {carregandoComparativo && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Gerando relatório comparativo</h3>
                <p className="text-gray-500">Analisando dados de todos os departamentos...</p>
              </CardContent>
            </Card>
          )}

          {!carregandoComparativo && erroComparativo && (
            <Card>
              <CardContent className="text-center py-12">
                <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Erro ao gerar relatório</h3>
                <p className="text-gray-500 mb-4">{erroComparativo}</p>
                <Button onClick={carregarRelatorioComparativo}>
                  <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {!carregandoComparativo && !erroComparativo && relatorioComparativo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análise Comparativa por Departamento</CardTitle>
                <CardDescription>
                  Ranking de departamentos baseado no score médio de jornada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relatorioComparativo.map((dept, index) => {
                    const IconeTendencia = getIconeTendencia(dept.tendencia);
                    
                    return (
                      <div key={dept.departamento} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' : index === 1 ? 'bg-gray-100 text-gray-800' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-medium">{dept.departamento}</h3>
                              <p className="text-sm text-gray-500">{dept.funcionarios} funcionários</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`text-2xl font-bold px-3 py-1 rounded ${getCorScore(dept.score_medio_jornada)}`}>
                              {dept.score_medio_jornada}
                            </div>
                            <IconeTendencia className={`h-5 w-5 ${getCorTendencia(dept.tendencia)}`} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-medium">{dept.friccoes_por_funcionario}</div>
                            <p className="text-xs text-gray-500">Fricções/Funcionário</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-medium">{dept.milestones_por_funcionario}</div>
                            <p className="text-xs text-gray-500">Milestones/Funcionário</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-medium">{dept.satisfacao_media}%</div>
                            <p className="text-xs text-gray-500">Satisfação Média</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relatório de Padrões */}
        <TabsContent value="padroes" className="mt-6 space-y-6">
          {carregandoPadroes && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Identificando padrões</h3>
                <p className="text-gray-500">Analisando tendências e correlações...</p>
              </CardContent>
            </Card>
          )}

          {!carregandoPadroes && erroPadroes && (
            <Card>
              <CardContent className="text-center py-12">
                <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Erro ao identificar padrões</h3>
                <p className="text-gray-500 mb-4">{erroPadroes}</p>
                <Button onClick={carregarRelatorioPadroes}>
                  <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {!carregandoPadroes && !erroPadroes && relatorioPadroes.length > 0 && (
            <div className="space-y-6">
              {relatorioPadroes.map((padrao, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{padrao.padrao}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {padrao.frequencia}% dos casos
                        </Badge>
                        <Badge variant={padrao.impacto_medio >= 15 ? "destructive" : padrao.impacto_medio >= 10 ? "default" : "secondary"}>
                          Impacto: {padrao.impacto_medio}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700">{padrao.descricao}</p>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Departamentos Afetados</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {padrao.departamentos_afetados.map(dept => (
                            <Badge key={dept} variant="outline" className="text-xs">
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2 block">Recomendações</Label>
                        <ul className="space-y-1">
                          {padrao.recomendacoes.map((rec, recIndex) => (
                            <li key={recIndex} className="flex items-start">
                              <LucideIcons.CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}