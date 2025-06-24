'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipos
interface DadosAnalise {
  pesquisa_selecionada: {
    id: string;
    nome: string;
    tipo: string;
    taxa_resposta: number;
    total_respostas: number;
  };
  metricas_principais: {
    enps: number;
    score_satisfacao_geral: number;
    taxa_resposta: number;
    tempo_medio_resposta: number;
    taxa_conclusao: number;
  };
  analise_sentimentos: {
    positivo: number;
    neutro: number;
    negativo: number;
    principais_temas: Array<{
      tema: string;
      mencoes: number;
      sentimento: 'positivo' | 'negativo' | 'neutro';
    }>;
  };
  distribuicao_respostas: Array<{
    pergunta: string;
    tipo: string;
    distribuicao: any;
    score_medio?: number;
  }>;
  segmentacao: {
    por_departamento: Array<{
      departamento: string;
      enps: number;
      satisfacao: number;
      respostas: number;
    }>;
    por_cargo: Array<{
      cargo: string;
      enps: number;
      satisfacao: number;
      respostas: number;
    }>;
    por_tempo_empresa: Array<{
      faixa: string;
      enps: number;
      satisfacao: number;
      respostas: number;
    }>;
  };
  evolucao_temporal: Array<{
    periodo: string;
    enps: number;
    satisfacao: number;
    taxa_resposta: number;
  }>;
  insights_automaticos: Array<{
    tipo: 'alerta' | 'oportunidade' | 'destaque';
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    categoria: string;
  }>;
  recomendacoes: Array<{
    prioridade: 'alta' | 'media' | 'baixa';
    categoria: string;
    titulo: string;
    descricao: string;
    impacto_estimado: string;
    esforco_estimado: string;
  }>;
}

interface PesquisaOption {
  id: string;
  nome: string;
  tipo: string;
  data_fim: string;
  tem_analise: boolean;
}

