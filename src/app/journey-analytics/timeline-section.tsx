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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Tipos específicos da timeline
interface EventoJornada {
  id: string;
  tipo: 'admissao' | 'promocao' | 'transferencia' | 'treinamento' | 'avaliacao' | 'reconhecimento';
  data: string;
  titulo: string;
  descricao: string;
  departamento: string;
  gestor_responsavel: string;
  impacto_score: number;
  status: 'concluido' | 'em_andamento' | 'cancelado';
  detalhes?: {
    cargo_anterior?: string;
    cargo_novo?: string;
    salario_anterior?: number;
    salario_novo?: number;
    nota_avaliacao?: number;
    tipo_reconhecimento?: string;
  };
}

interface FiltrosTimeline {
  tipo_evento: string;
  periodo_meses: string;
  impacto: string;
}

interface TimelineSectionProps {
  colaboradorSelecionado: any;
  filtrosGlobais: any;
}

// API Mock para timeline
const apiMockTimeline = {
  obterEventosJornada: async (colaboradorId: string, filtros: FiltrosTimeline) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (!colaboradorId) {
      return [];
    }

    const eventos: EventoJornada[] = [
      {
        id: '1',
        tipo: 'admissao',
        data: '2022-03-15',
        titulo: 'Admissão na Empresa',
        descricao: 'Início como Analista de RH Junior',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 10,
        status: 'concluido',
        detalhes: {
          cargo_novo: 'Analista de RH Junior',
          salario_novo: 4500
        }
      },
      {
        id: '2',
        tipo: 'treinamento',
        data: '2022-04-20',
        titulo: 'Onboarding Completo',
        descricao: 'Conclusão do programa de integração de 30 dias',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 5,
        status: 'concluido'
      },
      {
        id: '3',
        tipo: 'avaliacao',
        data: '2022-09-15',
        titulo: 'Primeira Avaliação de Performance',
        descricao: 'Avaliação de desempenho após 6 meses',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 8,
        status: 'concluido',
        detalhes: {
          nota_avaliacao: 4.2
        }
      },
      {
        id: '4',
        tipo: 'promocao',
        data: '2023-03-15',
        titulo: 'Promoção para Pleno',
        descricao: 'Promoção para Analista de RH Pleno após 1 ano',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 15,
        status: 'concluido',
        detalhes: {
          cargo_anterior: 'Analista de RH Junior',
          cargo_novo: 'Analista de RH Pleno',
          salario_anterior: 4500,
          salario_novo: 6200
        }
      },
      {
        id: '5',
        tipo: 'treinamento',
        data: '2023-06-10',
        titulo: 'Certificação em People Analytics',
        descricao: 'Conclusão do curso de especialização',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 6,
        status: 'concluido'
      },
      {
        id: '6',
        tipo: 'reconhecimento',
        data: '2023-12-15',
        titulo: 'Funcionário do Trimestre',
        descricao: 'Reconhecimento por excelência no atendimento interno',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'Maria Santos',
        impacto_score: 12,
        status: 'concluido',
        detalhes: {
          tipo_reconhecimento: 'Funcionário Destaque'
        }
      },
      {
        id: '7',
        tipo: 'promocao',
        data: '2024-03-15',
        titulo: 'Promoção para Senior',
        descricao: 'Promoção para Analista de RH Senior',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'João Silva',
        impacto_score: 18,
        status: 'concluido',
        detalhes: {
          cargo_anterior: 'Analista de RH Pleno',
          cargo_novo: 'Analista de RH Senior',
          salario_anterior: 6200,
          salario_novo: 8500
        }
      },
      {
        id: '8',
        tipo: 'avaliacao',
        data: '2024-09-15',
        titulo: 'Avaliação Anual 2024',
        descricao: 'Avaliação de performance e desenvolvimento',
        departamento: 'Recursos Humanos',
        gestor_responsavel: 'João Silva',
        impacto_score: 10,
        status: 'concluido',
        detalhes: {
          nota_avaliacao: 4.6
        }
      }
    ];

    // Aplicar filtros
    let eventosFiltrados = eventos;

    if (filtros.tipo_evento !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(e => e.tipo === filtros.tipo_evento);
    }

    if (filtros.periodo_meses !== 'todos') {
      const mesesAtras = parseInt(filtros.periodo_meses);
      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - mesesAtras);
      
      eventosFiltrados = eventosFiltrados.filter(e => new Date(e.data) >= dataLimite);
    }

    if (filtros.impacto !== 'todos') {
      if (filtros.impacto === 'positivo') {
        eventosFiltrados = eventosFiltrados.filter(e => e.impacto_score > 0);
      } else if (filtros.impacto === 'neutro') {
        eventosFiltrados = eventosFiltrados.filter(e => e.impacto_score === 0);
      } else if (filtros.impacto === 'negativo') {
        eventosFiltrados = eventosFiltrados.filter(e => e.impacto_score < 0);
      }
    }

    return eventosFiltrados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }
};

// Funções utilitárias
const formatarData = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

