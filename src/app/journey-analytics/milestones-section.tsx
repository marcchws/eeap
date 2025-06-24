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
import { Progress } from "@/components/ui/progress"

// Tipos específicos de milestones
interface MilestoneCarreira {
  id: string;
  colaborador_id: string;
  tipo: 'temporal' | 'conquista' | 'transicao' | 'desenvolvimento';
  data_conquista?: string;
  data_prevista?: string;
  titulo: string;
  descricao: string;
  categoria: 'promocao' | 'salario' | 'certificacao' | 'projeto' | 'aniversario' | 'meta';
  status: 'concluido' | 'em_andamento' | 'planejado' | 'atrasado';
  valor_anterior?: string;
  valor_atual?: string;
  score_satisfacao_pre?: number;
  score_satisfacao_pos?: number;
  impacto_engajamento: number;
  comentarios_colaborador?: string;
  proximos_passos?: string;
}

interface FiltrosMilestones {
  status: string;
  categoria: string;
  tipo: string;
  periodo_meses: string;
}

interface MilestonesSectionProps {
  colaboradorSelecionado: any;
  filtrosGlobais: any;
}

// API Mock para milestones
const apiMockMilestones = {
  obterMilestones: async (colaboradorId: string, filtros: FiltrosMilestones) => {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    if (!colaboradorId) {
      return [];
    }

    const milestones: MilestoneCarreira[] = [
      {
        id: '1',
        colaborador_id: colaboradorId,
        tipo: 'temporal',
        data_conquista: '2023-03-15',
        titulo: '1 Ano na Empresa',
        descricao: 'Primeiro aniversário como Analista de RH',
        categoria: 'aniversario',
        status: 'concluido',
        score_satisfacao_pre: 75,
        score_satisfacao_pos: 82,
        impacto_engajamento: 8,
        comentarios_colaborador: 'Satisfeita com o crescimento até aqui'
      },
      {
        id: '2',
        colaborador_id: colaboradorId,
        tipo: 'transicao',
        data_conquista: '2023-03-15',
        titulo: 'Promoção para Pleno',
        descricao: 'Promoção de Junior para Pleno',
        categoria: 'promocao',
        status: 'concluido',
        valor_anterior: 'Analista Junior',
        valor_atual: 'Analista Pleno',
        score_satisfacao_pre: 75,
        score_satisfacao_pos: 88,
        impacto_engajamento: 15,
        comentarios_colaborador: 'Muito feliz com o reconhecimento'
      },
      {
        id: '3',
        colaborador_id: colaboradorId,
        tipo: 'conquista',
        data_conquista: '2023-06-10',
        titulo: 'Certificação People Analytics',
        descricao: 'Conclusão do curso de especialização',
        categoria: 'certificacao',
        status: 'concluido',
        score_satisfacao_pre: 82,
        score_satisfacao_pos: 86,
        impacto_engajamento: 6,
        comentarios_colaborador: 'Curso muito relevante para minha função'
      },
      {
        id: '4',
        colaborador_id: colaboradorId,
        tipo: 'transicao',
        data_conquista: '2024-03-15',
        titulo: 'Promoção para Senior',
        descricao: 'Promoção de Pleno para Senior',
        categoria: 'promocao',
        status: 'concluido',
        valor_anterior: 'Analista Pleno',
        valor_atual: 'Analista Senior',
        score_satisfacao_pre: 80,
        score_satisfacao_pos: 92,
        impacto_engajamento: 18,
        comentarios_colaborador: 'Objetivo alcançado! Pronta para novos desafios'
      },
      {
        id: '5',
        colaborador_id: colaboradorId,
        tipo: 'temporal',
        data_prevista: '2025-03-15',
        titulo: '3 Anos na Empresa',
        descricao: 'Terceiro aniversário na empresa',
        categoria: 'aniversario',
        status: 'planejado',
        impacto_engajamento: 5,
        proximos_passos: 'Conversa sobre plano de carreira a longo prazo'
      },
      {
        id: '6',
        colaborador_id: colaboradorId,
        tipo: 'desenvolvimento',
        data_prevista: '2025-06-30',
        titulo: 'MBA em Gestão de Pessoas',
        descricao: 'Conclusão do MBA patrocinado pela empresa',
        categoria: 'certificacao',
        status: 'em_andamento',
        impacto_engajamento: 12,
        proximos_passos: 'Aplicar conhecimentos em projeto piloto'
      },
      {
        id: '7',
        colaborador_id: colaboradorId,
        tipo: 'conquista',
        data_prevista: '2025-09-30',
        titulo: 'Liderança de Projeto Estratégico',
        descricao: 'Liderar implementação de novo sistema de avaliação',
        categoria: 'projeto',
        status: 'planejado',
        impacto_engajamento: 20,
        proximos_passos: 'Definir equipe e cronograma do projeto'
      }
    ];

    // Aplicar filtros
    let milestonesFiltrados = milestones;

    if (filtros.status !== 'todos') {
      milestonesFiltrados = milestonesFiltrados.filter(m => m.status === filtros.status);
    }

    if (filtros.categoria !== 'todos') {
      milestonesFiltrados = milestonesFiltrados.filter(m => m.categoria === filtros.categoria);
    }

    if (filtros.tipo !== 'todos') {
      milestonesFiltrados = milestonesFiltrados.filter(m => m.tipo === filtros.tipo);
    }

    if (filtros.periodo_meses !== 'todos') {
      const mesesAtras = parseInt(filtros.periodo_meses);
      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - mesesAtras);
      
      milestonesFiltrados = milestonesFiltrados.filter(m => {
        const dataReferencia = new Date(m.data_conquista || m.data_prevista || '');
        return dataReferencia >= dataLimite;
      });
    }

    return milestonesFiltrados.sort((a, b) => {
      const dataA = new Date(a.data_conquista || a.data_prevista || '');
      const dataB = new Date(b.data_conquista || b.data_prevista || '');
      return dataB.getTime() - dataA.getTime();
    });
  },

  obterProximosMilestones: async (colaboradorId: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Retorna milestones dos próximos 90 dias
    const agora = new Date();
    const em90Dias = new Date();
    em90Dias.setDate(agora.getDate() + 90);

    const milestones = await apiMockMilestones.obterMilestones(colaboradorId, {
      status: 'todos',
      categoria: 'todos',
      tipo: 'todos',
      periodo_meses: 'todos'
    });

    return milestones.filter(m => {
      if (!m.data_prevista) return false;
      const dataPrevista = new Date(m.data_prevista);
      return dataPrevista >= agora && dataPrevista <= em90Dias;
    });
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

const calcularDiasRestantes = (dataString: string): number => {
  try {
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = data.getTime() - agora.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

const getCorStatus = (status: string) => {
  switch (status) {
    case 'concluido': return 'bg-green-100 text-green-800';
    case 'em_andamento': return 'bg-blue-100 text-blue-800';
    case 'planejado': return 'bg-yellow-100 text-yellow-800';
    case 'atrasado': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getIconeCategoria = (categoria: string) => {
  switch (categoria) {
    case 'promocao': return LucideIcons.TrendingUp;
    case 'salario': return LucideIcons.DollarSign;
    case 'certificacao': return LucideIcons.GraduationCap;
    case 'projeto': return LucideIcons.Briefcase;
    case 'aniversario': return LucideIcons.Calendar;
    case 'meta': return LucideIcons.Target;
    default: return LucideIcons.Trophy;
  }
};

const getTituloStatus = (status: string) => {
  switch (status) {
    case 'concluido': return 'Concluído';
    case 'em_andamento': return 'Em Andamento';
    case 'planejado': return 'Planejado';
    case 'atrasado': return 'Atrasado';
    default: return 'Desconhecido';
  }
};

const getTituloCategoria = (categoria: string) => {
  switch (categoria) {
    case 'promocao': return 'Promoção';
    case 'salario': return 'Salário';
    case 'certificacao': return 'Certificação';
    case 'projeto': return 'Projeto';
    case 'aniversario': return 'Aniversário';
    case 'meta': return 'Meta';
    default: return 'Outros';
  }
};

const getTituloTipo = (tipo: string) => {
  switch (tipo) {
    case 'temporal': return 'Temporal';
    case 'conquista': return 'Conquista';
    case 'transicao': return 'Transição';
    case 'desenvolvimento': return 'Desenvolvimento';
    default: return 'Outros';
  }
};

export default function MilestonesSection({ colaboradorSelecionado, filtrosGlobais }: MilestonesSectionProps) {
  // Estados dos milestones
  const [milestones, setMilestones] = useState<MilestoneCarreira[]>([]);
  const [proximosMilestones, setProximosMilestones] = useState<MilestoneCarreira[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoProximos, setCarregandoProximos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros específicos dos milestones
  const [filtros, setFiltros] = useState<FiltrosMilestones>({
    status: 'todos',
    categoria: 'todos',
    tipo: 'todos',
    periodo_meses: 'todos'
  });

  // Ref para controle de montagem
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar milestones quando colaborador ou filtros mudam
  useEffect(() => {
    if (colaboradorSelecionado?.id) {
      carregarMilestones();
      carregarProximosMilestones();
    } else {
      setMilestones([]);
      setProximosMilestones([]);
      setErro(null);
    }
  }, [colaboradorSelecionado, filtros]);

  // Carregar milestones
  const carregarMilestones = useCallback(async () => {
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
      const milestonesData = await apiMockMilestones.obterMilestones(colaboradorSelecionado.id, filtros);
      if (montadoRef.current) {
        setMilestones(milestonesData);
      }
    } catch (error) {
      console.error('Erro ao carregar milestones:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar milestones. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [colaboradorSelecionado, filtros]);

  // Carregar próximos milestones
  const carregarProximosMilestones = useCallback(async () => {
    if (!montadoRef.current || !colaboradorSelecionado?.id) return;
    
    setCarregandoProximos(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoProximos(false);
      }
    }, 5000);
    
    try {
      const proximosData = await apiMockMilestones.obterProximosMilestones(colaboradorSelecionado.id);
      if (montadoRef.current) {
        setProximosMilestones(proximosData);
      }
    } catch (error) {
      console.error('Erro ao carregar próximos milestones:', error);
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoProximos(false);
      }
    }
  }, [colaboradorSelecionado]);

  // Alterar filtro
  const handleFiltroChange = useCallback((campo: keyof FiltrosMilestones, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Limpar filtros
  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      status: 'todos',
      categoria: 'todos',
      tipo: 'todos',
      periodo_meses: 'todos'
    });
  }, []);

  // Filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.status !== 'todos' || 
           filtros.categoria !== 'todos' || 
           filtros.tipo !== 'todos' || 
           filtros.periodo_meses !== 'todos';
  }, [filtros]);

  // Estatísticas dos milestones
  const estatisticas = useMemo(() => {
    return {
      total: milestones.length,
      concluidos: milestones.filter(m => m.status === 'concluido').length,
      em_andamento: milestones.filter(m => m.status === 'em_andamento').length,
      planejados: milestones.filter(m => m.status === 'planejado').length,
      impacto_medio: milestones.length > 0 
        ? Math.round(milestones.reduce((acc, m) => acc + m.impacto_engajamento, 0) / milestones.length)
        : 0
    };
  }, [milestones]);

  return (
    <div className="space-y-6">
      {/* Próximos Milestones */}
      {colaboradorSelecionado && !carregandoProximos && proximosMilestones.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <LucideIcons.Clock className="mr-2 h-5 w-5" />
              Próximos Milestones (90 dias)
            </CardTitle>
            <CardDescription className="text-blue-700">
              Marcos importantes previstos para os próximos 3 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosMilestones.map(milestone => {
                const IconeCategoria = getIconeCategoria(milestone.categoria);
                const diasRestantes = calcularDiasRestantes(milestone.data_prevista || '');
                
                return (
                  <div key={milestone.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconeCategoria className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{milestone.titulo}</h4>
                        <p className="text-sm text-gray-600">{milestone.descricao}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {getTituloCategoria(milestone.categoria)}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        {diasRestantes > 0 ? `${diasRestantes} dias` : 'Hoje'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros dos Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LucideIcons.Filter className="mr-2 h-5 w-5" />
            Filtros de Milestones
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
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={filtros.categoria}
                onValueChange={valor => handleFiltroChange('categoria', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="promocao">Promoção</SelectItem>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="certificacao">Certificação</SelectItem>
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="aniversario">Aniversário</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
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
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="conquista">Conquista</SelectItem>
                  <SelectItem value="transicao">Transição</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
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
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último ano</SelectItem>
                  <SelectItem value="24">Últimos 2 anos</SelectItem>
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
      {!carregando && !erro && milestones.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <p className="text-xs text-muted-foreground">Total de Milestones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{estatisticas.concluidos}</div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.em_andamento}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.planejados}</div>
              <p className="text-xs text-muted-foreground">Planejados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.impacto_medio}</div>
              <p className="text-xs text-muted-foreground">Impacto Médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estados de Interface */}
      {!colaboradorSelecionado && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um colaborador</h3>
            <p className="text-gray-500">
              Para visualizar os milestones de carreira, primeiro selecione um colaborador usando os filtros globais acima.
            </p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && carregando && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Carregando milestones</h3>
            <p className="text-gray-500">Buscando marcos de carreira do colaborador...</p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && erro && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar milestones</h3>
            <p className="text-gray-500 mb-4">{erro}</p>
            <Button onClick={carregarMilestones}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && !erro && milestones.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.Trophy className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum milestone encontrado</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {filtrosAplicados 
                ? 'Nenhum milestone corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                : 'Ainda não há milestones registrados para este colaborador.'
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

      {/* Lista de Milestones */}
      {!carregando && !erro && milestones.length > 0 && (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const IconeCategoria = getIconeCategoria(milestone.categoria);
            const progresso = milestone.status === 'concluido' ? 100 : 
                             milestone.status === 'em_andamento' ? 60 : 
                             milestone.status === 'planejado' ? 20 : 0;
            
            return (
              <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <IconeCategoria className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{milestone.titulo}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getTituloCategoria(milestone.categoria)}
                            </Badge>
                            <Badge className={`text-xs ${getCorStatus(milestone.status)}`}>
                              {getTituloStatus(milestone.status)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {milestone.data_conquista ? 
                                `Conquistado em ${formatarData(milestone.data_conquista)}` :
                                milestone.data_prevista ?
                                `Previsto para ${formatarData(milestone.data_prevista)}` :
                                'Data não definida'
                              }
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">
                            +{milestone.impacto_engajamento} pts
                          </Badge>
                          <p className="text-xs text-gray-500">Impacto</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{milestone.descricao}</p>
                      
                      {/* Progresso */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Progresso</span>
                          <span className="text-xs text-gray-500">{progresso}%</span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>
                      
                      {/* Valores anterior/atual */}
                      {(milestone.valor_anterior || milestone.valor_atual) && (
                        <div className="flex items-center space-x-4 text-sm mb-3 p-2 bg-gray-50 rounded">
                          {milestone.valor_anterior && (
                            <div>
                              <span className="text-gray-500">De:</span>
                              <span className="ml-1 font-medium">{milestone.valor_anterior}</span>
                            </div>
                          )}
                          {milestone.valor_anterior && milestone.valor_atual && (
                            <LucideIcons.ArrowRight className="h-4 w-4 text-gray-400" />
                          )}
                          {milestone.valor_atual && (
                            <div>
                              <span className="text-gray-500">Para:</span>
                              <span className="ml-1 font-medium text-green-600">{milestone.valor_atual}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Satisfação antes/depois */}
                      {(milestone.score_satisfacao_pre || milestone.score_satisfacao_pos) && (
                        <div className="flex items-center space-x-4 text-sm mb-3">
                          {milestone.score_satisfacao_pre && (
                            <div>
                              <span className="text-gray-500">Satisfação antes:</span>
                              <span className="ml-1 font-medium">{milestone.score_satisfacao_pre}%</span>
                            </div>
                          )}
                          {milestone.score_satisfacao_pre && milestone.score_satisfacao_pos && (
                            <LucideIcons.ArrowRight className="h-4 w-4 text-gray-400" />
                          )}
                          {milestone.score_satisfacao_pos && (
                            <div>
                              <span className="text-gray-500">Depois:</span>
                              <span className="ml-1 font-medium text-green-600">{milestone.score_satisfacao_pos}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Comentários */}
                      {milestone.comentarios_colaborador && (
                        <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-3">
                          <div className="flex items-start">
                            <LucideIcons.MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm text-blue-800 italic">
                                "{milestone.comentarios_colaborador}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Próximos passos */}
                      {milestone.proximos_passos && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-200 p-3">
                          <div className="flex items-start">
                            <LucideIcons.CheckSquare className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm text-yellow-800">
                                <strong>Próximos passos:</strong> {milestone.proximos_passos}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                        <span className="flex items-center">
                          <LucideIcons.Tag className="mr-1 h-3 w-3" />
                          {getTituloTipo(milestone.tipo)}
                        </span>
                        <span className="flex items-center">
                          <LucideIcons.BarChart3 className="mr-1 h-3 w-3" />
                          Impacto: {milestone.impacto_engajamento} pontos
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}