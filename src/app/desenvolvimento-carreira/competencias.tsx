'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Tipos específicos da seção
interface Competencia {
  id: string;
  nome: string;
  tipo: 'tecnica' | 'comportamental' | 'lideranca';
  categoria: 'core' | 'especifica_cargo' | 'diferencial';
  descricao: string;
  niveis: {
    nivel: number;
    descricao: string;
  }[];
}

interface AvaliacaoCompetencia {
  id: string;
  competencia_id: string;
  colaborador_id: string;
  nivel_atual: number;
  nivel_requerido: number;
  gap: number;
  fonte_avaliacao: 'autoavaliacao' | 'gestor' | 'peer' | 'consolidada';
  evidencias?: string;
  data_avaliacao: string;
  avaliador_id?: string;
}

interface MapaCompetenciasColaborador {
  colaborador_id: string;
  colaborador_nome: string;
  cargo: string;
  competencias: AvaliacaoCompetencia[];
  score_geral: number;
  gaps_criticos: number;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  tipo_perfil: 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'colaborador' | 'lideranca';
  equipe_ids?: string[];
}

interface CompetenciasSectionProps {
  perfilUsuario: PerfilUsuario | null;
  temPermissao: (acao: string) => boolean;
}

export default function CompetenciasSection({ perfilUsuario, temPermissao }: CompetenciasSectionProps) {
  // Estados principais
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [mapaCompetencias, setMapaCompetencias] = useState<MapaCompetenciasColaborador[]>([]);
  const [competenciaDetalhes, setCompetenciaDetalhes] = useState<Competencia | null>(null);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string>('');
  
  // Estados de controle
  const [carregandoCompetencias, setCarregandoCompetencias] = useState(true);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erroCompetencias, setErroCompetencias] = useState<string | null>(null);
  const [erroMapa, setErroMapa] = useState<string | null>(null);
  
  // Estados de modais e formulários
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [avaliacaoEmAndamento, setAvaliacaoEmAndamento] = useState<AvaliacaoCompetencia | null>(null);
  
  // Estados de filtros
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Ref para controle de montagem
  const montadoRef = useRef(true);
  
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // Mock API para competências
  const apiMock = useMemo(() => ({
    async obterCompetencias(): Promise<Competencia[]> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [
        {
          id: 'comp-001',
          nome: 'Liderança de Equipes',
          tipo: 'lideranca',
          categoria: 'core',
          descricao: 'Capacidade de liderar, motivar e desenvolver equipes de alta performance',
          niveis: [
            { nivel: 1, descricao: 'Lidera pequenos grupos em tarefas específicas' },
            { nivel: 2, descricao: 'Coordena equipes de projeto com autonomia' },
            { nivel: 3, descricao: 'Gere equipes permanentes com resultados consistentes' },
            { nivel: 4, descricao: 'Desenvolve líderes e constrói cultura organizacional' },
            { nivel: 5, descricao: 'Referência em liderança, influencia estrategicamente' }
          ]
        },
        {
          id: 'comp-002',
          nome: 'Análise de Dados',
          tipo: 'tecnica',
          categoria: 'especifica_cargo',
          descricao: 'Capacidade de coletar, processar e interpretar dados para tomada de decisão',
          niveis: [
            { nivel: 1, descricao: 'Utiliza ferramentas básicas de análise' },
            { nivel: 2, descricao: 'Cria relatórios e dashboards simples' },
            { nivel: 3, descricao: 'Desenvolve análises complexas e insights' },
            { nivel: 4, descricao: 'Constrói modelos preditivos e estatísticos' },
            { nivel: 5, descricao: 'Arquiteta soluções de analytics empresariais' }
          ]
        },
        {
          id: 'comp-003',
          nome: 'Comunicação Eficaz',
          tipo: 'comportamental',
          categoria: 'core',
          descricao: 'Habilidade de comunicar-se clara e persuasivamente em diversos contextos',
          niveis: [
            { nivel: 1, descricao: 'Comunica-se adequadamente no dia a dia' },
            { nivel: 2, descricao: 'Apresenta ideias com clareza e organização' },
            { nivel: 3, descricao: 'Adapta comunicação ao público e contexto' },
            { nivel: 4, descricao: 'Influencia e persuade stakeholders diversos' },
            { nivel: 5, descricao: 'Comunicador excepcional, inspira e mobiliza' }
          ]
        },
        {
          id: 'comp-004',
          nome: 'Gestão de Projetos',
          tipo: 'tecnica',
          categoria: 'especifica_cargo',
          descricao: 'Capacidade de planejar, executar e monitorar projetos do início ao fim',
          niveis: [
            { nivel: 1, descricao: 'Executa tarefas de projeto sob supervisão' },
            { nivel: 2, descricao: 'Coordena projetos simples com poucos stakeholders' },
            { nivel: 3, descricao: 'Gere projetos complexos com múltiplas dependências' },
            { nivel: 4, descricao: 'Lidera programas e portfolios de projetos' },
            { nivel: 5, descricao: 'Define metodologias e padrões organizacionais' }
          ]
        },
        {
          id: 'comp-005',
          nome: 'Pensamento Estratégico',
          tipo: 'comportamental',
          categoria: 'diferencial',
          descricao: 'Capacidade de analisar cenários complexos e definir direções de longo prazo',
          niveis: [
            { nivel: 1, descricao: 'Entende estratégias definidas e suas implicações' },
            { nivel: 2, descricao: 'Contribui com insights para planejamento tático' },
            { nivel: 3, descricao: 'Desenvolve estratégias para sua área de atuação' },
            { nivel: 4, descricao: 'Influencia direcionamento estratégico organizacional' },
            { nivel: 5, descricao: 'Visionário, define estratégias disruptivas' }
          ]
        }
      ];
    },

    async obterMapaCompetenciasColaborador(colaboradorId: string): Promise<MapaCompetenciasColaborador> {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const avaliacoes: AvaliacaoCompetencia[] = [
        {
          id: 'aval-001',
          competencia_id: 'comp-001',
          colaborador_id: colaboradorId,
          nivel_atual: 3,
          nivel_requerido: 4,
          gap: 1,
          fonte_avaliacao: 'consolidada',
          evidencias: 'Liderou projeto de transformação digital com equipe de 12 pessoas',
          data_avaliacao: '2024-06-15',
          avaliador_id: 'gestor-001'
        },
        {
          id: 'aval-002',
          competencia_id: 'comp-002',
          colaborador_id: colaboradorId,
          nivel_atual: 4,
          nivel_requerido: 4,
          gap: 0,
          fonte_avaliacao: 'consolidada',
          evidencias: 'Desenvolveu dashboards analytics que impactaram decisões estratégicas',
          data_avaliacao: '2024-06-15'
        },
        {
          id: 'aval-003',
          competencia_id: 'comp-003',
          colaborador_id: colaboradorId,
          nivel_atual: 2,
          nivel_requerido: 3,
          gap: 1,
          fonte_avaliacao: 'consolidada',
          evidencias: 'Apresentações claras, mas precisa desenvolver persuasão',
          data_avaliacao: '2024-06-15'
        },
        {
          id: 'aval-004',
          competencia_id: 'comp-004',
          colaborador_id: colaboradorId,
          nivel_atual: 3,
          nivel_requerido: 3,
          gap: 0,
          fonte_avaliacao: 'consolidada',
          evidencias: 'Gerenciou 3 projetos simultaneamente com entregas no prazo',
          data_avaliacao: '2024-06-15'
        },
        {
          id: 'aval-005',
          competencia_id: 'comp-005',
          colaborador_id: colaboradorId,
          nivel_atual: 2,
          nivel_requerido: 4,
          gap: 2,
          fonte_avaliacao: 'consolidada',
          evidencias: 'Demonstra potencial estratégico, precisa de maior exposição',
          data_avaliacao: '2024-06-15'
        }
      ];

      const gaps_criticos = avaliacoes.filter(a => a.gap >= 2).length;
      const score_geral = Math.round(
        (avaliacoes.reduce((acc, a) => acc + (a.nivel_atual / a.nivel_requerido), 0) / avaliacoes.length) * 100
      );

      return {
        colaborador_id: colaboradorId,
        colaborador_nome: colaboradorId === perfilUsuario?.id ? perfilUsuario.nome : 'Carlos Eduardo Silva',
        cargo: colaboradorId === perfilUsuario?.id ? perfilUsuario.cargo : 'Analista Sênior',
        competencias: avaliacoes,
        score_geral,
        gaps_criticos
      };
    },

    async salvarAvaliacaoCompetencia(avaliacao: Partial<AvaliacaoCompetencia>): Promise<AvaliacaoCompetencia> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `aval-${Date.now()}`,
        competencia_id: avaliacao.competencia_id!,
        colaborador_id: avaliacao.colaborador_id!,
        nivel_atual: avaliacao.nivel_atual!,
        nivel_requerido: avaliacao.nivel_requerido!,
        gap: (avaliacao.nivel_requerido! - avaliacao.nivel_atual!),
        fonte_avaliacao: avaliacao.fonte_avaliacao!,
        evidencias: avaliacao.evidencias,
        data_avaliacao: new Date().toISOString().split('T')[0],
        avaliador_id: perfilUsuario?.id
      };
    }
  }), [perfilUsuario]);

  // Carregar competências
  const carregarCompetencias = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoCompetencias(true);
    setErroCompetencias(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoCompetencias(false);
        setErroCompetencias('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 5000);

    try {
      const competenciasData = await apiMock.obterCompetencias();
      if (montadoRef.current) {
        setCompetencias(competenciasData);
      }
    } catch (error) {
      console.error('Erro ao carregar competências:', error);
      if (montadoRef.current) {
        setErroCompetencias('Falha ao carregar competências. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoCompetencias(false);
      }
    }
  }, [apiMock]);

  // Carregar mapa de competências
  const carregarMapaCompetencias = useCallback(async (colaboradorId?: string) => {
    if (!montadoRef.current) return;
    
    const targetId = colaboradorId || perfilUsuario?.id;
    if (!targetId) return;

    setCarregandoMapa(true);
    setErroMapa(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoMapa(false);
        setErroMapa('Timeout ao carregar mapa de competências');
      }
    }, 8000);

    try {
      const mapaData = await apiMock.obterMapaCompetenciasColaborador(targetId);
      if (montadoRef.current) {
        setMapaCompetencias([mapaData]);
      }
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      if (montadoRef.current) {
        setErroMapa('Falha ao carregar mapa de competências');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoMapa(false);
      }
    }
  }, [apiMock, perfilUsuario]);

  // Efeito inicial
  useEffect(() => {
    carregarCompetencias();
    if (perfilUsuario) {
      carregarMapaCompetencias();
    }
  }, [carregarCompetencias, carregarMapaCompetencias, perfilUsuario]);

  // Filtrar competências
  const competenciasFiltradas = useMemo(() => {
    return competencias.filter(comp => {
      const matchTipo = filtroTipo === 'todos' || comp.tipo === filtroTipo;
      const matchCategoria = filtroCategoria === 'todos' || comp.categoria === filtroCategoria;
      const matchBusca = termoBusca === '' || 
        comp.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        comp.descricao.toLowerCase().includes(termoBusca.toLowerCase());
      
      return matchTipo && matchCategoria && matchBusca;
    });
  }, [competencias, filtroTipo, filtroCategoria, termoBusca]);

  // Handlers para modais
  const handleVerDetalhesCompetencia = useCallback((competencia: Competencia) => {
    setCompetenciaDetalhes(competencia);
    setModalDetalhesAberto(true);
  }, []);

  const handleIniciarAvaliacao = useCallback((competenciaId: string) => {
    const competencia = competencias.find(c => c.id === competenciaId);
    if (competencia && perfilUsuario) {
      setAvaliacaoEmAndamento({
        id: '',
        competencia_id: competenciaId,
        colaborador_id: perfilUsuario.id,
        nivel_atual: 1,
        nivel_requerido: 3,
        gap: 2,
        fonte_avaliacao: 'autoavaliacao',
        data_avaliacao: new Date().toISOString().split('T')[0]
      });
      setModalAvaliacaoAberto(true);
    }
  }, [competencias, perfilUsuario]);

  // Salvar avaliação
  const handleSalvarAvaliacao = useCallback(async () => {
    if (!avaliacaoEmAndamento || !montadoRef.current) return;

    try {
      await apiMock.salvarAvaliacaoCompetencia(avaliacaoEmAndamento);
      if (montadoRef.current) {
        toast.success('Avaliação salva com sucesso');
        setModalAvaliacaoAberto(false);
        setAvaliacaoEmAndamento(null);
        carregarMapaCompetencias();
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Falha ao salvar avaliação');
    }
  }, [avaliacaoEmAndamento, apiMock, carregarMapaCompetencias]);

  // Função para obter cor do gap
  const getCorGap = useCallback((gap: number): string => {
    if (gap === 0) return 'text-green-600';
    if (gap === 1) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Função para obter cor do badge por tipo
  const getCorTipo = useCallback((tipo: string): string => {
    switch (tipo) {
      case 'tecnica': return 'bg-blue-100 text-blue-800';
      case 'comportamental': return 'bg-green-100 text-green-800';
      case 'lideranca': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Estados de loading e erro
  if (carregandoCompetencias && erroCompetencias) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar competências</h3>
        <p className="text-gray-700 mb-4">{erroCompetencias}</p>
        <Button onClick={carregarCompetencias}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LucideIcons.Target className="mr-2 h-5 w-5" />
            Competências Organizacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar competências..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="tecnica">Técnica</SelectItem>
                <SelectItem value="comportamental">Comportamental</SelectItem>
                <SelectItem value="lideranca">Liderança</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Categorias</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="especifica_cargo">Específica do Cargo</SelectItem>
                <SelectItem value="diferencial">Diferencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de competências */}
      {carregandoCompetencias ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : competenciasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <LucideIcons.Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma competência encontrada</h3>
          <p className="text-gray-500">
            {termoBusca || filtroTipo !== 'todos' || filtroCategoria !== 'todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Não há competências cadastradas no sistema'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competenciasFiltradas.map(competencia => (
            <Card key={competencia.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-lg">{competencia.nome}</h3>
                  <Badge className={getCorTipo(competencia.tipo)}>
                    {competencia.tipo}
                  </Badge>
                </div>
                
                <Badge variant="outline" className="mb-3">
                  {competencia.categoria.replace('_', ' ')}
                </Badge>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {competencia.descricao}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerDetalhesCompetencia(competencia)}
                    className="flex-1"
                  >
                    <LucideIcons.Eye className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                  
                  {temPermissao('autoavaliar') && (
                    <Button
                      size="sm"
                      onClick={() => handleIniciarAvaliacao(competencia.id)}
                      className="flex-1"
                    >
                      <LucideIcons.CheckSquare className="mr-2 h-4 w-4" />
                      Avaliar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mapa de competências do colaborador */}
      {mapaCompetencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <LucideIcons.User className="mr-2 h-5 w-5" />
                Meu Mapa de Competências
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Score: {mapaCompetencias[0].score_geral}%
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Gaps Críticos: {mapaCompetencias[0].gaps_criticos}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoMapa ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                  </div>
                ))}
              </div>
            ) : erroMapa ? (
              <div className="text-center py-8">
                <LucideIcons.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{erroMapa}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => carregarMapaCompetencias()}
                  className="mt-2"
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mapaCompetencias[0].competencias.map(avaliacao => {
                  const competencia = competencias.find(c => c.id === avaliacao.competencia_id);
                  const percentual = (avaliacao.nivel_atual / avaliacao.nivel_requerido) * 100;
                  
                  return (
                    <div key={avaliacao.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{competencia?.nome}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {avaliacao.nivel_atual}/{avaliacao.nivel_requerido}
                          </span>
                          {avaliacao.gap > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Gap: {avaliacao.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Progress value={percentual} className="mb-2" />
                      
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Nível atual: {avaliacao.nivel_atual}</span>
                        <span className={getCorGap(avaliacao.gap)}>
                          {avaliacao.gap === 0 ? 'Meta atingida' : `Faltam ${avaliacao.gap} níveis`}
                        </span>
                      </div>
                      
                      {avaliacao.evidencias && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {avaliacao.evidencias}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal detalhes da competência */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LucideIcons.Target className="h-5 w-5" />
              {competenciaDetalhes?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {competenciaDetalhes && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getCorTipo(competenciaDetalhes.tipo)}>
                  {competenciaDetalhes.tipo}
                </Badge>
                <Badge variant="outline">
                  {competenciaDetalhes.categoria.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-gray-700">{competenciaDetalhes.descricao}</p>
              
              <div>
                <h4 className="font-medium mb-3">Níveis de Proficiência:</h4>
                <div className="space-y-3">
                  {competenciaDetalhes.niveis.map(nivel => (
                    <div key={nivel.nivel} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {nivel.nivel}
                      </div>
                      <p className="text-sm text-gray-700 flex-1">{nivel.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhesAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal avaliação de competência */}
      <Dialog open={modalAvaliacaoAberto} onOpenChange={setModalAvaliacaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Competência</DialogTitle>
          </DialogHeader>
          
          {avaliacaoEmAndamento && (
            <div className="space-y-4">
              <div>
                <Label>Competência</Label>
                <p className="text-sm font-medium">
                  {competencias.find(c => c.id === avaliacaoEmAndamento.competencia_id)?.nome}
                </p>
              </div>
              
              <div>
                <Label htmlFor="nivel_atual">Nível Atual (1-5)</Label>
                <Select
                  value={avaliacaoEmAndamento.nivel_atual.toString()}
                  onValueChange={valor => setAvaliacaoEmAndamento(prev => 
                    prev ? { ...prev, nivel_atual: parseInt(valor) } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(nivel => (
                      <SelectItem key={nivel} value={nivel.toString()}>
                        Nível {nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="nivel_requerido">Nível Requerido (1-5)</Label>
                <Select
                  value={avaliacaoEmAndamento.nivel_requerido.toString()}
                  onValueChange={valor => setAvaliacaoEmAndamento(prev => 
                    prev ? { ...prev, nivel_requerido: parseInt(valor) } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(nivel => (
                      <SelectItem key={nivel} value={nivel.toString()}>
                        Nível {nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="evidencias">Evidências/Exemplos</Label>
                <Textarea
                  id="evidencias"
                  placeholder="Descreva exemplos específicos que demonstram esta competência..."
                  value={avaliacaoEmAndamento.evidencias || ''}
                  onChange={e => setAvaliacaoEmAndamento(prev => 
                    prev ? { ...prev, evidencias: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalAvaliacaoAberto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarAvaliacao}>
              Salvar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}