const formatarDataCompleta = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

const formatarSalario = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const getIconeEvento = (tipo: string) => {
  switch (tipo) {
    case 'admissao': return LucideIcons.UserPlus;
    case 'promocao': return LucideIcons.TrendingUp;
    case 'transferencia': return LucideIcons.ArrowRight;
    case 'treinamento': return LucideIcons.GraduationCap;
    case 'avaliacao': return LucideIcons.FileCheck;
    case 'reconhecimento': return LucideIcons.Award;
    default: return LucideIcons.Calendar;
  }
};

const getCorEvento = (tipo: string, impacto: number) => {
  if (impacto >= 10) return 'bg-green-100 border-green-300 text-green-800';
  if (impacto >= 5) return 'bg-blue-100 border-blue-300 text-blue-800';
  if (impacto > 0) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  if (impacto === 0) return 'bg-gray-100 border-gray-300 text-gray-800';
  return 'bg-red-100 border-red-300 text-red-800';
};

const getTituloEvento = (tipo: string) => {
  switch (tipo) {
    case 'admissao': return 'Admissão';
    case 'promocao': return 'Promoção';
    case 'transferencia': return 'Transferência';
    case 'treinamento': return 'Treinamento';
    case 'avaliacao': return 'Avaliação';
    case 'reconhecimento': return 'Reconhecimento';
    default: return 'Evento';
  }
};

