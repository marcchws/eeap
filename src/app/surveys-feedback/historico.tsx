'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipos
interface PesquisaHistorico {
  id: string;
  nome: string;
  tipo: 'pulse' | 'clima' | '360' | 'ad_hoc';
  status: 'finalizada' | 'arquivada' | 'cancelada';
  data_inicio: string;
  data_fim: string;
  data_finalizacao: string;
  publico_alvo: number;
  respostas_recebidas: number;
  taxa_resposta: number;
  criador: string;
  categoria: string;
  enps?: number;
  score_geral?: number;
  tem_relatorio: boolean;
}

interface RelatorioExportacao {
  tipo: 'pdf' | 'excel' | 'csv';
  incluir_respostas: boolean;
  incluir_analises: boolean;
  incluir_comentarios: boolean;
  anonimizar_dados: boolean;
}

interface ComparativoPesquisas {
  pesquisa_base: PesquisaHistorico;
  pesquisa_comparacao: PesquisaHistorico;
  metricas: {
    variacao_taxa_resposta: number;
    variacao_enps: number;
    variacao_score_geral: number;
    tendencia: 'melhora' | 'piora' | 'estavel';
  };
}

// API Mock
const apiMock = {
  listarHistorico: async (pagina: number, itensPorPagina: number, filtros: any): Promise<{
    pesquisas: PesquisaHistorico[];
    total: number;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const todasPesquisas: PesquisaHistorico[] = [
      {
        id: 'hist_001',
        nome: 'Pulse Survey Q4 2024',
        tipo: 'pulse',
        status: 'finalizada',
        data_inicio: '2024-12-01T09:00:00Z',
        data_fim: '2024-12-08T18:00:00Z',
        data_finalizacao: '2024-12-08T18:30:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2456,
        taxa_resposta: 86,
        criador: 'Ana Silva',
        categoria: 'Engajamento',
        enps: 38,
        score_geral: 4.2,
        tem_relatorio: true
      },
      {
        id: 'hist_002',
        nome: 'Clima Organizacional 2024',
        tipo: 'clima',
        status: 'finalizada',
        data_inicio: '2024-11-15T09:00:00Z',
        data_fim: '2024-11-30T18:00:00Z',
        data_finalizacao: '2024-11-30T19:45:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2234,
        taxa_resposta: 78,
        criador: 'Carlos Mendes',
        categoria: 'Clima Organizacional',
        enps: 42,
        score_geral: 4.1,
        tem_relatorio: true
      },
      {
        id: 'hist_003',
        nome: 'Feedback 360° - Q3 2024',
        tipo: '360',
        status: 'finalizada',
        data_inicio: '2024-09-01T09:00:00Z',
        data_fim: '2024-09-15T18:00:00Z',
        data_finalizacao: '2024-09-15T20:15:00Z',
        publico_alvo: 156,
        respostas_recebidas: 142,
        taxa_resposta: 91,
        criador: 'Mariana Costa',
        categoria: 'Desenvolvimento',
        score_geral: 4.3,
        tem_relatorio: true
      },
      {
        id: 'hist_004',
        nome: 'Pesquisa Home Office',
        tipo: 'ad_hoc',
        status: 'arquivada',
        data_inicio: '2024-08-10T09:00:00Z',
        data_fim: '2024-08-17T18:00:00Z',
        data_finalizacao: '2024-08-18T10:30:00Z',
        publico_alvo: 1200,
        respostas_recebidas: 987,
        taxa_resposta: 82,
        criador: 'Ricardo Santos',
        categoria: 'Trabalho Remoto',
        score_geral: 3.8,
        tem_relatorio: true
      },
      {
        id: 'hist_005',
        nome: 'Pulse Survey Q3 2024',
        tipo: 'pulse',
        status: 'cancelada',
        data_inicio: '2024-07-15T09:00:00Z',
        data_fim: '2024-07-22T18:00:00Z',
        data_finalizacao: '2024-07-20T14:00:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 234,
        taxa_resposta: 8,
        criador: 'Ana Silva',
        categoria: 'Engajamento',
        tem_relatorio: false
      }
    ];

    // Aplicar filtros
    let pesquisasFiltradas = todasPesquisas;
    
    if (filtros.termo) {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => 
        p.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        p.criador.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        p.categoria.toLowerCase().includes(filtros.termo.toLowerCase())
      );
    }
    
    if (filtros.tipo !== 'todos') {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => p.tipo === filtros.tipo);
    }
    
    if (filtros.status !== 'todos') {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => p.status === filtros.status);
    }
    
    if (filtros.periodo_inicio && filtros.periodo_fim) {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => {
        const dataFinalizacao = new Date(p.data_finalizacao);
        const inicio = new Date(filtros.periodo_inicio);
        const fim = new Date(filtros.periodo_fim);
        return dataFinalizacao >= inicio && dataFinalizacao <= fim;
      });
    }

    // Ordenar por data de finalização (mais recente primeiro)
    pesquisasFiltradas.sort((a, b) => 
      new Date(b.data_finalizacao).getTime() - new Date(a.data_finalizacao).getTime()
    );

    // Paginação
    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pesquisasPaginadas = pesquisasFiltradas.slice(inicio, fim);

    return {
      pesquisas: pesquisasPaginadas,
      total: pesquisasFiltradas.length
    };
  },

  obterEstatisticasHistorico: async (): Promise<{
    total_pesquisas: number;
    taxa_resposta_media: number;
    enps_medio: number;
    evolucao_enps: Array<{ periodo: string; valor: number }>;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      total_pesquisas: 23,
      taxa_resposta_media: 79,
      enps_medio: 40,
      evolucao_enps: [
        { periodo: 'Q1 2024', valor: 35 },
        { periodo: 'Q2 2024', valor: 38 },
        { periodo: 'Q3 2024', valor: 42 },
        { periodo: 'Q4 2024', valor: 38 }
      ]
    };
  },

  exportarRelatorio: async (pesquisaId: string, config: RelatorioExportacao): Promise<{ url: string }> => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simular geração de arquivo
    return {
      url: `/api/relatorios/${pesquisaId}/download?formato=${config.tipo}&timestamp=${Date.now()}`
    };
  },

  compararPesquisas: async (id1: string, id2: string): Promise<ComparativoPesquisas> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock do comparativo
    return {
      pesquisa_base: {
        id: id1,
        nome: 'Pulse Survey Q4 2024',
        tipo: 'pulse',
        status: 'finalizada',
        data_inicio: '2024-12-01T09:00:00Z',
        data_fim: '2024-12-08T18:00:00Z',
        data_finalizacao: '2024-12-08T18:30:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2456,
        taxa_resposta: 86,
        criador: 'Ana Silva',
        categoria: 'Engajamento',
        enps: 38,
        score_geral: 4.2,
        tem_relatorio: true
      },
      pesquisa_comparacao: {
        id: id2,
        nome: 'Clima Organizacional 2024',
        tipo: 'clima',
        status: 'finalizada',
        data_inicio: '2024-11-15T09:00:00Z',
        data_fim: '2024-11-30T18:00:00Z',
        data_finalizacao: '2024-11-30T19:45:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2234,
        taxa_resposta: 78,
        criador: 'Carlos Mendes',
        categoria: 'Clima Organizacional',
        enps: 42,
        score_geral: 4.1,
        tem_relatorio: true
      },
      metricas: {
        variacao_taxa_resposta: 8,
        variacao_enps: -4,
        variacao_score_geral: 0.1,
        tendencia: 'melhora'
      }
    };
  },

  arquivarPesquisa: async (pesquisaId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  restaurarPesquisa: async (pesquisaId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Funções utilitárias defensivas
const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    
    return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro de formato';
  }
};

