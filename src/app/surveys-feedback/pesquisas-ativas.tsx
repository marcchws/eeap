'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

// Tipos
interface PesquisaAtiva {
  id: string;
  nome: string;
  tipo: 'pulse' | 'clima' | '360' | 'ad_hoc';
  status: 'ativa' | 'pausada' | 'finalizando';
  data_inicio: string;
  data_fim: string;
  publico_alvo: number;
  respostas_recebidas: number;
  taxa_resposta: number;
  criador: string;
  categoria: string;
  ultima_atualizacao: string;
}

interface DetalhePesquisa {
  pesquisa: PesquisaAtiva;
  perguntas: Array<{
    id: string;
    texto: string;
    tipo: string;
    respostas: number;
  }>;
  estatisticas: {
    tempo_medio_resposta: number;
    taxa_abandono: number;
    satisfacao_processo: number;
  };
}

// API Mock
const apiMock = {
  listarPesquisasAtivas: async (pagina: number, itensPorPagina: number, filtros: any): Promise<{
    pesquisas: PesquisaAtiva[];
    total: number;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const todasPesquisas: PesquisaAtiva[] = [
      {
        id: 'pesq_001',
        nome: 'Pulse Survey Q1 2025',
        tipo: 'pulse',
        status: 'ativa',
        data_inicio: '2025-01-15T09:00:00Z',
        data_fim: '2025-01-22T18:00:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2164,
        taxa_resposta: 76,
        criador: 'Ana Silva',
        categoria: 'Engajamento',
        ultima_atualizacao: '2025-01-20T14:30:00Z'
      },
      {
        id: 'pesq_002',
        nome: 'Avaliação de Clima - Tecnologia',
        tipo: 'clima',
        status: 'ativa',
        data_inicio: '2025-01-10T09:00:00Z',
        data_fim: '2025-01-25T18:00:00Z',
        publico_alvo: 487,
        respostas_recebidas: 392,
        taxa_resposta: 80,
        criador: 'Carlos Mendes',
        categoria: 'Clima Organizacional',
        ultima_atualizacao: '2025-01-20T16:45:00Z'
      },
      {
        id: 'pesq_003',
        nome: 'Feedback 360° - Lideranças',
        tipo: '360',
        status: 'pausada',
        data_inicio: '2025-01-12T09:00:00Z',
        data_fim: '2025-01-30T18:00:00Z',
        publico_alvo: 156,
        respostas_recebidas: 89,
        taxa_resposta: 57,
        criador: 'Mariana Costa',
        categoria: 'Desenvolvimento',
        ultima_atualizacao: '2025-01-19T11:20:00Z'
      }
    ];

    // Aplicar filtros
    let pesquisasFiltradas = todasPesquisas;
    
    if (filtros.termo) {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => 
        p.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        p.criador.toLowerCase().includes(filtros.termo.toLowerCase())
      );
    }
    
    if (filtros.tipo !== 'todos') {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => p.tipo === filtros.tipo);
    }
    
    if (filtros.status !== 'todos') {
      pesquisasFiltradas = pesquisasFiltradas.filter(p => p.status === filtros.status);
    }

    // Simular paginação
    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pesquisasPaginadas = pesquisasFiltradas.slice(inicio, fim);

    return {
      pesquisas: pesquisasPaginadas,
      total: pesquisasFiltradas.length
    };
  },

  obterDetalhePesquisa: async (id: string): Promise<DetalhePesquisa> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      pesquisa: {
        id: id,
        nome: 'Pulse Survey Q1 2025',
        tipo: 'pulse',
        status: 'ativa',
        data_inicio: '2025-01-15T09:00:00Z',
        data_fim: '2025-01-22T18:00:00Z',
        publico_alvo: 2847,
        respostas_recebidas: 2164,
        taxa_resposta: 76,
        criador: 'Ana Silva',
        categoria: 'Engajamento',
        ultima_atualizacao: '2025-01-20T14:30:00Z'
      },
      perguntas: [
        {
          id: 'perg_001',
          texto: 'Como você avalia sua satisfação geral com a empresa?',
          tipo: 'escala_likert',
          respostas: 2164
        },
        {
          id: 'perg_002', 
          texto: 'Você recomendaria nossa empresa como um bom lugar para trabalhar?',
          tipo: 'nps',
          respostas: 2164
        },
        {
          id: 'perg_003',
          texto: 'Como você avalia a comunicação da sua liderança?',
          tipo: 'escala_likert',
          respostas: 2089
        }
      ],
      estatisticas: {
        tempo_medio_resposta: 4.2,
        taxa_abandono: 3.5,
        satisfacao_processo: 4.1
      }
    };
  },

  pausarPesquisa: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  retomarPesquisa: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  finalizarPesquisa: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
};