// API Mock
const apiMock = {
  listarPesquisasDisponiveis: async (): Promise<PesquisaOption[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'pesq_001',
        nome: 'Pulse Survey Q1 2025',
        tipo: 'pulse',
        data_fim: '2025-01-22T18:00:00Z',
        tem_analise: true
      },
      {
        id: 'pesq_002',
        nome: 'Avaliação de Clima - Tecnologia',
        tipo: 'clima',
        data_fim: '2025-01-25T18:00:00Z',
        tem_analise: true
      },
      {
        id: 'hist_001',
        nome: 'Pulse Survey Q4 2024',
        tipo: 'pulse',
        data_fim: '2024-12-08T18:00:00Z',
        tem_analise: true
      },
      {
        id: 'hist_002',
        nome: 'Clima Organizacional 2024',
        tipo: 'clima',
        data_fim: '2024-11-30T18:00:00Z',
        tem_analise: true
      }
    ];
  },

  obterAnalisesPesquisa: async (pesquisaId: string): Promise<DadosAnalise> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      pesquisa_selecionada: {
        id: pesquisaId,
        nome: 'Pulse Survey Q1 2025',
        tipo: 'pulse',
        taxa_resposta: 76,
        total_respostas: 2164
      },
      metricas_principais: {
        enps: 42,
        score_satisfacao_geral: 4.2,
        taxa_resposta: 76,
        tempo_medio_resposta: 4.5,
        taxa_conclusao: 94
      },
      analise_sentimentos: {
        positivo: 58,
        neutro: 28,
        negativo: 14,
        principais_temas: [
          { tema: 'Ambiente de trabalho', mencoes: 342, sentimento: 'positivo' },
          { tema: 'Liderança', mencoes: 287, sentimento: 'neutro' },
          { tema: 'Crescimento profissional', mencoes: 234, sentimento: 'negativo' },
          { tema: 'Comunicação', mencoes: 189, sentimento: 'positivo' },
          { tema: 'Reconhecimento', mencoes: 156, sentimento: 'negativo' }
        ]
      },
      distribuicao_respostas: [
        {
          pergunta: 'Como você avalia sua satisfação geral com a empresa?',
          tipo: 'escala_likert',
          score_medio: 4.2,
          distribuicao: {
            '1': 156, '2': 234, '3': 445, '4': 823, '5': 506
          }
        },
        {
          pergunta: 'Você recomendaria nossa empresa como um bom lugar para trabalhar?',
          tipo: 'nps',
          score_medio: 7.3,
          distribuicao: {
            detratores: 18, neutros: 24, promotores: 58
          }
        },
        {
          pergunta: 'Como você avalia a comunicação da sua liderança?',
          tipo: 'escala_likert',
          score_medio: 3.8,
          distribuicao: {
            '1': 201, '2': 312, '3': 567, '4': 734, '5': 350
          }
        }
      ],
      segmentacao: {
        por_departamento: [
          { departamento: 'Tecnologia', enps: 52, satisfacao: 4.5, respostas: 423 },
          { departamento: 'Vendas', enps: 38, satisfacao: 4.1, respostas: 567 },
          { departamento: 'Marketing', enps: 45, satisfacao: 4.3, respostas: 134 },
          { departamento: 'RH', enps: 48, satisfacao: 4.4, respostas: 78 },
          { departamento: 'Financeiro', enps: 35, satisfacao: 3.9, respostas: 201 },
          { departamento: 'Operações', enps: 41, satisfacao: 4.0, respostas: 389 }
        ],
        por_cargo: [
          { cargo: 'Analista', enps: 44, satisfacao: 4.2, respostas: 892 },
          { cargo: 'Coordenador', enps: 40, satisfacao: 4.1, respostas: 456 },
          { cargo: 'Gerente', enps: 38, satisfacao: 4.0, respostas: 234 },
          { cargo: 'Diretor', enps: 35, satisfacao: 3.8, respostas: 89 },
          { cargo: 'Especialista', enps: 46, satisfacao: 4.3, respostas: 345 }
        ],
        por_tempo_empresa: [
          { faixa: 'Até 1 ano', enps: 48, satisfacao: 4.4, respostas: 456 },
          { faixa: '1-3 anos', enps: 43, satisfacao: 4.2, respostas: 734 },
          { faixa: '3-5 anos', enps: 39, satisfacao: 4.0, respostas: 567 },
          { faixa: '5-10 anos', enps: 36, satisfacao: 3.8, respostas: 312 },
          { faixa: 'Mais de 10 anos', enps: 42, satisfacao: 4.1, respostas: 234 }
        ]
      },
      evolucao_temporal: [
        { periodo: 'Q1 2024', enps: 35, satisfacao: 3.9, taxa_resposta: 72 },
        { periodo: 'Q2 2024', enps: 38, satisfacao: 4.0, taxa_resposta: 74 },
        { periodo: 'Q3 2024', enps: 40, satisfacao: 4.1, taxa_resposta: 78 },
        { periodo: 'Q4 2024', enps: 42, satisfacao: 4.2, taxa_resposta: 76 }
      ],
      insights_automaticos: [
        {
          tipo: 'alerta',
          titulo: 'Baixa satisfação em Crescimento Profissional',
          descricao: 'Apenas 23% dos colaboradores estão satisfeitos com as oportunidades de crescimento, especialmente no departamento de Vendas.',
          impacto: 'alto',
          categoria: 'Desenvolvimento'
        },
        {
          tipo: 'oportunidade',
          titulo: 'Alta satisfação com Ambiente de Trabalho',
          descricao: 'Tecnologia e Marketing apresentam os melhores scores de ambiente. Essa prática pode ser replicada.',
          impacto: 'medio',
          categoria: 'Cultura'
        },
        {
          tipo: 'destaque',
          titulo: 'Melhoria consistente no eNPS',
          descricao: 'Crescimento de 7 pontos no eNPS nos últimos 4 trimestres, indicando evolução positiva.',
          impacto: 'alto',
          categoria: 'Engajamento'
        }
      ],
      recomendacoes: [
        {
          prioridade: 'alta',
          categoria: 'Desenvolvimento',
          titulo: 'Programa de Mentoria',
          descricao: 'Implementar programa estruturado de mentoria focando em crescimento profissional.',
          impacto_estimado: '+8 pontos no eNPS',
          esforco_estimado: '3-6 meses'
        },
        {
          prioridade: 'alta',
          categoria: 'Liderança',
          titulo: 'Treinamento de Comunicação para Gestores',
          descricao: 'Desenvolver habilidades de comunicação e feedback dos líderes, especialmente em Vendas.',
          impacto_estimado: '+12% satisfação com liderança',
          esforco_estimado: '2-4 meses'
        },
        {
          prioridade: 'media',
          categoria: 'Reconhecimento',
          titulo: 'Sistema de Reconhecimento Peer-to-Peer',
          descricao: 'Criar plataforma para reconhecimento entre pares e celebração de conquistas.',
          impacto_estimado: '+5 pontos no eNPS',
          esforco_estimado: '1-3 meses'
        }
      ]
    };
  },

  exportarAnalises: async (pesquisaId: string, formato: 'pdf' | 'pptx'): Promise<{ url: string }> => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    return {
      url: `/api/analises/${pesquisaId}/export?formato=${formato}&timestamp=${Date.now()}`
    };
  }
};