export default function TimelineSection({ colaboradorSelecionado, filtrosGlobais }: TimelineSectionProps) {
  // Estados da timeline
  const [eventos, setEventos] = useState<EventoJornada[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros específicos da timeline
  const [filtros, setFiltros] = useState<FiltrosTimeline>({
    tipo_evento: 'todos',
    periodo_meses: 'todos',
    impacto: 'todos'
  });

  // Modal de detalhes
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoJornada | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Ref para controle de montagem
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar eventos quando colaborador ou filtros mudam
  useEffect(() => {
    if (colaboradorSelecionado?.id) {
      carregarEventos();
    } else {
      setEventos([]);
      setErro(null);
    }
  }, [colaboradorSelecionado, filtros]);

  // Carregar eventos da jornada
  const carregarEventos = useCallback(async () => {
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
      const eventosData = await apiMockTimeline.obterEventosJornada(colaboradorSelecionado.id, filtros);
      if (montadoRef.current) {
        setEventos(eventosData);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar eventos da jornada. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [colaboradorSelecionado, filtros]);

  // Alterar filtro
  const handleFiltroChange = useCallback((campo: keyof FiltrosTimeline, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Limpar filtros
  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      tipo_evento: 'todos',
      periodo_meses: 'todos',
      impacto: 'todos'
    });
  }, []);

  // Abrir detalhes do evento
  const handleAbrirDetalhes = useCallback((evento: EventoJornada) => {
    setEventoSelecionado(evento);
    setMostrarDetalhes(true);
  }, []);

  // Filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.tipo_evento !== 'todos' || 
           filtros.periodo_meses !== 'todos' || 
           filtros.impacto !== 'todos';
  }, [filtros]);

  // Estatísticas dos eventos
  const estatisticas = useMemo(() => {
    return {
      total: eventos.length,
      positivos: eventos.filter(e => e.impacto_score > 0).length,
      neutros: eventos.filter(e => e.impacto_score === 0).length,
      negativos: eventos.filter(e => e.impacto_score < 0).length,
      impactoTotal: eventos.reduce((acc, e) => acc + e.impacto_score, 0)
    };
  }, [eventos]);

  return (
    <div className="space-y-6">
      {/* Filtros da Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LucideIcons.Filter className="mr-2 h-5 w-5" />
            Filtros da Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select
                value={filtros.tipo_evento}
                onValueChange={valor => handleFiltroChange('tipo_evento', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="admissao">Admissão</SelectItem>
                  <SelectItem value="promocao">Promoção</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
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

            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select
                value={filtros.impacto}
                onValueChange={valor => handleFiltroChange('impacto', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Impactos</SelectItem>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
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
      {!carregando && !erro && eventos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <p className="text-xs text-muted-foreground">Total de Eventos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{estatisticas.positivos}</div>
              <p className="text-xs text-muted-foreground">Impacto Positivo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{estatisticas.neutros}</div>
              <p className="text-xs text-muted-foreground">Impacto Neutro</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{estatisticas.negativos}</div>
              <p className="text-xs text-muted-foreground">Impacto Negativo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${estatisticas.impactoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {estatisticas.impactoTotal > 0 ? '+' : ''}{estatisticas.impactoTotal}
              </div>
              <p className="text-xs text-muted-foreground">Score Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estados de Interface */}
      {!colaboradorSelecionado && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um colaborador</h3>
            <p className="text-gray-500">
              Para visualizar a timeline da jornada, primeiro selecione um colaborador usando os filtros globais acima.
            </p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && carregando && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Carregando timeline</h3>
            <p className="text-gray-500">Buscando eventos da jornada do colaborador...</p>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && erro && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar timeline</h3>
            <p className="text-gray-500 mb-4">{erro}</p>
            <Button onClick={carregarEventos}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {colaboradorSelecionado && !carregando && !erro && eventos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.Calendar className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {filtrosAplicados 
                ? 'Nenhum evento corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                : 'Ainda não há eventos registrados na jornada deste colaborador.'
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

      {/* Timeline de Eventos */}
      {!carregando && !erro && eventos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LucideIcons.Clock className="mr-2 h-5 w-5" />
              Timeline da Jornada - {colaboradorSelecionado.nome}
            </CardTitle>
            <CardDescription>
              Eventos organizados cronologicamente da jornada profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {eventos.map((evento, index) => {
                  const IconeEvento = getIconeEvento(evento.tipo);
                  
                  return (
                    <div key={evento.id} className="relative flex items-start">
                      {/* Ícone do evento */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getCorEvento(evento.tipo, evento.impacto_score)}`}>
                        <IconeEvento className="h-5 w-5" />
                      </div>
                      
                      {/* Conteúdo do evento */}
                      <div className="ml-6 flex-1">
                        <div 
                          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleAbrirDetalhes(evento)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {getTituloEvento(evento.tipo)}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {formatarData(evento.data)}
                                </span>
                                {evento.impacto_score !== 0 && (
                                  <Badge 
                                    variant={evento.impacto_score > 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {evento.impacto_score > 0 ? '+' : ''}{evento.impacto_score}
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="font-medium text-gray-900 mb-1">
                                {evento.titulo}
                              </h3>
                              
                              <p className="text-gray-600 text-sm mb-2">
                                {evento.descricao}
                              </p>
                              
                              <div className="flex items-center text-xs text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <LucideIcons.Building2 className="mr-1 h-3 w-3" />
                                  {evento.departamento}
                                </span>
                                <span className="flex items-center">
                                  <LucideIcons.User className="mr-1 h-3 w-3" />
                                  {evento.gestor_responsavel}
                                </span>
                              </div>
                            </div>
                            
                            <LucideIcons.ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes do Evento */}
      <Dialog open={mostrarDetalhes} onOpenChange={setMostrarDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {eventoSelecionado && (() => {
                const IconeEvento = getIconeEvento(eventoSelecionado.tipo);
                return <IconeEvento className="mr-2 h-5 w-5" />;
              })()}
              {eventoSelecionado?.titulo}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do evento da jornada
            </DialogDescription>
          </DialogHeader>
          
          {eventoSelecionado && (
            <div className="space-y-4">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data</Label>
                  <p className="text-sm">{formatarDataCompleta(eventoSelecionado.data)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-sm">{getTituloEvento(eventoSelecionado.tipo)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                  <p className="text-sm">{eventoSelecionado.departamento}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Gestor Responsável</Label>
                  <p className="text-sm">{eventoSelecionado.gestor_responsavel}</p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                <p className="text-sm mt-1">{eventoSelecionado.descricao}</p>
              </div>

              {/* Impacto */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Impacto no Score</Label>
                <div className="flex items-center mt-1">
                  <Badge 
                    variant={eventoSelecionado.impacto_score > 0 ? "default" : eventoSelecionado.impacto_score < 0 ? "destructive" : "secondary"}
                  >
                    {eventoSelecionado.impacto_score > 0 ? '+' : ''}{eventoSelecionado.impacto_score} pontos
                  </Badge>
                </div>
              </div>

              {/* Detalhes específicos */}
              {eventoSelecionado.detalhes && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Detalhes Específicos</Label>
                  <div className="space-y-2">
                    {eventoSelecionado.detalhes.cargo_anterior && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cargo Anterior:</span>
                        <span className="text-sm font-medium">{eventoSelecionado.detalhes.cargo_anterior}</span>
                      </div>
                    )}
                    {eventoSelecionado.detalhes.cargo_novo && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cargo Novo:</span>
                        <span className="text-sm font-medium">{eventoSelecionado.detalhes.cargo_novo}</span>
                      </div>
                    )}
                    {eventoSelecionado.detalhes.salario_anterior && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Salário Anterior:</span>
                        <span className="text-sm font-medium">{formatarSalario(eventoSelecionado.detalhes.salario_anterior)}</span>
                      </div>
                    )}
                    {eventoSelecionado.detalhes.salario_novo && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Salário Novo:</span>
                        <span className="text-sm font-medium">{formatarSalario(eventoSelecionado.detalhes.salario_novo)}</span>
                      </div>
                    )}
                    {eventoSelecionado.detalhes.nota_avaliacao && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nota da Avaliação:</span>
                        <span className="text-sm font-medium">{eventoSelecionado.detalhes.nota_avaliacao}/5.0</span>
                      </div>
                    )}
                    {eventoSelecionado.detalhes.tipo_reconhecimento && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tipo de Reconhecimento:</span>
                        <span className="text-sm font-medium">{eventoSelecionado.detalhes.tipo_reconhecimento}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}