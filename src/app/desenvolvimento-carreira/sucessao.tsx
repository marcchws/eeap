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
interface PosicaoCritica {
  id: string;
  cargo: string;
  departamento: string;
  titular_atual: string;
  titular_id: string;
  criticidade: 'baixa' | 'media' | 'alta' | 'critica';
  prazo_sucessao: 'imediata' | '6m' | '1a' | '2a+';
  successores: Sucessor[];
  gaps_principais: string[];
  status_cobertura: 'descoberta' | 'parcial' | 'coberta' | 'excessiva';
  plano_transicao?: string;
  ultima_atualizacao: string;
}

interface Sucessor {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  cargo_atual: string;
  score_prontidao: number; // 0-100
  tempo_preparacao: string; // "imediato", "6m", "1a", "2a+"
  gaps_competencias: string[];
  plano_desenvolvimento_id?: string;
  prioridade: 'primario' | 'secundario' | 'terceiro';
  status: 'identificado' | 'em_desenvolvimento' | 'pronto' | 'descartado';
}

interface AnaliseSuccessao {
  total_posicoes: number;
  descobertas: number;
  parcialmente_cobertas: number;
  totalmente_cobertas: number;
  risco_critico: number;
  sucessores_prontos: number;
  sucessores_desenvolvimento: number;
  tempo_medio_preparacao: number;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  tipo_perfil: 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'colaborador' | 'lideranca';
  equipe_ids?: string[];
}

interface SucessaoSectionProps {
  perfilUsuario: PerfilUsuario | null;
  temPermissao: (acao: string) => boolean;
}