// Funções utilitárias defensivas
const formatarPercentual = (valor: number | undefined): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return '0%';
  
  try {
    return `${Math.round(valor)}%`;
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    return '0%';
  }
};

const formatarNumero = (valor: number | undefined): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return '0';
  
  try {
    return valor.toLocaleString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return '0';
  }
};

const formatarScore = (valor: number | undefined): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return 'N/A';
  
  try {
    return valor.toFixed(1);
  } catch (error) {
    console.error('Erro ao formatar score:', error);
    return 'N/A';
  }
};

const formatarTempo = (minutos: number | undefined): string => {
  if (minutos === undefined || minutos === null || isNaN(minutos)) return 'N/A';
  
  try {
    if (minutos < 60) {
      return `${Math.round(minutos)}min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = Math.round(minutos % 60);
      return `${horas}h ${mins}min`;
    }
  } catch (error) {
    console.error('Erro ao formatar tempo:', error);
    return 'N/A';
  }
};

const obterCorENPS = (valor: number): string => {
  if (valor >= 50) return 'text-green-600';
  if (valor >= 0) return 'text-yellow-600';
  return 'text-red-600';
};

const obterCorScore = (valor: number): string => {
  if (valor >= 4.5) return 'text-green-600';
  if (valor >= 3.5) return 'text-yellow-600';
  return 'text-red-600';
};

const obterCorSentimento = (sentimento: string): string => {
  switch (sentimento) {
    case 'positivo': return 'text-green-600 bg-green-100';
    case 'negativo': return 'text-red-600 bg-red-100';
    case 'neutro': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const obterCorInsight = (tipo: string): string => {
  switch (tipo) {
    case 'alerta': return 'text-red-600 bg-red-100 border-red-200';
    case 'oportunidade': return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'destaque': return 'text-green-600 bg-green-100 border-green-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

const obterIconeInsight = (tipo: string): any => {
  switch (tipo) {
    case 'alerta': return LucideIcons.AlertTriangle;
    case 'oportunidade': return LucideIcons.Lightbulb;
    case 'destaque': return LucideIcons.Star;
    default: return LucideIcons.Info;
  }
};

const obterCorPrioridade = (prioridade: string): string => {
  switch (prioridade) {
    case 'alta': return 'text-red-600 bg-red-100';
    case 'media': return 'text-yellow-600 bg-yellow-100';
    case 'baixa': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Interface principal
interface AnalisesProps {
  usuario: any;
  permissoes: any;
  onDadosCarregados: (dados: any) => void;
}

export default function Analises({ usuario, permissoes, onDadosCarregados }: AnalisesProps) {
  // Estados principais
  const [pesquisasDisponiveis, setPesquisasDisponiveis] = useState<PesquisaOption[]>([]);
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState<string>('');
  const [dadosAnalise, setDadosAnalise] = useState<DadosAnalise | null>(null);
  const [carregandoPesquisas, setCarregandoPesquisas] = useState(true);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar pesquisas disponíveis
  useEffect(() => {
    carregarPesquisasDisponiveis();
  }, []);

  const carregarPesquisasDisponiveis = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoPesquisas(true);
    setErro(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoPesquisas(false);
        setErro('Tempo excedido ao carregar pesquisas disponíveis');
      }
    }, 8000);
    
    try {
      const pesquisas = await apiMock.listarPesquisasDisponiveis();
      
      if (montadoRef.current) {
        setPesquisasDisponiveis(pesquisas);
        
        // Selecionar automaticamente a pesquisa mais recente
        if (pesquisas.length > 0) {
          const maisRecente = pesquisas.sort((a, b) => 
            new Date(b.data_fim).getTime() - new Date(a.data_fim).getTime()
          )[0];
          setPesquisaSelecionada(maisRecente.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar pesquisas disponíveis');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoPesquisas(false);
      }
    }
  }, []);

  // Carregar análise quando pesquisa for selecionada
  useEffect(() => {
    if (pesquisaSelecionada) {
      carregarAnalise(pesquisaSelecionada);
    }
  }, [pesquisaSelecionada]);

  const carregarAnalise = useCallback(async (pesquisaId: string) => {
    if (!montadoRef.current) return;
    
    setCarregandoAnalise(true);
    setErro(null);
    setDadosAnalise(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoAnalise(false);
        setErro('Tempo excedido ao carregar análise');
      }
    }, 15000);
    
    try {
      const analise = await apiMock.obterAnalisesPesquisa(pesquisaId);
      
      if (montadoRef.current) {
        setDadosAnalise(analise);
        onDadosCarregados(analise);
      }
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar análise da pesquisa');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoAnalise(false);
      }
    }
  }, [onDadosCarregados]);

  // Handler para exportar análises
  const handleExportar = useCallback(async (formato: 'pdf' | 'pptx') => {
    if (!pesquisaSelecionada || !montadoRef.current) return;

    setExportando(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setExportando(false);
        toast.error('Tempo excedido na exportação');
      }
    }, 25000);

    try {
      const resultado = await apiMock.exportarAnalises(pesquisaSelecionada, formato);

      if (montadoRef.current) {
        // Simular download
        const link = document.createElement('a');
        link.href = resultado.url;
        link.download = `analise_${pesquisaSelecionada}_${Date.now()}.${formato}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Análise exportada em ${formato.toUpperCase()} com sucesso!`);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      if (montadoRef.current) {
        toast.error('Falha na exportação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setExportando(false);
      }
    }
  }, [pesquisaSelecionada]);

  // Retry para erro
  const handleRetry = useCallback(() => {
    if (pesquisaSelecionada) {
      carregarAnalise(pesquisaSelecionada);
    } else {
      carregarPesquisasDisponiveis();
    }
  }, [pesquisaSelecionada, carregarAnalise, carregarPesquisasDisponiveis]);

  // Verificação de permissões
  if (!permissoes.podeAnalisar) {
    return (
      <div className="text-center py-16">
        <LucideIcons.Shield className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-medium mb-2">Acesso Restrito</h3>
        <p className="text-gray-500">
          Você não tem permissão para visualizar análises. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Análises de Pesquisas</CardTitle>
          <CardDescription>
            Visualize insights detalhados e recomendações baseadas nos dados coletados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <Select
                  value={pesquisaSelecionada}
                  onValueChange={setPesquisaSelecionada}
                  disabled={carregandoPesquisas}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pesquisa" />
                  </SelectTrigger>
                  <SelectContent>
                    {pesquisasDisponiveis.map((pesquisa) => (
                      <SelectItem key={pesquisa.id} value={pesquisa.id}>
                        {pesquisa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {carregandoPesquisas && (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              )}
            </div>
            
            {dadosAnalise && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportar('pdf')}
                  disabled={exportando}
                >
                  <LucideIcons.FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportar('pptx')}
                  disabled={exportando}
                >
                  <LucideIcons.Presentation className="h-4 w-4 mr-2" />
                  PowerPoint
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estados de UI */}
      {carregandoAnalise && (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Processando análise...</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
      )}

      {!carregandoAnalise && erro && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar análise</h3>
          <p className="text-gray-700 mb-4">{erro}</p>
          <Button onClick={handleRetry}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {!carregandoAnalise && !erro && !dadosAnalise && pesquisasDisponiveis.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhuma pesquisa disponível</h3>
          <p className="text-gray-500">
            Não existem pesquisas com dados suficientes para análise no momento.
          </p>
        </div>
      )}

      {/* Conteúdo da Análise */}
      {!carregandoAnalise && !erro && dadosAnalise && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">eNPS</p>
                  <p className={`text-3xl font-bold ${obterCorENPS(dadosAnalise.metricas_principais.enps)}`}>
                    {dadosAnalise.metricas_principais.enps}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dadosAnalise.metricas_principais.enps >= 50 ? 'Excelente' :
                     dadosAnalise.metricas_principais.enps >= 0 ? 'Bom' : 'Crítico'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Satisfação Geral</p>
                  <p className={`text-3xl font-bold ${obterCorScore(dadosAnalise.metricas_principais.score_satisfacao_geral)}`}>
                    {formatarScore(dadosAnalise.metricas_principais.score_satisfacao_geral)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de 5.0</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Taxa de Resposta</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatarPercentual(dadosAnalise.metricas_principais.taxa_resposta)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatarNumero(dadosAnalise.pesquisa_selecionada.total_respostas)} respostas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatarTempo(dadosAnalise.metricas_principais.tempo_medio_resposta)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">por resposta</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Taxa de Conclusão</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatarPercentual(dadosAnalise.metricas_principais.taxa_conclusao)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">completaram</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Análise */}
          <Tabs defaultValue="sentimentos" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="sentimentos">Sentimentos</TabsTrigger>
              <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
              <TabsTrigger value="segmentacao">Segmentação</TabsTrigger>
              <TabsTrigger value="evolucao">Evolução</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="sentimentos" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Sentimentos</CardTitle>
                    <CardDescription>
                      Distribuição dos sentimentos nas respostas de texto livre
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Positivo</span>
                            <span className="text-sm font-medium text-green-600">
                              {formatarPercentual(dadosAnalise.analise_sentimentos.positivo)}
                            </span>
                          </div>
                          <Progress value={dadosAnalise.analise_sentimentos.positivo} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Neutro</span>
                            <span className="text-sm font-medium text-gray-600">
                              {formatarPercentual(dadosAnalise.analise_sentimentos.neutro)}
                            </span>
                          </div>
                          <Progress value={dadosAnalise.analise_sentimentos.neutro} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Negativo</span>
                            <span className="text-sm font-medium text-red-600">
                              {formatarPercentual(dadosAnalise.analise_sentimentos.negativo)}
                            </span>
                          </div>
                          <Progress value={dadosAnalise.analise_sentimentos.negativo} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Principais Temas</CardTitle>
                    <CardDescription>
                      Temas mais mencionados e seus sentimentos associados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dadosAnalise.analise_sentimentos.principais_temas.map((tema, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">{tema.tema}</p>
                            <p className="text-sm text-gray-500">
                              {formatarNumero(tema.mencoes)} menções
                            </p>
                          </div>
                          <Badge className={obterCorSentimento(tema.sentimento)}>
                            {tema.sentimento}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="distribuicao" className="mt-6">
              <div className="space-y-6">
                {dadosAnalise.distribuicao_respostas.map((pergunta, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{pergunta.pergunta}</CardTitle>
                      <CardDescription>
                        Tipo: {pergunta.tipo} 
                        {pergunta.score_medio && ` | Score médio: ${formatarScore(pergunta.score_medio)}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pergunta.tipo === 'escala_likert' && (
                        <div className="space-y-3">
                          {Object.entries(pergunta.distribuicao).map(([escala, quantidade]) => (
                            <div key={escala}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Escala {escala}</span>
                                <span className="text-sm font-medium">
                                  {formatarNumero(quantidade as number)} ({formatarPercentual((quantidade as number) / dadosAnalise.pesquisa_selecionada.total_respostas * 100)})
                                </span>
                              </div>
                              <Progress value={(quantidade as number) / dadosAnalise.pesquisa_selecionada.total_respostas * 100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      )}

                      {pergunta.tipo === 'nps' && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-4 border rounded">
                            <p className="text-2xl font-bold text-red-600">
                              {formatarPercentual(pergunta.distribuicao.detratores)}
                            </p>
                            <p className="text-sm text-gray-500">Detratores (0-6)</p>
                          </div>
                          <div className="p-4 border rounded">
                            <p className="text-2xl font-bold text-yellow-600">
                              {formatarPercentual(pergunta.distribuicao.neutros)}
                            </p>
                            <p className="text-sm text-gray-500">Neutros (7-8)</p>
                          </div>
                          <div className="p-4 border rounded">
                            <p className="text-2xl font-bold text-green-600">
                              {formatarPercentual(pergunta.distribuicao.promotores)}
                            </p>
                            <p className="text-sm text-gray-500">Promotores (9-10)</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="segmentacao" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dadosAnalise.segmentacao.por_departamento.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">{dept.departamento}</p>
                            <p className="text-sm text-gray-500">
                              {formatarNumero(dept.respostas)} respostas
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className={`font-medium ${obterCorENPS(dept.enps)}`}>
                              eNPS: {dept.enps}
                            </p>
                            <p className={`text-sm ${obterCorScore(dept.satisfacao)}`}>
                              Satisfação: {formatarScore(dept.satisfacao)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Por Cargo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dadosAnalise.segmentacao.por_cargo.map((cargo, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <p className="font-medium">{cargo.cargo}</p>
                              <p className="text-sm text-gray-500">
                                {formatarNumero(cargo.respostas)} respostas
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${obterCorENPS(cargo.enps)}`}>
                                {cargo.enps}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Por Tempo de Empresa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dadosAnalise.segmentacao.por_tempo_empresa.map((tempo, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <p className="font-medium">{tempo.faixa}</p>
                              <p className="text-sm text-gray-500">
                                {formatarNumero(tempo.respostas)} respostas
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${obterCorENPS(tempo.enps)}`}>
                                {tempo.enps}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evolucao" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal</CardTitle>
                  <CardDescription>
                    Acompanhe a evolução dos principais indicadores ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dadosAnalise.evolucao_temporal.map((periodo, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded">
                        <div className="font-medium">
                          {periodo.periodo}
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">eNPS</p>
                            <p className={`font-bold ${obterCorENPS(periodo.enps)}`}>
                              {periodo.enps}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Satisfação</p>
                            <p className={`font-bold ${obterCorScore(periodo.satisfacao)}`}>
                              {formatarScore(periodo.satisfacao)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Taxa Resposta</p>
                            <p className="font-bold text-blue-600">
                              {formatarPercentual(periodo.taxa_resposta)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Insights Automáticos</CardTitle>
                    <CardDescription>
                      Descobertas importantes identificadas automaticamente nos dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dadosAnalise.insights_automaticos.map((insight, index) => {
                        const IconeComponent = obterIconeInsight(insight.tipo);
                        
                        return (
                          <div key={index} className={`p-4 border rounded-lg ${obterCorInsight(insight.tipo)}`}>
                            <div className="flex items-start space-x-3">
                              <IconeComponent className="h-5 w-5 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{insight.titulo}</h4>
                                  <div className="flex space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {insight.categoria}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Impacto {insight.impacto}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm">{insight.descricao}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações de Ação</CardTitle>
                    <CardDescription>
                      Sugestões baseadas nos dados para melhorar os indicadores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dadosAnalise.recomendacoes.map((recomendacao, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Badge className={obterCorPrioridade(recomendacao.prioridade)}>
                                {recomendacao.prioridade.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {recomendacao.categoria}
                              </Badge>
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-2">{recomendacao.titulo}</h4>
                          <p className="text-sm text-gray-600 mb-3">{recomendacao.descricao}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Impacto Estimado:</p>
                              <p className="font-medium text-green-600">{recomendacao.impacto_estimado}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Esforço Estimado:</p>
                              <p className="font-medium text-blue-600">{recomendacao.esforco_estimado}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}