// Funções utilitárias defensivas
const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

const obterCorStatus = (status: string): string => {
  switch (status) {
    case 'ativa': return 'bg-green-100 text-green-800';
    case 'pausada': return 'bg-yellow-100 text-yellow-800';
    case 'finalizando': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const obterCorTaxaResposta = (taxa: number): string => {
  if (taxa >= 80) return 'text-green-600';
  if (taxa >= 60) return 'text-yellow-600';
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
interface PesquisasAtivasProps {
  usuario: any;
  permissoes: any;
  onDadosCarregados: (dados: any) => void;
}

export default function PesquisasAtivas({ usuario, permissoes, onDadosCarregados }: PesquisasAtivasProps) {
  // Estados principais
  const [pesquisas, setPesquisas] = useState<PesquisaAtiva[]>([]);
  const [totalPesquisas, setTotalPesquisas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina] = useState(10);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    termo: '',
    tipo: 'todos',
    status: 'todos'
  });
  
  // Estados de modais
  const [modalDetalhe, setModalDetalhe] = useState<{
    aberto: boolean;
    pesquisaId: string | null;
    dados: DetalhePesquisa | null;
    carregando: boolean;
  }>({
    aberto: false,
    pesquisaId: null,
    dados: null,
    carregando: false
  });
  
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    acao: 'pausar' | 'retomar' | 'finalizar' | null;
    pesquisa: PesquisaAtiva | null;
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
           filtros.status !== 'todos';
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
      const resultado = await apiMock.listarPesquisasAtivas(pagina, itensPorPagina, filtros);
      
      if (montadoRef.current) {
        setPesquisas(resultado.pesquisas);
        setTotalPesquisas(resultado.total);
        onDadosCarregados(resultado);
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar pesquisas. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [pagina, itensPorPagina, filtros, onDadosCarregados]);

  // Efeito para carregar dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Handlers de filtros
  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      tipo: 'todos',
      status: 'todos'
    });
    setPagina(1);
  }, []);

  // Handler para mudança de página
  const handlePaginaChange = useCallback((novaPagina: number) => {
    setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)));
  }, [totalPaginas]);

  // Handler para ver detalhes
  const handleVerDetalhes = useCallback(async (pesquisaId: string) => {
    setModalDetalhe({
      aberto: true,
      pesquisaId,
      dados: null,
      carregando: true
    });

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setModalDetalhe(prev => ({
          ...prev,
          carregando: false
        }));
        toast.error('Tempo excedido ao carregar detalhes');
      }
    }, 5000);

    try {
      const detalhes = await apiMock.obterDetalhePesquisa(pesquisaId);
      
      if (montadoRef.current) {
        setModalDetalhe(prev => ({
          ...prev,
          dados: detalhes,
          carregando: false
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      if (montadoRef.current) {
        setModalDetalhe(prev => ({
          ...prev,
          carregando: false
        }));
        toast.error('Falha ao carregar detalhes da pesquisa');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // Handler para ações
  const handleAcao = useCallback((acao: 'pausar' | 'retomar' | 'finalizar', pesquisa: PesquisaAtiva) => {
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
      
      switch (acao) {
        case 'pausar':
          await apiMock.pausarPesquisa(pesquisa.id);
          toast.success('Pesquisa pausada com sucesso');
          break;
        case 'retomar':
          await apiMock.retomarPesquisa(pesquisa.id);
          toast.success('Pesquisa retomada com sucesso');
          break;
        case 'finalizar':
          await apiMock.finalizarPesquisa(pesquisa.id);
          toast.success('Pesquisa finalizada com sucesso');
          break;
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
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisas Ativas</CardTitle>
          <CardDescription>
            Gerencie e monitore pesquisas em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
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
              <SelectTrigger className="w-[200px]">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="finalizando">Finalizando</SelectItem>
              </SelectContent>
            </Select>
            
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
            <p className="text-gray-500">Carregando pesquisas...</p>
          </div>
        </div>
      )}

      {!carregando && erro && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar pesquisas</h3>
          <p className="text-gray-700 mb-4">{erro}</p>
          <Button onClick={handleRetry}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {!carregando && !erro && pesquisas.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.FileText className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">
            {filtrosAplicados ? 'Nenhuma pesquisa encontrada' : 'Nenhuma pesquisa ativa'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhuma pesquisa corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
              : 'Não existem pesquisas ativas no momento. Crie uma nova pesquisa para começar.'
            }
          </p>
          
          {filtrosAplicados ? (
            <Button onClick={handleLimparFiltros} variant="outline">
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          ) : permissoes.podeCrear && (
            <Button onClick={() => toast.info('Acesse a aba "Criar Pesquisa"')}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Criar Nova Pesquisa
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
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Público-alvo</p>
                        <p className="font-medium">{formatarNumero(pesquisa.publico_alvo)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Respostas</p>
                        <p className="font-medium">{formatarNumero(pesquisa.respostas_recebidas)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Taxa de Resposta</p>
                        <p className={`font-medium ${obterCorTaxaResposta(pesquisa.taxa_resposta)}`}>
                          {formatarPercentual(pesquisa.taxa_resposta)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Término</p>
                        <p className="font-medium">{formatarData(pesquisa.data_fim)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso</span>
                        <span>{formatarPercentual(pesquisa.taxa_resposta)}</span>
                      </div>
                      <Progress value={pesquisa.taxa_resposta} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Criado por: {pesquisa.criador}</span>
                      <span>Última atualização: {formatarData(pesquisa.ultima_atualizacao)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerDetalhes(pesquisa.id)}
                    >
                      <LucideIcons.Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    
                    {permissoes.podeGerenciar && (
                      <>
                        {pesquisa.status === 'ativa' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('pausar', pesquisa)}
                          >
                            <LucideIcons.Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        
                        {pesquisa.status === 'pausada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('retomar', pesquisa)}
                          >
                            <LucideIcons.Play className="h-4 w-4 mr-1" />
                            Retomar
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcao('finalizar', pesquisa)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <LucideIcons.Square className="h-4 w-4 mr-1" />
                          Finalizar
                        </Button>
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

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhe.aberto} onOpenChange={(open) => {
        if (!open) {
          setModalDetalhe({
            aberto: false,
            pesquisaId: null,
            dados: null,
            carregando: false
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Pesquisa</DialogTitle>
          </DialogHeader>
          
          {modalDetalhe.carregando && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {!modalDetalhe.carregando && modalDetalhe.dados && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-lg">{modalDetalhe.dados.pesquisa.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-lg">{obterLabelTipo(modalDetalhe.dados.pesquisa.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Taxa de Resposta</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatarPercentual(modalDetalhe.dados.pesquisa.taxa_resposta)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Público-alvo</p>
                  <p className="text-lg">{formatarNumero(modalDetalhe.dados.pesquisa.publico_alvo)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Perguntas ({modalDetalhe.dados.perguntas.length})</h4>
                <div className="space-y-3">
                  {modalDetalhe.dados.perguntas.map((pergunta, index) => (
                    <div key={pergunta.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">#{index + 1} - {pergunta.texto}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Tipo: {pergunta.tipo} | Respostas: {formatarNumero(pergunta.respostas)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Estatísticas</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border rounded p-3">
                    <p className="text-2xl font-bold text-blue-600">
                      {modalDetalhe.dados.estatisticas.tempo_medio_resposta.toFixed(1)}min
                    </p>
                    <p className="text-sm text-gray-500">Tempo Médio</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatarPercentual(modalDetalhe.dados.estatisticas.taxa_abandono)}
                    </p>
                    <p className="text-sm text-gray-500">Taxa de Abandono</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-2xl font-bold text-green-600">
                      {modalDetalhe.dados.estatisticas.satisfacao_processo.toFixed(1)}/5
                    </p>
                    <p className="text-sm text-gray-500">Satisfação</p>
                  </div>
                </div>
              </div>
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
              {modalConfirmacao.acao === 'pausar' && 'Pausar Pesquisa'}
              {modalConfirmacao.acao === 'retomar' && 'Retomar Pesquisa'}
              {modalConfirmacao.acao === 'finalizar' && 'Finalizar Pesquisa'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              {modalConfirmacao.acao === 'pausar' && 
                'Tem certeza que deseja pausar esta pesquisa? Os colaboradores não poderão mais responder até que seja retomada.'}
              {modalConfirmacao.acao === 'retomar' && 
                'Tem certeza que deseja retomar esta pesquisa? Os colaboradores voltarão a receber convites para responder.'}
              {modalConfirmacao.acao === 'finalizar' && 
                'Tem certeza que deseja finalizar esta pesquisa? Esta ação não pode ser desfeita e a pesquisa será movida para o histórico.'}
            </p>
            
            {modalConfirmacao.pesquisa && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="font-medium">{modalConfirmacao.pesquisa.nome}</p>
                <p className="text-sm text-gray-500">
                  Taxa atual: {formatarPercentual(modalConfirmacao.pesquisa.taxa_resposta)} 
                  ({formatarNumero(modalConfirmacao.pesquisa.respostas_recebidas)} de {formatarNumero(modalConfirmacao.pesquisa.publico_alvo)})
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
              variant={modalConfirmacao.acao === 'finalizar' ? 'destructive' : 'default'}
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