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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Tipos específicos de fricções
interface PontoFriccao {
  id: string;
  colaborador_id: string;
  tipo: 'processo' | 'relacionamento' | 'recurso' | 'desenvolvimento' | 'comunicacao';
  data_identificacao: string;
  data_resolucao?: string;
  titulo: string;
  descricao: string;
  causa_raiz?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  status_resolucao: 'identificada' | 'em_analise' | 'em_resolucao' | 'resolvida' | 'nao_resolvida';
  departamento_responsavel: string;
  responsavel_resolucao?: string;
  acoes_tomadas?: string;
  feedback_pos_resolucao?: string;
  score_satisfacao_antes: number;
  score_satisfacao_depois?: number;
  evento_relacionado?: string;
}

interface FiltrosFriccoes {
  status: string;
  severidade: string;
  tipo: string;
  periodo_meses: string;
}

interface FriccoesSectionProps {
  colaboradorSelecionado: any;
  filtrosGlobais: any;
}

// API Mock para fricções
const apiMockFriccoes = {
  obterFriccoes: async (colaboradorId: string, filtros: FiltrosFriccoes) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!colaboradorId) {
      return [];
    }

    const friccoes: PontoFriccao[] = [
      {
        id: '1',
        colaborador_id: colaboradorId,
        tipo: 'processo',
        data_identificacao: '2023-05-15',
        data_resolucao: '2023-05-30',
        titulo: 'Demora no processo de aprovação de férias',
        descricao: 'Colaboradora relatou dificuldades para conseguir aprovação de férias com antecedência adequada',
        causa_raiz: 'Processo manual dependente de múltiplas aprovações',
        severidade: 'media',
        status_resolucao: 'resolvida',
        departamento_responsavel: 'Recursos Humanos',
        responsavel_resolucao: 'Maria Santos',
        acoes_tomadas: 'Implementado sistema digital de solicitação de férias com aprovação automática para casos padrão',
        feedback_pos_resolucao: 'Colaboradora satisfeita com a melhoria do processo',
        score_satisfacao_antes: 75,
        score_satisfacao_depois: 85,
        evento_relacionado: 'Solicitação de férias negada'
      },
      {
        id: '2',
        colaborador_id: colaboradorId,
        tipo: 'relacionamento',
        data_identificacao: '2023-08-20',
        data_resolucao: '2023-09-10',
        titulo: 'Conflito com colega de equipe',
        descricao: 'Tensão interpessoal impactando ambiente de trabalho e produtividade da equipe',
        causa_raiz: 'Diferenças de opinião sobre metodologia de trabalho não mediadas',
        severidade: 'alta',
        status_resolucao: 'resolvida',
        departamento_responsavel: 'Recursos Humanos',
        responsavel_resolucao: 'João Silva',
        acoes_tomadas: 'Sessões de mediação e alinhamento de expectativas entre as partes',
        feedback_pos_resolucao: 'Ambiente de trabalho melhorou significativamente',
        score_satisfacao_antes: 65,
        score_satisfacao_depois: 80,
        evento_relacionado: 'Mudança de gestor'
      },
      {
        id: '3',
        colaborador_id: colaboradorId,
        tipo: 'recurso',
        data_identificacao: '2024-02-10',
        titulo: 'Equipamento de trabalho inadequado',
        descricao: 'Computador lento impactando produtividade e causando frustração',
        causa_raiz: 'Hardware desatualizado para as demandas atuais do cargo',
        severidade: 'media',
        status_resolucao: 'em_resolucao',
        departamento_responsavel: 'Tecnologia',
        responsavel_resolucao: 'Carlos Eduardo',
        acoes_tomadas: 'Solicitação aprovada para upgrade do equipamento',
        score_satisfacao_antes: 78,
        evento_relacionado: 'Promoção para Senior'
      },
      {
        id: '4',
        colaborador_id: colaboradorId,
        tipo: 'desenvolvimento',
        data_identificacao: '2024-06-05',
        titulo: 'Falta de oportunidades de crescimento',
        descricao: 'Colaboradora sente que não há perspectivas claras de desenvolvimento na atual posição',
        severidade: 'alta',
        status_resolucao: 'em_analise',
        departamento_responsavel: 'Recursos Humanos',
        score_satisfacao_antes: 70,
        evento_relacionado: 'Aniversário de 2 anos na empresa'
      },
      {
        id: '5',
        colaborador_id: colaboradorId,
        tipo: 'comunicacao',
        data_identificacao: '2024-09-15',
        titulo: 'Falta de feedback regular do gestor',
        descricao: 'Ausência de reuniões 1:1 regulares e feedback sobre performance',
        severidade: 'media',
        status_resolucao: 'identificada',
        departamento_responsavel: 'Recursos Humanos',
        score_satisfacao_antes: 72,
        evento_relacionado: 'Avaliação anual'
      }
    ];

    // Aplicar filtros
    let friccoesFiltradas = friccoes;

    if (filtros.status !== 'todos') {
      friccoesFiltradas = friccoesFiltradas.filter(f => f.status_resolucao === filtros.status);
    }

    if (filtros.severidade !== 'todos') {
      friccoesFiltradas = friccoesFiltradas.filter(f => f.severidade === filtros.severidade);
    }

    if (filtros.tipo !== 'todos') {
      friccoesFiltradas = friccoesFiltradas.filter(f => f.tipo === filtros.tipo);
    }

    if (filtros.periodo_meses !== 'todos') {
      const mesesAtras = parseInt(filtros.periodo_meses);
      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - mesesAtras);
      
      friccoesFiltradas = friccoesFiltradas.filter(f => new Date(f.data_identificacao) >= dataLimite);
    }

    return friccoesFiltradas.sort((a, b) => new Date(b.data_identificacao).getTime() - new Date(a.data_identificacao).getTime());
  },

  resolverFriccao: async (friccaoId: string, dadosResolucao: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Simulação de resolução
    return { sucesso: true };
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

const getCorSeveridade = (severidade: string) => {
  switch (severidade) {
    case 'baixa': return 'bg-green-100 text-green-800 border-green-300';
    case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'alta': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critica': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCorStatus = (status: string) => {
  switch (status) {
    case 'identificada': return 'bg-blue-100 text-blue-800';
    case 'em_analise': return 'bg-yellow-100 text-yellow-800';
    case 'em_resolucao': return 'bg-orange-100 text-orange-800';
    case 'resolvida': return 'bg-green-100 text-green-800';
    case 'nao_resolvida': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getIconeTipo = (tipo: string) => {
  switch (tipo) {
    case 'processo': return LucideIcons.Workflow;
    case 'relacionamento': return LucideIcons.Users;
    case 'recurso': return LucideIcons.Package;
    case 'desenvolvimento': return LucideIcons.TrendingUp;
    case 'comunicacao': return LucideIcons.MessageSquare;
    default: return LucideIcons.AlertTriangle;
  }
};

const getTituloTipo = (tipo: string) => {
  switch (tipo) {
    case 'processo': return 'Processo';
    case 'relacionamento': return 'Relacionamento';
    case 'recurso': return 'Recurso';
    case 'desenvolvimento': return 'Desenvolvimento';
    case 'comunicacao': return 'Comunicação';
    default: return 'Outros';
  }
};

const getTituloStatus = (status: string) => {
  switch (status) {
    case 'identificada': return 'Identificada';
    case 'em_analise': return 'Em Análise';
    case 'em_resolucao': return 'Em Resolução';
    case 'resolvida': return 'Resolvida';
    case 'nao_resolvida': return 'Não Resolvida';
    default: return 'Desconhecido';
  }
};

const getTituloSeveridade = (severidade: string) => {
  switch (severidade) {
    case 'baixa': return 'Baixa';
    case 'media': return 'Média';
    case 'alta': return 'Alta';
    case 'critica': return 'Crítica';
    default: return 'Desconhecida';
  }
};

export default function FriccoesSection({ colaboradorSelecionado, filtrosGlobais }: FriccoesSectionProps) {
  // Estados das fricções
  const [friccoes, setFriccoes] = useState<PontoFriccao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros específicos das fricções
  const [filtros, setFiltros] = useState<FiltrosFriccoes>({
    status: 'todos',
    severidade: 'todos',
    tipo: 'todos',
    periodo_meses: 'todos'
  });

  // Modal de detalhes e resolução
  const [friccaoSelecionada, setFriccaoSelecionada] = useState<PontoFriccao | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarResolucao, setMostrarResolucao] = useState(false);
  const [dadosResolucao, setDadosResolucao] = useState({
    acoes_tomadas: '',
    feedback_pos_resolucao: '',
    score_satisfacao_depois: 0
  });
  const [salvandoResolucao, setSalvandoResolucao] = useState(false);

  // Ref para controle de montagem
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar fricções quando colaborador ou filtros mudam
  useEffect(() => {
    if (colaboradorSelecionado?.id) {
      carregarFriccoes();
    } else {
      setFriccoes([]);
      setErro(null);
    }
  }, [colaboradorSelecionado, filtros]);

  // Carregar fricções
  const carregarFriccoes = useCallback(async () => {
    if (!montadoRef.current || !colaboradorSelecionado?.id) return;
    
    setCarregando(true);
    setErro(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      const friccoesData = await apiMockFriccoes.obterFriccoes(colaboradorSelecionado.id, filtros);
      if (montadoRef.current) {
        setFriccoes(friccoesData);
      }
    } catch (error) {
      console.error('Erro ao carregar fricções:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar fricções. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [colaboradorSelecionado, filtros]);

  // Alterar filtro
  const handleFiltroChange = useCallback((campo: keyof FiltrosFriccoes, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Limpar filtros
  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      status: 'todos',
      severidade: 'todos',
      tipo: 'todos',
      periodo_meses: 'todos'
    });
  }, []);

  // Abrir detalhes da fricção
  const handleAbrirDetalhes = useCallback((friccao: PontoFriccao) => {
    setFriccaoSelecionada(friccao);
    setMostrarDetalhes(true);
  }, []);

  // Abrir modal de resolução
  const handleAbrirResolucao = useCallback((friccao: PontoFriccao) => {
    setFriccaoSelecionada(friccao);
    setDadosResolucao({
      acoes_tomadas: friccao.acoes_tomadas || '',
      feedback_pos_resolucao: friccao.feedback_pos_resolucao || '',
      score_satisfacao_depois: friccao.score_satisfacao_depois || friccao.score_satisfacao_antes
    });
    setMostrarResolucao(true);
  }, []);

  // Salvar resolução
  const handleSalvarResolucao = useCallback(async () => {
    if (!montadoRef.current || !friccaoSelecionada) return;
    
    setSalvandoResolucao(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvandoResolucao(false);
        toast.error('Tempo excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      await apiMockFriccoes.resolverFriccao(friccaoSelecionada.id, dadosResolucao);
      if (montadoRef.current) {
        toast.success('Resolução registrada com sucesso');
        setMostrarResolucao(false);
        carregarFriccoes(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao salvar resolução:', error);
      if (montadoRef.current) {
        toast.error('Falha ao salvar resolução. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvandoResolucao(false);
      }
    }
  }, [friccaoSelecionada, dadosResolucao, carregarFriccoes]);

  // Filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.status !== 'todos' || 
           filtros.severidade !== 'todos' || 
           filtros.tipo !== 'todos' || 
           filtros.periodo_meses !== 'todos';
  }, [filtros]);

  // Estatísticas das fricções
  const estatisticas = useMemo(() => {
    return {
      total: friccoes.length,
      resolvidas: friccoes.filter(f => f.status_resolucao === 'resolvida').length,
      em_resolucao: friccoes.filter(f => f.status_resolucao === 'em_resolucao').length,
      pendentes: friccoes.filter(f => ['identificada', 'em_analise'].includes(f.status_resolucao)).length,
      criticas: friccoes.filter(f => f.severidade === 'critica').length
    };
  }, [friccoes]);

  return (
    <div className="space-y-6">
      {/* Filtros das Fricções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LucideIcons.Filter className="mr-2 h-5 w-5" />
            Filtros de Fricções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filtros.status}
                onValueChange={valor => handleFiltroChange('status', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="identificada">Identificada</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_resolucao">Em Resolução</SelectItem>
                  <SelectItem value="resolvida">Resolvida</SelectItem>
                  <SelectItem value="nao_resolvida">Não Resolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select
                value={filtros.severidade}
                onValueChange={valor => handleFiltroChange('severidade', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filtros.tipo}
                onValueChange={valor => handleFiltroChange('tipo', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="processo">Processo</SelectItem>
                  <SelectItem value="relacionamento">Relacionamento</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
<SelectItem value="comunicacao">Comunicação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={filtros.periodo_meses}
                onValueChange={valor => handleFiltroChange('periodo_meses', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo o Período</SelectItem>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                disabled={!filtrosAplicados}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {!carregando && !erro && friccoes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <p className="text-xs text-muted-foreground">Total de Fricções</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{estatisticas.resolvidas}</div>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{estatisticas.em_resolucao}</div>
              <p className="text-xs text-muted-foreground">Em Resolução</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{estatisticas.criticas}</div>
              <p className="text-xs text-muted-foreground">Críticas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estados de Interface */}
      {!colaboradorSelecionado && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um colaborador</h3>
            <p className="text-gray-500">
              Para visualizar as fricções identificadas, primeiro selecione um colaborador usando os filtros globais acima.
            </p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && carregando && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Carregando fricções</h3>
            <p className="text-gray-500">Buscando pontos de fricção identificados...</p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && erro && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar fricções</h3>
            <p className="text-gray-500 mb-4">{erro}</p>
            <Button onClick={carregarFriccoes}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && !erro && friccoes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma fricção encontrada</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {filtrosAplicados 
                ? 'Nenhuma fricção corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                : 'Excelente! Não há fricções identificadas para este colaborador no período.'
              }
            </p>
            {filtrosAplicados && (
              <Button variant="outline" onClick={handleLimparFiltros}>
                <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Fricções */}
      {!carregando && !erro && friccoes.length > 0 && (
        <div className="space-y-4">
          {friccoes.map((friccao) => {
            const IconeTipo = getIconeTipo(friccao.tipo);
            
            return (
              <Card key={friccao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${getCorSeveridade(friccao.severidade)}`}>
                          <IconeTipo className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{friccao.titulo}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getTituloTipo(friccao.tipo)}
                            </Badge>
                            <Badge className={`text-xs ${getCorStatus(friccao.status_resolucao)}`}>
                              {getTituloStatus(friccao.status_resolucao)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatarData(friccao.data_identificacao)}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getCorSeveridade(friccao.severidade)}`}>
                          {getTituloSeveridade(friccao.severidade)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{friccao.descricao}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <LucideIcons.Building2 className="mr-1 h-3 w-3" />
                          {friccao.departamento_responsavel}
                        </span>
                        {friccao.responsavel_resolucao && (
                          <span className="flex items-center">
                            <LucideIcons.User className="mr-1 h-3 w-3" />
                            {friccao.responsavel_resolucao}
                          </span>
                        )}
                        <span className="flex items-center">
                          <LucideIcons.TrendingDown className="mr-1 h-3 w-3" />
                          Score: {friccao.score_satisfacao_antes}% 
                          {friccao.score_satisfacao_depois && 
                            ` → ${friccao.score_satisfacao_depois}%`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirDetalhes(friccao)}
                      >
                        <LucideIcons.Eye className="h-4 w-4" />
                      </Button>
                      {['identificada', 'em_analise', 'em_resolucao'].includes(friccao.status_resolucao) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAbrirResolucao(friccao)}
                        >
                          <LucideIcons.Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Fricção */}
      <Dialog open={mostrarDetalhes} onOpenChange={setMostrarDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {friccaoSelecionada && (() => {
                const IconeTipo = getIconeTipo(friccaoSelecionada.tipo);
                return <IconeTipo className="mr-2 h-5 w-5" />;
              })()}
              Detalhes da Fricção
            </DialogTitle>
          </DialogHeader>
          
          {friccaoSelecionada && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-2">{friccaoSelecionada.titulo}</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className={getCorStatus(friccaoSelecionada.status_resolucao)}>
                    {getTituloStatus(friccaoSelecionada.status_resolucao)}
                  </Badge>
                  <Badge className={getCorSeveridade(friccaoSelecionada.severidade)}>
                    {getTituloSeveridade(friccaoSelecionada.severidade)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Identificada em {formatarData(friccaoSelecionada.data_identificacao)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-sm">{getTituloTipo(friccaoSelecionada.tipo)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                  <p className="text-sm">{friccaoSelecionada.departamento_responsavel}</p>
                </div>
                {friccaoSelecionada.responsavel_resolucao && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="text-sm">{friccaoSelecionada.responsavel_resolucao}</p>
                  </div>
                )}
                {friccaoSelecionada.data_resolucao && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Resolução</Label>
                    <p className="text-sm">{formatarData(friccaoSelecionada.data_resolucao)}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                <p className="text-sm mt-1">{friccaoSelecionada.descricao}</p>
              </div>

              {friccaoSelecionada.causa_raiz && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Causa Raiz</Label>
                  <p className="text-sm mt-1">{friccaoSelecionada.causa_raiz}</p>
                </div>
              )}

              {friccaoSelecionada.acoes_tomadas && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ações Tomadas</Label>
                  <p className="text-sm mt-1">{friccaoSelecionada.acoes_tomadas}</p>
                </div>
              )}

              {friccaoSelecionada.feedback_pos_resolucao && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Feedback Pós-Resolução</Label>
                  <p className="text-sm mt-1">{friccaoSelecionada.feedback_pos_resolucao}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500 mb-2 block">Impacto na Satisfação</Label>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-sm text-gray-600">Antes:</span>
                    <span className="text-lg font-medium ml-1">{friccaoSelecionada.score_satisfacao_antes}%</span>
                  </div>
                  {friccaoSelecionada.score_satisfacao_depois && (
                    <>
                      <LucideIcons.ArrowRight className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-600">Depois:</span>
                        <span className="text-lg font-medium ml-1 text-green-600">{friccaoSelecionada.score_satisfacao_depois}%</span>
                      </div>
                      <div className="text-sm text-green-600">
                        (+{friccaoSelecionada.score_satisfacao_depois - friccaoSelecionada.score_satisfacao_antes} pontos)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Resolução */}
      <Dialog open={mostrarResolucao} onOpenChange={setMostrarResolucao}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Resolução</DialogTitle>
            <DialogDescription>
              Complete as informações sobre a resolução desta fricção
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="acoes">Ações Tomadas</Label>
              <Textarea
                id="acoes"
                placeholder="Descreva as ações realizadas para resolver esta fricção..."
                value={dadosResolucao.acoes_tomadas}
                onChange={e => setDadosResolucao(prev => ({ ...prev, acoes_tomadas: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="feedback">Feedback do Colaborador</Label>
              <Textarea
                id="feedback"
                placeholder="Feedback recebido do colaborador após a resolução..."
                value={dadosResolucao.feedback_pos_resolucao}
                onChange={e => setDadosResolucao(prev => ({ ...prev, feedback_pos_resolucao: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="score">Score de Satisfação Atual</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={dadosResolucao.score_satisfacao_depois}
                onChange={e => setDadosResolucao(prev => ({ ...prev, score_satisfacao_depois: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarResolucao(false)}
              disabled={salvandoResolucao}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarResolucao}
              disabled={salvandoResolucao}
            >
              {salvandoResolucao ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Resolução'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}