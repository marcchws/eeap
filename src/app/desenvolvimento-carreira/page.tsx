'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Importação das seções
import CompetenciasSection from './competencias'
import PlanosSection from './planos'
import OportunidadesSection from './oportunidades'
import SucessaoSection from './sucessao'

// Tipos principais
interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  tipo_perfil: 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'colaborador' | 'lideranca';
  equipe_ids?: string[];
}

interface MetricasGerais {
  total_colaboradores: number;
  high_potentials: number;
  planos_ativos: number;
  oportunidades_abertas: number;
  posicoes_criticas_cobertas: number;
  taxa_desenvolvimento: number;
  roi_medio: number;
}

type AbaSelecionada = 'competencias' | 'planos' | 'oportunidades' | 'sucessao';

export default function DesenvolvimentoCarreiraPage() {
  // Estados principais
  const [abaSelecionada, setAbaSelecionada] = useState<AbaSelecionada>('competencias');
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [metricasGerais, setMetricasGerais] = useState<MetricasGerais | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Ref para controle de montagem
  const montadoRef = useRef(true);
  
  // Inicialização do montadoRef
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Mock do perfil do usuário baseado no contexto
  const apiMock = useMemo(() => ({
    async obterPerfilUsuario(): Promise<PerfilUsuario> {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        id: 'user-001',
        nome: 'Ana Silva Santos',
        cargo: 'Gerente de RH',
        departamento: 'Recursos Humanos',
        tipo_perfil: 'rh_estrategico',
        equipe_ids: ['rh-001', 'rh-002', 'rh-003']
      };
    },

    async obterMetricasGerais(): Promise<MetricasGerais> {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        total_colaboradores: 15000,
        high_potentials: 450,
        planos_ativos: 2800,
        oportunidades_abertas: 34,
        posicoes_criticas_cobertas: 78,
        taxa_desenvolvimento: 82,
        roi_medio: 285
      };
    }
  }), []);

  // Carregar perfil do usuário
  const carregarPerfilUsuario = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoPerfil(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoPerfil(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 5000);

    try {
      const perfil = await apiMock.obterPerfilUsuario();
      if (montadoRef.current) {
        setPerfilUsuario(perfil);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar dados do usuário. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoPerfil(false);
      }
    }
  }, [apiMock]);

  // Carregar métricas gerais
  const carregarMetricasGerais = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoMetricas(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoMetricas(false);
        toast.error('Timeout ao carregar métricas');
      }
    }, 8000);

    try {
      const metricas = await apiMock.obterMetricasGerais();
      if (montadoRef.current) {
        setMetricasGerais(metricas);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      if (montadoRef.current) {
        toast.error('Falha ao carregar métricas do dashboard');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoMetricas(false);
      }
    }
  }, [apiMock]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarPerfilUsuario();
    carregarMetricasGerais();
  }, [carregarPerfilUsuario, carregarMetricasGerais]);

  // Handler para mudança de aba
  const handleMudarAba = useCallback((aba: AbaSelecionada) => {
    setAbaSelecionada(aba);
    toast.info(`Navegando para ${aba.charAt(0).toUpperCase() + aba.slice(1)}`);
  }, []);

  // Formatação de números
  const formatarNumero = useCallback((numero: number): string => {
    if (numero >= 1000) {
      return `${(numero / 1000).toFixed(1)}k`;
    }
    return numero.toString();
  }, []);

  // Verificar permissões
  const temPermissao = useCallback((acao: string): boolean => {
    if (!perfilUsuario) return false;
    
    const permissoes = {
      'rh_estrategico': ['visualizar', 'configurar', 'analisar', 'aprovar'],
      'rh_operacional': ['visualizar', 'gerenciar', 'coordenar'],
      'gestor': ['visualizar_equipe', 'avaliar', 'aprovar_planos'],
      'colaborador': ['visualizar_proprio', 'candidatar', 'autoavaliar'],
      'lideranca': ['visualizar', 'aprovar', 'mentorear']
    };
    
    return permissoes[perfilUsuario.tipo_perfil]?.includes(acao) || false;
  }, [perfilUsuario]);

  // Definição das abas disponíveis
  const abasDisponiveis = useMemo(() => {
    if (!perfilUsuario) return [];
    
    const todasAbas = [
      {
        id: 'competencias' as AbaSelecionada,
        nome: 'Competências',
        icone: LucideIcons.Target,
        descricao: 'Mapeamento e avaliação 360°'
      },
      {
        id: 'planos' as AbaSelecionada,
        nome: 'Planos',
        icone: LucideIcons.BookOpen,
        descricao: 'Desenvolvimento personalizado'
      },
      {
        id: 'oportunidades' as AbaSelecionada,
        nome: 'Oportunidades',
        icone: LucideIcons.Briefcase,
        descricao: 'Marketplace interno'
      },
      {
        id: 'sucessao' as AbaSelecionada,
        nome: 'Sucessão',
        icone: LucideIcons.Users,
        descricao: 'Pipeline de talentos'
      }
    ];

    // Filtrar baseado em permissões
    return todasAbas.filter(aba => {
      switch (aba.id) {
        case 'sucessao':
          return ['rh_estrategico', 'lideranca'].includes(perfilUsuario.tipo_perfil);
        default:
          return true;
      }
    });
  }, [perfilUsuario]);

  // Loading inicial
  if (carregandoPerfil || erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="bottom-right" />
        
        {carregandoPerfil && (
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Carregando Módulo de Desenvolvimento</h3>
            <p className="text-gray-500">Inicializando ambiente...</p>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center max-w-md">
            <LucideIcons.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro no Carregamento</h3>
            <p className="text-gray-700 mb-4">{erro}</p>
            <Button onClick={carregarPerfilUsuario}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      {/* Header com informações do usuário */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Desenvolvimento & Carreira
              </h1>
              <p className="text-gray-500">
                {perfilUsuario?.nome} • {perfilUsuario?.cargo}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {perfilUsuario?.tipo_perfil.replace('_', ' ').toUpperCase()}
              </Badge>
              
              {temPermissao('configurar') && (
                <Button variant="outline" size="sm">
                  <LucideIcons.Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de métricas (apenas para perfis estratégicos) */}
      {['rh_estrategico', 'lideranca'].includes(perfilUsuario?.tipo_perfil || '') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {carregandoMetricas ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : metricasGerais ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Colaboradores</p>
                    <p className="text-2xl font-bold">{formatarNumero(metricasGerais.total_colaboradores)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">High Potentials</p>
                    <p className="text-2xl font-bold text-green-600">{metricasGerais.high_potentials}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Planos Ativos</p>
                    <p className="text-2xl font-bold text-blue-600">{formatarNumero(metricasGerais.planos_ativos)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Oportunidades</p>
                    <p className="text-2xl font-bold text-purple-600">{metricasGerais.oportunidades_abertas}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Sucessão (%)</p>
                    <p className="text-2xl font-bold text-orange-600">{metricasGerais.posicoes_criticas_cobertas}%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">ROI Médio (%)</p>
                    <p className="text-2xl font-bold text-green-600">{metricasGerais.roi_medio}%</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Navegação por abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {abasDisponiveis.map((aba) => {
              const IconeAba = aba.icone;
              const ativo = abaSelecionada === aba.id;
              
              return (
                <button
                  key={aba.id}
                  onClick={() => handleMudarAba(aba.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${ativo 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconeAba className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${ativo ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className="text-left">
                    <div>{aba.nome}</div>
                    <div className="text-xs text-gray-400">{aba.descricao}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das seções */}
        <div className="pb-8">
          {abaSelecionada === 'competencias' && (
            <CompetenciasSection 
              perfilUsuario={perfilUsuario}
              temPermissao={temPermissao}
            />
          )}
          
          {abaSelecionada === 'planos' && (
            <PlanosSection 
              perfilUsuario={perfilUsuario}
              temPermissao={temPermissao}
            />
          )}
          
          {abaSelecionada === 'oportunidades' && (
            <OportunidadesSection 
              perfilUsuario={perfilUsuario}
              temPermissao={temPermissao}
            />
          )}
          
          {abaSelecionada === 'sucessao' && (
            <SucessaoSection 
              perfilUsuario={perfilUsuario}
              temPermissao={temPermissao}
            />
          )}
        </div>
      </div>
    </div>
  );
}