const formatarDataCurta = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    
    return format(data, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro de formato';
  }
};

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

const obterCorStatus = (status: string): string => {
  switch (status) {
    case 'finalizada': return 'bg-green-100 text-green-800';
    case 'arquivada': return 'bg-gray-100 text-gray-800';
    case 'cancelada': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const obterCorTaxaResposta = (taxa: number): string => {
  if (taxa >= 80) return 'text-green-600';
  if (taxa >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const obterCorENPS = (valor: number): string => {
  if (valor >= 50) return 'text-green-600';
  if (valor >= 0) return 'text-yellow-600';
  return 'text-red-600';
};

const obterLabelTipo = (tipo: string): string => {
  const labels = {
    'pulse': 'Pulse Survey',
    'clima': 'Clima Organizacional',
    '360': 'Feedback 360°',
    'ad_hoc': 'Pesquisa Específica'
  };
  return labels[tipo] || tipo;
};

// Interface principal
interface HistoricoProps {
  usuario: any;
  permissoes: any;
  onDadosCarregados: (dados: any) => void;
}

export default function Historico({ usuario, permissoes, onDadosCarregados }: HistoricoProps) {
  // Estados principais
  const [pesquisas, setPesquisas] = useState<PesquisaHistorico[]>([]);
  const [totalPesquisas, setTotalPesquisas] = useState(0);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina] = useState(10);
  const [carregando, setCarregando] = useState(true);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    termo: '',
    tipo: 'todos',
    status: 'todos',
    periodo_inicio: '',
    periodo_fim: ''
  });
  
  // Estados de modais
  const [modalExportacao, setModalExportacao] = useState<{
    aberto: boolean;
    pesquisa: PesquisaHistorico | null;
    config: RelatorioExportacao;
    exportando: boolean;
  }>({
    aberto: false,
    pesquisa: null,
    config: {
      tipo: 'pdf',
      incluir_respostas: true,
      incluir_analises: true,
      incluir_comentarios: false,
      anonimizar_dados: true
    },
    exportando: false
  });
  
  const [modalComparativo, setModalComparativo] = useState<{
    aberto: boolean;
    pesquisa1: PesquisaHistorico | null;
    pesquisa2: PesquisaHistorico | null;
    resultado: ComparativoPesquisas | null;
    carregando: boolean;
  }>({
    aberto: false,
    pesquisa1: null,
    pesquisa2: null,
    resultado: null,
    carregando: false
  });
  
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    acao: 'arquivar' | 'restaurar' | null;
    pesquisa: PesquisaHistorico | null;
    processando: boolean;
  }>({
    aberto: false,
    acao: null,
    pesquisa: null,
    processando: false
  });
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Total de páginas
  const totalPaginas = Math.ceil(totalPesquisas / itensPorPagina);
  
  // Verificar filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.termo !== '' || 
           filtros.tipo !== 'todos' || 
           filtros.status !== 'todos' ||
           filtros.periodo_inicio !== '' ||
           filtros.periodo_fim !== '';
  }, [filtros]);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregando(true);
    setErro(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 10000);
    
    try {
      const resultado = await apiMock.listarHistorico(pagina, itensPorPagina, filtros);
      
      if (montadoRef.current) {
        setPesquisas(resultado.pesquisas);
        setTotalPesquisas(resultado.total);
        onDadosCarregados(resultado);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar histórico. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [pagina, itensPorPagina, filtros, onDadosCarregados]);

  // Carregar estatísticas
  const carregarEstatisticas = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoEstatisticas(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoEstatisticas(false);
      }
    }, 8000);
    
    try {
      const stats = await apiMock.obterEstatisticasHistorico();
      
      if (montadoRef.current) {
        setEstatisticas(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoEstatisticas(false);
      }
    }
  }, []);

  // Efeitos para carregar dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  // Handlers de filtros
  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      tipo: 'todos',
      status: 'todos',
      periodo_inicio: '',
      periodo_fim: ''
    });
    setPagina(1);
  }, []);

  // Handler para mudança de página
  const handlePaginaChange = useCallback((novaPagina: number) => {
    setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)));
  }, [totalPaginas]);

  // Handler para exportação
  const handleExportar = useCallback((pesquisa: PesquisaHistorico) => {
    setModalExportacao({
      aberto: true,
      pesquisa,
      config: {
        tipo: 'pdf',
        incluir_respostas: true,
        incluir_analises: true,
        incluir_comentarios: false,
        anonimizar_dados: true
      },
      exportando: false
    });
  }, []);

  // Handler para confirmar exportação
  const handleConfirmarExportacao = useCallback(async () => {
    if (!modalExportacao.pesquisa || !montadoRef.current) return;

    setModalExportacao(prev => ({ ...prev, exportando: true }));

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setModalExportacao(prev => ({ ...prev, exportando: false }));
        toast.error('Tempo excedido na exportação');
      }
    }, 20000);

    try {
      const resultado = await apiMock.exportarRelatorio(
        modalExportacao.pesquisa.id,
        modalExportacao.config
      );

      if (montadoRef.current) {
        // Simular download
        const link = document.createElement('a');
        link.href = resultado.url;
        link.download = `relatorio_${modalExportacao.pesquisa.nome}_${Date.now()}.${modalExportacao.config.tipo}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Relatório exportado com sucesso!');
        setModalExportacao({
          aberto: false,
          pesquisa: null,
          config: {
            tipo: 'pdf',
            incluir_respostas: true,
            incluir_analises: true,
            incluir_comentarios: false,
            anonimizar_dados: true
          },
          exportando: false
        });
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      if (montadoRef.current) {
        toast.error('Falha na exportação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setModalExportacao(prev => ({ ...prev, exportando: false }));
      }
    }
  }, [modalExportacao]);

  // Handler para comparativo
  const handleComparar = useCallback((pesquisa1: PesquisaHistorico, pesquisa2: PesquisaHistorico) => {
    setModalComparativo({
      aberto: true,
      pesquisa1,
      pesquisa2,
      resultado: null,
      carregando: true
    });

    // Executar comparação
    setTimeout(async () => {
      if (!montadoRef.current) return;

      const timeoutId = setTimeout(() => {
        if (montadoRef.current) {
          setModalComparativo(prev => ({ ...prev, carregando: false }));
          toast.error('Tempo excedido na comparação');
        }
      }, 10000);

      try {
        const resultado = await apiMock.compararPesquisas(pesquisa1.id, pesquisa2.id);

        if (montadoRef.current) {
          setModalComparativo(prev => ({
            ...prev,
            resultado,
            carregando: false
          }));
        }
      } catch (error) {
        console.error('Erro na comparação:', error);
        if (montadoRef.current) {
          setModalComparativo(prev => ({ ...prev, carregando: false }));
          toast.error('Falha na comparação');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }, 100);
  }, []);

  // Handler para ações
  const handleAcao = useCallback((acao: 'arquivar' | 'restaurar', pesquisa: PesquisaHistorico) => {
    setModalConfirmacao({
      aberto: true,
      acao,
      pesquisa,
      processando: false
    });
  }, []);

  // Handler para confirmar ação
  const handleConfirmarAcao = useCallback(async () => {
    if (!modalConfirmacao.acao || !modalConfirmacao.pesquisa || !montadoRef.current) return;

    setModalConfirmacao(prev => ({ ...prev, processando: true }));

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setModalConfirmacao(prev => ({ ...prev, processando: false }));
        toast.error('Tempo excedido. Tente novamente.');
      }
    }, 8000);

    try {
      const { acao, pesquisa } = modalConfirmacao;
      
      if (acao === 'arquivar') {
        await apiMock.arquivarPesquisa(pesquisa.id);
        toast.success('Pesquisa arquivada com sucesso');
      } else if (acao === 'restaurar') {
        await apiMock.restaurarPesquisa(pesquisa.id);
        toast.success('Pesquisa restaurada com sucesso');
      }

      if (montadoRef.current) {
        setModalConfirmacao({
          aberto: false,
          acao: null,
          pesquisa: null,
          processando: false
        });
        carregarDados(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro na ação:', error);
      if (montadoRef.current) {
        toast.error('Falha ao executar ação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setModalConfirmacao(prev => ({ ...prev, processando: false }));
      }
    }
  }, [modalConfirmacao, carregarDados]);

  // Retry para erro
  const handleRetry = useCallback(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <div className="space-y-6">
      {/* Estatísticas do Histórico */}
      {estatisticas && !carregandoEstatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Pesquisas</p>
                  <p className="text-2xl font-bold">{formatarNumero(estatisticas.total_pesquisas)}</p>
                  </div>
                <LucideIcons.FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Taxa Média de Resposta</p>
                  <p className="text-2xl font-bold">{formatarPercentual(estatisticas.taxa_resposta_media)}</p>
                </div>
                <LucideIcons.TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">eNPS Médio</p>
                  <p className={`text-2xl font-bold ${obterCorENPS(estatisticas.enps_medio)}`}>
                    {estatisticas.enps_medio}
                  </p>
                </div>
                <LucideIcons.Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Evolução eNPS</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold">
                      {estatisticas.evolucao_enps[estatisticas.evolucao_enps.length - 1]?.valor || 0}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {estatisticas.evolucao_enps[estatisticas.evolucao_enps.length - 1]?.periodo || 'Atual'}
                    </Badge>
                  </div>
                </div>
                <LucideIcons.BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pesquisas</CardTitle>
          <CardDescription>
            Visualize e analise pesquisas finalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar pesquisas..."
                value={filtros.termo}
                onChange={e => handleFiltroChange('termo', e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filtros.tipo}
              onValueChange={valor => handleFiltroChange('tipo', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="pulse">Pulse Survey</SelectItem>
                <SelectItem value="clima">Clima Organizacional</SelectItem>
                <SelectItem value="360">Feedback 360°</SelectItem>
                <SelectItem value="ad_hoc">Pesquisa Específica</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filtros.status}
              onValueChange={valor => handleFiltroChange('status', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="Data início"
              value={filtros.periodo_inicio}
              onChange={e => handleFiltroChange('periodo_inicio', e.target.value)}
            />
            
            <Input
              type="date"
              placeholder="Data fim"
              value={filtros.periodo_fim}
              onChange={e => handleFiltroChange('periodo_fim', e.target.value)}
              min={filtros.periodo_inicio}
            />
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={handleLimparFiltros}
              disabled={!filtrosAplicados || carregando}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estados de UI */}
      {carregando && (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando histórico...</p>
          </div>
        </div>
      )}

      {!carregando && erro && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar histórico</h3>
          <p className="text-gray-700 mb-4">{erro}</p>
          <Button onClick={handleRetry}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {!carregando && !erro && pesquisas.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.Archive className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">
            {filtrosAplicados ? 'Nenhuma pesquisa encontrada' : 'Nenhuma pesquisa no histórico'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhuma pesquisa corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
              : 'Não existem pesquisas finalizadas ainda. Quando uma pesquisa for concluída, ela aparecerá aqui.'
            }
          </p>
          
          {filtrosAplicados && (
            <Button onClick={handleLimparFiltros} variant="outline">
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* Lista de Pesquisas */}
      {!carregando && !erro && pesquisas.length > 0 && (
        <div className="space-y-4">
          {pesquisas.map((pesquisa) => (
            <Card key={pesquisa.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{pesquisa.nome}</h3>
                      <Badge className={obterCorStatus(pesquisa.status)}>
                        {pesquisa.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {obterLabelTipo(pesquisa.tipo)}
                      </Badge>
                      <Badge variant="outline">
                        {pesquisa.categoria}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Período</p>
                        <p className="font-medium text-sm">
                          {formatarDataCurta(pesquisa.data_inicio)} - {formatarDataCurta(pesquisa.data_fim)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Taxa de Resposta</p>
                        <p className={`font-medium ${obterCorTaxaResposta(pesquisa.taxa_resposta)}`}>
                          {formatarPercentual(pesquisa.taxa_resposta)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatarNumero(pesquisa.respostas_recebidas)} de {formatarNumero(pesquisa.publico_alvo)}
                        </p>
                      </div>
                      {pesquisa.enps !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">eNPS</p>
                          <p className={`font-medium ${obterCorENPS(pesquisa.enps)}`}>
                            {pesquisa.enps}
                          </p>
                        </div>
                      )}
                      {pesquisa.score_geral !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Score Geral</p>
                          <p className="font-medium">
                            {formatarScore(pesquisa.score_geral)}/5
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Finalizada em</p>
                        <p className="font-medium text-sm">{formatarDataCurta(pesquisa.data_finalizacao)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Criado por: {pesquisa.criador}</span>
                      {pesquisa.tem_relatorio && (
                        <span className="flex items-center text-green-600">
                          <LucideIcons.FileCheck className="h-4 w-4 mr-1" />
                          Relatório disponível
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {pesquisa.tem_relatorio && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportar(pesquisa)}
                      >
                        <LucideIcons.Download className="h-4 w-4 mr-1" />
                        Exportar
                      </Button>
                    )}
                    
                    {permissoes.podeAnalisar && pesquisas.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const outraPesquisa = pesquisas.find(p => p.id !== pesquisa.id && p.tem_relatorio);
                          if (outraPesquisa) {
                            handleComparar(pesquisa, outraPesquisa);
                          } else {
                            toast.info('Selecione outra pesquisa para comparar');
                          }
                        }}
                      >
                        <LucideIcons.GitCompare className="h-4 w-4 mr-1" />
                        Comparar
                      </Button>
                    )}
                    
                    {permissoes.podeGerenciar && (
                      <>
                        {pesquisa.status === 'finalizada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('arquivar', pesquisa)}
                          >
                            <LucideIcons.Archive className="h-4 w-4 mr-1" />
                            Arquivar
                          </Button>
                        )}
                        
                        {pesquisa.status === 'arquivada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('restaurar', pesquisa)}
                          >
                            <LucideIcons.ArchiveRestore className="h-4 w-4 mr-1" />
                            Restaurar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {!carregando && !erro && pesquisas.length > 0 && totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {pesquisas.length} de {formatarNumero(totalPesquisas)} pesquisas
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePaginaChange(pagina - 1)}
              disabled={pagina <= 1}
            >
              <LucideIcons.ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPaginas })
              .map((_, i) => i + 1)
              .filter((numeroPagina) => {
                return numeroPagina === 1 || 
                      numeroPagina === totalPaginas || 
                      Math.abs(numeroPagina - pagina) <= 1;
              })
              .map((numeroPagina, index, paginasFiltradas) => (
                <Fragment key={numeroPagina}>
                  {index > 0 && paginasFiltradas[index-1] !== numeroPagina - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <Button
                    variant={pagina === numeroPagina ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePaginaChange(numeroPagina)}
                  >
                    {numeroPagina}
                  </Button>
                </Fragment>
              ))
            }
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePaginaChange(pagina + 1)}
              disabled={pagina >= totalPaginas}
            >
              <LucideIcons.ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      <Dialog open={modalExportacao.aberto} onOpenChange={(open) => {
        if (!open && !modalExportacao.exportando) {
          setModalExportacao(prev => ({ ...prev, aberto: false }));
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
          </DialogHeader>
          
          {modalExportacao.pesquisa && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{modalExportacao.pesquisa.nome}</p>
                <p className="text-sm text-gray-500">
                  {formatarDataCurta(modalExportacao.pesquisa.data_inicio)} - {formatarDataCurta(modalExportacao.pesquisa.data_fim)}
                </p>
              </div>
              
              <div>
                <Label>Formato do Arquivo</Label>
                <Select
                  value={modalExportacao.config.tipo}
                  onValueChange={valor => setModalExportacao(prev => ({
                    ...prev,
                    config: { ...prev.config, tipo: valor as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Incluir no Relatório</Label>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="incluir_respostas"
                    checked={modalExportacao.config.incluir_respostas}
                    onChange={e => setModalExportacao(prev => ({
                      ...prev,
                      config: { ...prev.config, incluir_respostas: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="incluir_respostas">Respostas individuais</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="incluir_analises"
                    checked={modalExportacao.config.incluir_analises}
                    onChange={e => setModalExportacao(prev => ({
                      ...prev,
                      config: { ...prev.config, incluir_analises: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="incluir_analises">Análises e métricas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="incluir_comentarios"
                    checked={modalExportacao.config.incluir_comentarios}
                    onChange={e => setModalExportacao(prev => ({
                      ...prev,
                      config: { ...prev.config, incluir_comentarios: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="incluir_comentarios">Comentários em texto livre</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonimizar_dados"
                    checked={modalExportacao.config.anonimizar_dados}
                    onChange={e => setModalExportacao(prev => ({
                      ...prev,
                      config: { ...prev.config, anonimizar_dados: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="anonimizar_dados">Anonimizar dados pessoais</Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalExportacao(prev => ({ ...prev, aberto: false }))}
              disabled={modalExportacao.exportando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarExportacao}
              disabled={modalExportacao.exportando}
            >
              {modalExportacao.exportando ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <LucideIcons.Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Comparativo */}
      <Dialog open={modalComparativo.aberto} onOpenChange={(open) => {
        if (!open) {
          setModalComparativo({
            aberto: false,
            pesquisa1: null,
            pesquisa2: null,
            resultado: null,
            carregando: false
          });
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comparativo de Pesquisas</DialogTitle>
          </DialogHeader>
          
          {modalComparativo.carregando && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {!modalComparativo.carregando && modalComparativo.resultado && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{modalComparativo.resultado.pesquisa_base.nome}</CardTitle>
                    <CardDescription>Base de comparação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Taxa de Resposta:</span>
                        <span className="font-medium">
                          {formatarPercentual(modalComparativo.resultado.pesquisa_base.taxa_resposta)}
                        </span>
                      </div>
                      {modalComparativo.resultado.pesquisa_base.enps !== undefined && (
                        <div className="flex justify-between">
                          <span>eNPS:</span>
                          <span className="font-medium">
                            {modalComparativo.resultado.pesquisa_base.enps}
                          </span>
                        </div>
                      )}
                      {modalComparativo.resultado.pesquisa_base.score_geral !== undefined && (
                        <div className="flex justify-between">
                          <span>Score Geral:</span>
                          <span className="font-medium">
                            {formatarScore(modalComparativo.resultado.pesquisa_base.score_geral)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{modalComparativo.resultado.pesquisa_comparacao.nome}</CardTitle>
                    <CardDescription>Pesquisa comparada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Taxa de Resposta:</span>
                        <span className="font-medium">
                          {formatarPercentual(modalComparativo.resultado.pesquisa_comparacao.taxa_resposta)}
                        </span>
                      </div>
                      {modalComparativo.resultado.pesquisa_comparacao.enps !== undefined && (
                        <div className="flex justify-between">
                          <span>eNPS:</span>
                          <span className="font-medium">
                            {modalComparativo.resultado.pesquisa_comparacao.enps}
                          </span>
                        </div>
                      )}
                      {modalComparativo.resultado.pesquisa_comparacao.score_geral !== undefined && (
                        <div className="flex justify-between">
                          <span>Score Geral:</span>
                          <span className="font-medium">
                            {formatarScore(modalComparativo.resultado.pesquisa_comparacao.score_geral)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Variações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Resposta</p>
                      <p className={`text-lg font-bold ${
                        modalComparativo.resultado.metricas.variacao_taxa_resposta > 0 
                          ? 'text-green-600' 
                          : modalComparativo.resultado.metricas.variacao_taxa_resposta < 0 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }`}>
                        {modalComparativo.resultado.metricas.variacao_taxa_resposta > 0 ? '+' : ''}
                        {formatarPercentual(Math.abs(modalComparativo.resultado.metricas.variacao_taxa_resposta))}
                      </p>
                    </div>
                    
                    {modalComparativo.resultado.metricas.variacao_enps !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500">eNPS</p>
                        <p className={`text-lg font-bold ${
                          modalComparativo.resultado.metricas.variacao_enps > 0 
                            ? 'text-green-600' 
                            : modalComparativo.resultado.metricas.variacao_enps < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {modalComparativo.resultado.metricas.variacao_enps > 0 ? '+' : ''}
                          {modalComparativo.resultado.metricas.variacao_enps}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">Score Geral</p>
                      <p className={`text-lg font-bold ${
                        modalComparativo.resultado.metricas.variacao_score_geral > 0 
                          ? 'text-green-600' 
                          : modalComparativo.resultado.metricas.variacao_score_geral < 0 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }`}>
                        {modalComparativo.resultado.metricas.variacao_score_geral > 0 ? '+' : ''}
                        {modalComparativo.resultado.metricas.variacao_score_geral.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 rounded bg-gray-50">
                    <p className="font-medium">Tendência Geral:</p>
                    <Badge 
                      className={
                        modalComparativo.resultado.metricas.tendencia === 'melhora' 
                          ? 'bg-green-100 text-green-800'
                          : modalComparativo.resultado.metricas.tendencia === 'piora'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {modalComparativo.resultado.metricas.tendencia === 'melhora' ? 'Melhora' : 
                       modalComparativo.resultado.metricas.tendencia === 'piora' ? 'Piora' : 'Estável'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={modalConfirmacao.aberto} onOpenChange={(open) => {
        if (!open && !modalConfirmacao.processando) {
          setModalConfirmacao({
            aberto: false,
            acao: null,
            pesquisa: null,
            processando: false
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalConfirmacao.acao === 'arquivar' && 'Arquivar Pesquisa'}
              {modalConfirmacao.acao === 'restaurar' && 'Restaurar Pesquisa'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              {modalConfirmacao.acao === 'arquivar' && 
                'Tem certeza que deseja arquivar esta pesquisa? Ela continuará visível no histórico, mas será marcada como arquivada.'}
              {modalConfirmacao.acao === 'restaurar' && 
                'Tem certeza que deseja restaurar esta pesquisa? Ela voltará ao status finalizada.'}
            </p>
            
            {modalConfirmacao.pesquisa && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="font-medium">{modalConfirmacao.pesquisa.nome}</p>
                <p className="text-sm text-gray-500">
                  Taxa: {formatarPercentual(modalConfirmacao.pesquisa.taxa_resposta)} | 
                  Finalizada em: {formatarDataCurta(modalConfirmacao.pesquisa.data_finalizacao)}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalConfirmacao(prev => ({ ...prev, aberto: false }))}
              disabled={modalConfirmacao.processando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAcao}
              disabled={modalConfirmacao.processando}
            >
              {modalConfirmacao.processando ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}