export default function SucessaoSection({ perfilUsuario, temPermissao }: SucessaoSectionProps) {
  // Estados principais
  const [posicoesCriticas, setPosicoesCriticas] = useState<PosicaoCritica[]>([]);
  const [analiseSuccessao, setAnaliseSuccessao] = useState<AnaliseSuccessao | null>(null);
  const [posicaoSelecionada, setPosicaoSelecionada] = useState<PosicaoCritica | null>(null);
  
  // Estados de controle
  const [carregandoPosicoes, setCarregandoPosicoes] = useState(true);
  const [carregandoAnalise, setCarregandoAnalise] = useState(true);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroPosicoes, setErroPosicoes] = useState<string | null>(null);
  
  // Estados de modais
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalAdicionarSucessorAberto, setModalAdicionarSucessorAberto] = useState(false);
  const [modalNovaPosicaoAberto, setModalNovaPosicaoAberto] = useState(false);
  
  // Estados de formulários
  const [novoSucessor, setNovoSucessor] = useState<Partial<Sucessor> | null>(null);
  const [novaPosicao, setNovaPosicao] = useState<Partial<PosicaoCritica> | null>(null);
  
  // Estados de filtros e visualização
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCriticidade, setFiltroCriticidade] = useState('todos');
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Ref para controle de montagem
  const montadoRef = useRef(true);
  
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // Mock API para sucessão
  const apiMock = useMemo(() => ({
    async obterPosicoesCriticas(): Promise<PosicaoCritica[]> {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return [
        {
          id: 'pos-001',
          cargo: 'CTO - Chief Technology Officer',
          departamento: 'Tecnologia',
          titular_atual: 'Roberto Silva',
          titular_id: 'user-cto-001',
          criticidade: 'critica',
          prazo_sucessao: '1a',
          status_cobertura: 'parcial',
          gaps_principais: ['Visão Estratégica de TI', 'Liderança Executiva'],
          ultima_atualizacao: '2024-06-20',
          successores: [
            {
              id: 'suc-001',
              colaborador_id: 'dev-lead-001',
              colaborador_nome: 'Ana Santos',
              cargo_atual: 'Tech Lead',
              score_prontidao: 75,
              tempo_preparacao: '1a',
              gaps_competencias: ['Visão Estratégica', 'Gestão Orçamentária'],
              prioridade: 'primario',
              status: 'em_desenvolvimento',
              plano_desenvolvimento_id: 'plano-tech-lead'
            },
            {
              id: 'suc-002',
              colaborador_id: 'arch-001',
              colaborador_nome: 'Carlos Mendes',
              cargo_atual: 'Arquiteto de Soluções',
              score_prontidao: 65,
              tempo_preparacao: '2a+',
              gaps_competencias: ['Liderança de Pessoas', 'Negociação'],
              prioridade: 'secundario',
              status: 'identificado'
            }
          ]
        },
        {
          id: 'pos-002',
          cargo: 'CHRO - Chief Human Resources Officer',
          departamento: 'Recursos Humanos',
          titular_atual: 'Mariana Costa',
          titular_id: 'user-chro-001',
          criticidade: 'alta',
          prazo_sucessao: '2a+',
          status_cobertura: 'coberta',
          gaps_principais: [],
          ultima_atualizacao: '2024-06-18',
          successores: [
            {
              id: 'suc-003',
              colaborador_id: perfilUsuario?.id || 'user-001',
              colaborador_nome: perfilUsuario?.nome || 'Ana Silva Santos',
              cargo_atual: 'Gerente de RH',
              score_prontidao: 85,
              tempo_preparacao: '1a',
              gaps_competencias: ['Experiência Internacional'],
              prioridade: 'primario',
              status: 'pronto',
              plano_desenvolvimento_id: 'plano-chro-prep'
            },
            {
              id: 'suc-004',
              colaborador_id: 'hr-dir-001',
              colaborador_nome: 'Pedro Oliveira',
              cargo_atual: 'Diretor de Talentos',
              score_prontidao: 80,
              tempo_preparacao: '6m',
              gaps_competencias: ['Transformação Digital'],
              prioridade: 'secundario',
              status: 'pronto'
            }
          ]
        },
        {
          id: 'pos-003',
          cargo: 'VP Produtos',
          departamento: 'Produtos',
          titular_atual: 'Julia Rodrigues',
          titular_id: 'user-vp-001',
          criticidade: 'media',
          prazo_sucessao: '6m',
          status_cobertura: 'descoberta',
          gaps_principais: ['Product Leadership', 'Visão de Mercado', 'Data Science'],
          ultima_atualizacao: '2024-06-15',
          successores: []
        },
        {
          id: 'pos-004',
          cargo: 'Diretor Financeiro',
          departamento: 'Financeiro',
          titular_atual: 'Marcos Lima',
          titular_id: 'user-cfo-001',
          criticidade: 'alta',
          prazo_sucessao: 'imediata',
          status_cobertura: 'parcial',
          gaps_principais: ['Controladoria Avançada'],
          ultima_atualizacao: '2024-06-22',
          successores: [
            {
              id: 'suc-005',
              colaborador_id: 'fin-mgr-001',
              colaborador_nome: 'Luciana Ferreira',
              cargo_atual: 'Gerente Financeiro',
              score_prontidao: 70,
              tempo_preparacao: '6m',
              gaps_competencias: ['Auditoria Externa', 'Fusões e Aquisições'],
              prioridade: 'primario',
              status: 'em_desenvolvimento'
            }
          ]
        }
      ];
    },

    async obterAnaliseSuccessao(): Promise<AnaliseSuccessao> {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        total_posicoes: 4,
        descobertas: 1,
        parcialmente_cobertas: 2,
        totalmente_cobertas: 1,
        risco_critico: 2,
        sucessores_prontos: 2,
        sucessores_desenvolvimento: 3,
        tempo_medio_preparacao: 14
      };
    },

    async adicionarSucessor(posicaoId: string, sucessor: Partial<Sucessor>): Promise<Sucessor> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `suc-${Date.now()}`,
        colaborador_id: sucessor.colaborador_id!,
        colaborador_nome: sucessor.colaborador_nome!,
        cargo_atual: sucessor.cargo_atual!,
        score_prontidao: sucessor.score_prontidao!,
        tempo_preparacao: sucessor.tempo_preparacao!,
        gaps_competencias: sucessor.gaps_competencias!,
        prioridade: sucessor.prioridade!,
        status: 'identificado'
      };
    },

    async atualizarScoreSucessor(sucessorId: string, novoScore: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulação de atualização
    },

    async criarPosicaoCritica(posicao: Partial<PosicaoCritica>): Promise<PosicaoCritica> {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        id: `pos-${Date.now()}`,
        cargo: posicao.cargo!,
        departamento: posicao.departamento!,
        titular_atual: posicao.titular_atual!,
        titular_id: posicao.titular_id!,
        criticidade: posicao.criticidade!,
        prazo_sucessao: posicao.prazo_sucessao!,
        status_cobertura: 'descoberta',
        gaps_principais: posicao.gaps_principais || [],
        ultima_atualizacao: new Date().toISOString().split('T')[0],
        successores: []
      };
    }
  }), [perfilUsuario]);

  // Carregar posições críticas
  const carregarPosicoesCriticas = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoPosicoes(true);
    setErroPosicoes(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoPosicoes(false);
        setErroPosicoes('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 10000);

    try {
      const posicoesData = await apiMock.obterPosicoesCriticas();
      if (montadoRef.current) {
        setPosicoesCriticas(posicoesData);
      }
    } catch (error) {
      console.error('Erro ao carregar posições críticas:', error);
      if (montadoRef.current) {
        setErroPosicoes('Falha ao carregar posições críticas. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoPosicoes(false);
      }
    }
  }, [apiMock]);

  // Carregar análise de sucessão
  const carregarAnaliseSuccessao = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoAnalise(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoAnalise(false);
        toast.error('Timeout ao carregar análise');
      }
    }, 8000);

    try {
      const analiseData = await apiMock.obterAnaliseSuccessao();
      if (montadoRef.current) {
        setAnaliseSuccessao(analiseData);
      }
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      if (montadoRef.current) {
        toast.error('Falha ao carregar análise de sucessão');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoAnalise(false);
      }
    }
  }, [apiMock]);

  // Efeito inicial
  useEffect(() => {
    carregarPosicoesCriticas();
    carregarAnaliseSuccessao();
  }, [carregarPosicoesCriticas, carregarAnaliseSuccessao]);

  // Filtrar posições
  const posicoesFiltradas = useMemo(() => {
    return posicoesCriticas.filter(pos => {
      const matchStatus = filtroStatus === 'todos' || pos.status_cobertura === filtroStatus;
      const matchCriticidade = filtroCriticidade === 'todos' || pos.criticidade === filtroCriticidade;
      const matchDepartamento = filtroDepartamento === 'todos' || pos.departamento === filtroDepartamento;
      const matchBusca = termoBusca === '' || 
        pos.cargo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        pos.titular_atual.toLowerCase().includes(termoBusca.toLowerCase());
      
      return matchStatus && matchCriticidade && matchDepartamento && matchBusca;
    });
  }, [posicoesCriticas, filtroStatus, filtroCriticidade, filtroDepartamento, termoBusca]);

  // Handlers
  const handleVerDetalhes = useCallback((posicao: PosicaoCritica) => {
    setPosicaoSelecionada(posicao);
    setModalDetalhesAberto(true);
  }, []);

  const handleAdicionarSucessor = useCallback((posicaoId: string) => {
    setNovoSucessor({
      colaborador_nome: '',
      cargo_atual: '',
      score_prontidao: 50,
      tempo_preparacao: '1a',
      gaps_competencias: [],
      prioridade: 'terceiro'
    });
    setModalAdicionarSucessorAberto(true);
  }, []);

  const handleSalvarSucessor = useCallback(async () => {
    if (!novoSucessor || !posicaoSelecionada || !montadoRef.current) return;

    setSalvandoDados(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvandoDados(false);
        toast.error('Timeout ao salvar sucessor');
      }
    }, 10000);

    try {
      const sucessorSalvo = await apiMock.adicionarSucessor(posicaoSelecionada.id, novoSucessor);
      if (montadoRef.current) {
        setPosicoesCriticas(prev => prev.map(pos => 
          pos.id === posicaoSelecionada.id 
            ? { ...pos, successores: [...pos.successores, sucessorSalvo] }
            : pos
        ));
        toast.success('Sucessor adicionado com sucesso');
        setModalAdicionarSucessorAberto(false);
        setNovoSucessor(null);
      }
    } catch (error) {
      console.error('Erro ao salvar sucessor:', error);
      if (montadoRef.current) {
        toast.error('Falha ao adicionar sucessor');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvandoDados(false);
      }
    }
  }, [novoSucessor, posicaoSelecionada, apiMock]);

  const handleCriarNovaPosicao = useCallback(() => {
    setNovaPosicao({
      departamento: perfilUsuario?.departamento || '',
      criticidade: 'media',
      prazo_sucessao: '1a',
      gaps_principais: []
    });
    setModalNovaPosicaoAberto(true);
  }, [perfilUsuario]);

  // Funções utilitárias
  const formatarData = useCallback((dataString: string): string => {
    if (!dataString) return 'N/A';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return 'Data inválida';
      
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro de formato';
    }
  }, []);

  const getCorCriticidade = useCallback((criticidade: string): string => {
    switch (criticidade) {
      case 'baixa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'critica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getCorStatus = useCallback((status: string): string => {
    switch (status) {
      case 'descoberta': return 'bg-red-100 text-red-800';
      case 'parcial': return 'bg-yellow-100 text-yellow-800';
      case 'coberta': return 'bg-green-100 text-green-800';
      case 'excessiva': return 'bg-blue-100 text-blue-800';
      case 'identificado': return 'bg-gray-100 text-gray-800';
      case 'em_desenvolvimento': return 'bg-blue-100 text-blue-800';
      case 'pronto': return 'bg-green-100 text-green-800';
      case 'descartado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getCorProntidao = useCallback((score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getIconePrazo = useCallback((prazo: string) => {
    switch (prazo) {
      case 'imediata': return LucideIcons.AlertTriangle;
      case '6m': return LucideIcons.Clock;
      case '1a': return LucideIcons.Calendar;
      case '2a+': return LucideIcons.CalendarDays;
      default: return LucideIcons.Clock;
    }
  }, []);

  // Estados de loading e erro
  if (carregandoPosicoes && erroPosicoes) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar pipeline de sucessão</h3>
        <p className="text-gray-700 mb-4">{erroPosicoes}</p>
        <Button onClick={carregarPosicoesCriticas}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Pipeline de Sucessão</h2>
          <p className="text-gray-500">Gestão estratégica de sucessores para posições críticas</p>
        </div>
        
        {temPermissao('criar_posicao') && (
          <Button onClick={handleCriarNovaPosicao}>
            <LucideIcons.Plus className="mr-2 h-4 w-4" />
            Nova Posição Crítica
          </Button>
        )}
      </div>

      {/* Dashboard de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {carregandoAnalise ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : analiseSuccessao ? (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Posições</p>
                <p className="text-2xl font-bold">{analiseSuccessao.total_posicoes}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Descobertas</p>
                <p className="text-2xl font-bold text-red-600">{analiseSuccessao.descobertas}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Parciais</p>
                <p className="text-2xl font-bold text-yellow-600">{analiseSuccessao.parcialmente_cobertas}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Cobertas</p>
                <p className="text-2xl font-bold text-green-600">{analiseSuccessao.totalmente_cobertas}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Risco Crítico</p>
                <p className="text-2xl font-bold text-red-600">{analiseSuccessao.risco_critico}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Prontos</p>
                <p className="text-2xl font-bold text-green-600">{analiseSuccessao.sucessores_prontos}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Desenvolvendo</p>
                <p className="text-2xl font-bold text-blue-600">{analiseSuccessao.sucessores_desenvolvimento}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Tempo Médio</p>
                <p className="text-2xl font-bold">{analiseSuccessao.tempo_medio_preparacao}m</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cargo ou titular..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="descoberta">Descoberta</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="coberta">Coberta</SelectItem>
                <SelectItem value="excessiva">Excessiva</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroCriticidade} onValueChange={setFiltroCriticidade}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
<SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                <SelectItem value="Produtos">Produtos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Estratégia">Estratégia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de posições críticas */}
      {carregandoPosicoes ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-64"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posicoesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <LucideIcons.Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma posição encontrada</h3>
          <p className="text-gray-500 mb-4">
            {termoBusca || filtroStatus !== 'todos' || filtroCriticidade !== 'todos' || filtroDepartamento !== 'todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Não há posições críticas cadastradas'
            }
          </p>
          {temPermissao('criar_posicao') && (
            <Button onClick={handleCriarNovaPosicao}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Criar Primeira Posição
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posicoesFiltradas.map(posicao => {
            const IconePrazo = getIconePrazo(posicao.prazo_sucessao);
            const sucessoresProntos = posicao.successores.filter(s => s.status === 'pronto').length;
            const scoreMediaProntidao = posicao.successores.length > 0 
              ? Math.round(posicao.successores.reduce((acc, s) => acc + s.score_prontidao, 0) / posicao.successores.length)
              : 0;
            
            return (
              <Card key={posicao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{posicao.cargo}</h3>
                      <p className="text-gray-600">{posicao.departamento} • {posicao.titular_atual}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCorCriticidade(posicao.criticidade)}>
                          {posicao.criticidade}
                        </Badge>
                        <Badge className={getCorStatus(posicao.status_cobertura)}>
                          {posicao.status_cobertura}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <IconePrazo className="mr-1 h-4 w-4" />
                          {posicao.prazo_sucessao}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações dos sucessores */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Pipeline de Sucessores</span>
                      <span className="text-sm font-medium">
                        {posicao.successores.length} identificados • {sucessoresProntos} prontos
                      </span>
                    </div>
                    
                    {posicao.successores.length > 0 ? (
                      <div className="space-y-2">
                        {posicao.successores.slice(0, 2).map(sucessor => (
                          <div key={sucessor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                                {sucessor.prioridade === 'primario' ? '1º' : 
                                 sucessor.prioridade === 'secundario' ? '2º' : '3º'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{sucessor.colaborador_nome}</p>
                                <p className="text-xs text-gray-500">{sucessor.cargo_atual}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-medium ${getCorProntidao(sucessor.score_prontidao)}`}>
                                {sucessor.score_prontidao}%
                              </div>
                              <Badge className={getCorStatus(sucessor.status)} variant="outline">
                                {sucessor.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        
                        {posicao.successores.length > 2 && (
                          <p className="text-sm text-gray-500 text-center">
                            +{posicao.successores.length - 2} sucessores adicionais
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded">
                        <LucideIcons.AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhum sucessor identificado</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Gaps principais */}
                  {posicao.gaps_principais.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Gaps Principais:</p>
                      <div className="flex flex-wrap gap-1">
                        {posicao.gaps_principais.map(gap => (
                          <Badge key={gap} variant="destructive" className="text-xs">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Atualizado: {formatarData(posicao.ultima_atualizacao)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDetalhes(posicao)}
                      >
                        <LucideIcons.Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                      
                      {temPermissao('gerenciar_sucessores') && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPosicaoSelecionada(posicao);
                            handleAdicionarSucessor(posicao.id);
                          }}
                        >
                          <LucideIcons.UserPlus className="mr-2 h-4 w-4" />
                          Adicionar Sucessor
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

      {/* Modal detalhes da posição */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>{posicaoSelecionada?.cargo}</div>
              <div className="flex gap-2">
                <Badge className={getCorCriticidade(posicaoSelecionada?.criticidade || '')}>
                  {posicaoSelecionada?.criticidade}
                </Badge>
                <Badge className={getCorStatus(posicaoSelecionada?.status_cobertura || '')}>
                  {posicaoSelecionada?.status_cobertura}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {posicaoSelecionada && (
            <div className="space-y-6">
              {/* Informações da posição */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Departamento</p>
                  <p className="font-medium">{posicaoSelecionada.departamento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Titular Atual</p>
                  <p className="font-medium">{posicaoSelecionada.titular_atual}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prazo de Sucessão</p>
                  <p className="font-medium">{posicaoSelecionada.prazo_sucessao}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                  <p className="font-medium">{formatarData(posicaoSelecionada.ultima_atualizacao)}</p>
                </div>
              </div>

              {/* Gaps principais */}
              {posicaoSelecionada.gaps_principais.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Gaps Principais para Sucessão</h4>
                  <div className="flex flex-wrap gap-2">
                    {posicaoSelecionada.gaps_principais.map(gap => (
                      <Badge key={gap} variant="destructive">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista completa de sucessores */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Sucessores Identificados ({posicaoSelecionada.successores.length})</h4>
                  {temPermissao('gerenciar_sucessores') && (
                    <Button
                      size="sm"
                      onClick={() => handleAdicionarSucessor(posicaoSelecionada.id)}
                    >
                      <LucideIcons.Plus className="mr-2 h-4 w-4" />
                      Adicionar Sucessor
                    </Button>
                  )}
                </div>
                
                {posicaoSelecionada.successores.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <LucideIcons.Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum sucessor identificado para esta posição</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posicaoSelecionada.successores.map(sucessor => (
                      <div key={sucessor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-medium">
                              {sucessor.prioridade === 'primario' ? '1º' : 
                               sucessor.prioridade === 'secundario' ? '2º' : '3º'}
                            </div>
                            <div>
                              <h5 className="font-medium">{sucessor.colaborador_nome}</h5>
                              <p className="text-sm text-gray-600">{sucessor.cargo_atual}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getCorStatus(sucessor.status)}>
                              {sucessor.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Score de Prontidão</p>
                            <div className="flex items-center gap-2">
                              <Progress value={sucessor.score_prontidao} className="flex-1" />
                              <span className={`font-medium ${getCorProntidao(sucessor.score_prontidao)}`}>
                                {sucessor.score_prontidao}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Tempo de Preparação</p>
                            <p className="font-medium">{sucessor.tempo_preparacao}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Prioridade</p>
                            <p className="font-medium">{sucessor.prioridade}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-medium">{sucessor.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        {sucessor.gaps_competencias.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Gaps de Competências:</p>
                            <div className="flex flex-wrap gap-1">
                              {sucessor.gaps_competencias.map(gap => (
                                <Badge key={gap} variant="outline" className="text-xs">
                                  {gap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {sucessor.plano_desenvolvimento_id && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            <p className="text-blue-800">
                              <strong>Plano de Desenvolvimento:</strong> {sucessor.plano_desenvolvimento_id}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plano de transição */}
              {posicaoSelecionada.plano_transicao && (
                <div>
                  <h4 className="font-medium mb-2">Plano de Transição</h4>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">{posicaoSelecionada.plano_transicao}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhesAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal adicionar sucessor */}
      <Dialog open={modalAdicionarSucessorAberto} onOpenChange={setModalAdicionarSucessorAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Sucessor</DialogTitle>
          </DialogHeader>
          
          {novoSucessor && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="colaborador_nome">Nome do Colaborador</Label>
                <Input
                  id="colaborador_nome"
                  value={novoSucessor.colaborador_nome || ''}
                  onChange={e => setNovoSucessor(prev => 
                    prev ? { ...prev, colaborador_nome: e.target.value } : null
                  )}
                  placeholder="Nome completo do colaborador"
                />
              </div>
              
              <div>
                <Label htmlFor="cargo_atual">Cargo Atual</Label>
                <Input
                  id="cargo_atual"
                  value={novoSucessor.cargo_atual || ''}
                  onChange={e => setNovoSucessor(prev => 
                    prev ? { ...prev, cargo_atual: e.target.value } : null
                  )}
                  placeholder="Cargo atual do colaborador"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="score_prontidao">Score de Prontidão (%)</Label>
                  <Input
                    id="score_prontidao"
                    type="number"
                    min="0"
                    max="100"
                    value={novoSucessor.score_prontidao || 50}
                    onChange={e => setNovoSucessor(prev => 
                      prev ? { ...prev, score_prontidao: parseInt(e.target.value) } : null
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tempo_preparacao">Tempo de Preparação</Label>
                  <Select
                    value={novoSucessor.tempo_preparacao}
                    onValueChange={valor => setNovoSucessor(prev => 
                      prev ? { ...prev, tempo_preparacao: valor } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediato">Imediato</SelectItem>
                      <SelectItem value="6m">6 meses</SelectItem>
                      <SelectItem value="1a">1 ano</SelectItem>
                      <SelectItem value="2a+">2+ anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  value={novoSucessor.prioridade}
                  onValueChange={valor => setNovoSucessor(prev => 
                    prev ? { ...prev, prioridade: valor as any } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primario">Primário</SelectItem>
                    <SelectItem value="secundario">Secundário</SelectItem>
                    <SelectItem value="terceiro">Terceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gaps_competencias">Gaps de Competências</Label>
                <Textarea
                  id="gaps_competencias"
                  placeholder="Lista os principais gaps de competências (separados por vírgula)"
                  value={novoSucessor.gaps_competencias?.join(', ') || ''}
                  onChange={e => setNovoSucessor(prev => 
                    prev ? { 
                      ...prev, 
                      gaps_competencias: e.target.value.split(',').map(gap => gap.trim()).filter(gap => gap) 
                    } : null
                  )}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalAdicionarSucessorAberto(false)}
              disabled={salvandoDados}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarSucessor}
              disabled={salvandoDados || !novoSucessor?.colaborador_nome || !novoSucessor?.cargo_atual}
            >
              {salvandoDados ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar Sucessor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal nova posição crítica */}
      <Dialog open={modalNovaPosicaoAberto} onOpenChange={setModalNovaPosicaoAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Posição Crítica</DialogTitle>
          </DialogHeader>
          
          {novaPosicao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo">Cargo/Posição</Label>
                  <Input
                    id="cargo"
                    value={novaPosicao.cargo || ''}
                    onChange={e => setNovaPosicao(prev => 
                      prev ? { ...prev, cargo: e.target.value } : null
                    )}
                    placeholder="Ex: Diretor de Tecnologia"
                  />
                </div>
                
                <div>
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={novaPosicao.departamento || ''}
                    onChange={e => setNovaPosicao(prev => 
                      prev ? { ...prev, departamento: e.target.value } : null
                    )}
                    placeholder="Ex: Tecnologia"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="titular_atual">Titular Atual</Label>
                <Input
                  id="titular_atual"
                  value={novaPosicao.titular_atual || ''}
                  onChange={e => setNovaPosicao(prev => 
                    prev ? { ...prev, titular_atual: e.target.value } : null
                  )}
                  placeholder="Nome do titular atual"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="criticidade">Criticidade</Label>
                  <Select
                    value={novaPosicao.criticidade}
                    onValueChange={valor => setNovaPosicao(prev => 
                      prev ? { ...prev, criticidade: valor as any } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="prazo_sucessao">Prazo de Sucessão</Label>
                  <Select
                    value={novaPosicao.prazo_sucessao}
                    onValueChange={valor => setNovaPosicao(prev => 
                      prev ? { ...prev, prazo_sucessao: valor as any } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediata">Imediata</SelectItem>
                      <SelectItem value="6m">6 meses</SelectItem>
                      <SelectItem value="1a">1 ano</SelectItem>
                      <SelectItem value="2a+">2+ anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="gaps_principais">Gaps Principais</Label>
                <Textarea
                  id="gaps_principais"
                  placeholder="Lista os principais gaps para sucessão (separados por vírgula)"
                  value={novaPosicao.gaps_principais?.join(', ') || ''}
                  onChange={e => setNovaPosicao(prev => 
                    prev ? { 
                      ...prev, 
                      gaps_principais: e.target.value.split(',').map(gap => gap.trim()).filter(gap => gap) 
                    } : null
                  )}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalNovaPosicaoAberto(false)}
              disabled={salvandoDados}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!novaPosicao || !montadoRef.current) return;
                
                setSalvandoDados(true);
                try {
                  const posicaoSalva = await apiMock.criarPosicaoCritica(novaPosicao);
                  if (montadoRef.current) {
                    setPosicoesCriticas(prev => [posicaoSalva, ...prev]);
                    toast.success('Posição crítica criada com sucesso');
                    setModalNovaPosicaoAberto(false);
                    setNovaPosicao(null);
                  }
                } catch (error) {
                  console.error('Erro ao criar posição:', error);
                  if (montadoRef.current) {
                    toast.error('Falha ao criar posição crítica');
                  }
                } finally {
                  if (montadoRef.current) {
                    setSalvandoDados(false);
                  }
                }
              }}
              disabled={salvandoDados || !novaPosicao?.cargo || !novaPosicao?.titular_atual}
            >
              {salvandoDados ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Posição'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}