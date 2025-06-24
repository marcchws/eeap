'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Importação das seções específicas
import PesquisasAtivas from './pesquisas-ativas'
import CriarPesquisa from './criar-pesquisa'
import Historico from './historico'
import Analises from './analises'

// Tipos principais
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'colaborador';
  departamento: string;
}

interface DashboardStats {
  pesquisas_ativas: number;
  taxa_resposta_media: number;
  enps_atual: number;
  feedbacks_pendentes: number;
  colaboradores_elegíveis: number;
}

// API Mock
const apiMock = {
  obterUsuarioAtual: async (): Promise<Usuario> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      id: 'user_001',
      nome: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      perfil: 'rh_estrategico',
      departamento: 'Recursos Humanos'
    };
  },

  obterStatsDashboard: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      pesquisas_ativas: 3,
      taxa_resposta_media: 76,
      enps_atual: 42,
      feedbacks_pendentes: 12,
      colaboradores_elegíveis: 2847
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

const obterCorENPS = (valor: number): string => {
  if (valor >= 50) return 'text-green-600';
  if (valor >= 0) return 'text-yellow-600';
  return 'text-red-600';
};

export default function PulseSurveysFeedbackPage() {
  // Estados principais
  const [abaSelecionada, setAbaSelecionada] = useState<'pesquisas' | 'criar' | 'historico' | 'analises'>('pesquisas');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de controle por aba
  const [dadosPesquisas, setDadosPesquisas] = useState(null);
  const [dadosHistorico, setDadosHistorico] = useState(null);
  const [dadosAnalises, setDadosAnalises] = useState(null);
  
  const montadoRef = useRef(true);

  // Inicialização do montadoRef
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregamento inicial obrigatório
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoInicial(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoInicial(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 10000);

    try {
      const [usuarioData, statsData] = await Promise.all([
        apiMock.obterUsuarioAtual(),
        apiMock.obterStatsDashboard()
      ]);

      if (montadoRef.current) {
        setUsuario(usuarioData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar dados. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoInicial(false);
      }
    }
  }, []);

  // Verificação de permissões
  const permissoes = useMemo(() => {
    if (!usuario) return { podeCrear: false, podeAnalisar: false, podeGerenciar: false };

    return {
      podeCrear: ['rh_estrategico', 'rh_operacional'].includes(usuario.perfil),
      podeAnalisar: ['rh_estrategico', 'rh_operacional', 'gestor'].includes(usuario.perfil),
      podeGerenciar: ['rh_estrategico'].includes(usuario.perfil)
    };
  }, [usuario]);

  // Handler para mudança de aba
  const handleMudarAba = useCallback((aba: 'pesquisas' | 'criar' | 'historico' | 'analises') => {
    setAbaSelecionada(aba);
  }, []);

  // Retry para erro de carregamento
  const handleRetry = useCallback(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  // Renderização de estados
  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="bottom-right" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-32">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-lg font-medium mb-2">Carregando Pulse Surveys & Feedback</h3>
              <p className="text-gray-500">Aguarde enquanto preparamos seus dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="bottom-right" />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center max-w-md mx-auto mt-32">
            <LucideIcons.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar módulo</h3>
            <p className="text-gray-700 mb-6">{erro}</p>
            <Button onClick={handleRetry}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pulse Surveys & Feedback</h1>
              <p className="text-gray-500">Sistema de coleta contínua de feedback dos colaboradores</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {usuario?.perfil.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{usuario?.nome}</p>
                <p className="text-xs text-gray-500">{usuario?.departamento}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pesquisas Ativas</p>
                    <p className="text-2xl font-bold">{formatarNumero(stats.pesquisas_ativas)}</p>
                  </div>
                  <LucideIcons.FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Taxa de Resposta</p>
                    <p className="text-2xl font-bold">{formatarPercentual(stats.taxa_resposta_media)}</p>
                  </div>
                  <LucideIcons.TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">eNPS Atual</p>
                    <p className={`text-2xl font-bold ${obterCorENPS(stats.enps_atual)}`}>
                      {stats.enps_atual}
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
                    <p className="text-sm font-medium text-gray-500">Feedbacks Pendentes</p>
                    <p className="text-2xl font-bold">{formatarNumero(stats.feedbacks_pendentes)}</p>
                  </div>
                  <LucideIcons.MessageSquare className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Colaboradores Elegíveis</p>
                    <p className="text-2xl font-bold">{formatarNumero(stats.colaboradores_elegíveis)}</p>
                  </div>
                  <LucideIcons.Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Conteúdo Principal com Abas */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={abaSelecionada} onValueChange={handleMudarAba} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pesquisas" className="flex items-center space-x-2">
              <LucideIcons.FileText className="h-4 w-4" />
              <span>Pesquisas Ativas</span>
            </TabsTrigger>
            
            {permissoes.podeCrear && (
              <TabsTrigger value="criar" className="flex items-center space-x-2">
                <LucideIcons.Plus className="h-4 w-4" />
                <span>Criar Pesquisa</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="historico" className="flex items-center space-x-2">
              <LucideIcons.Archive className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
            
            {permissoes.podeAnalisar && (
              <TabsTrigger value="analises" className="flex items-center space-x-2">
                <LucideIcons.BarChart3 className="h-4 w-4" />
                <span>Análises</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pesquisas" className="mt-6">
            <PesquisasAtivas 
              usuario={usuario}
              permissoes={permissoes}
              onDadosCarregados={setDadosPesquisas}
            />
          </TabsContent>

          {permissoes.podeCrear && (
            <TabsContent value="criar" className="mt-6">
              <CriarPesquisa 
                usuario={usuario}
                permissoes={permissoes}
                onPesquisaCriada={() => {
                  setAbaSelecionada('pesquisas');
                  toast.success('Pesquisa criada com sucesso!');
                }}
              />
            </TabsContent>
          )}

          <TabsContent value="historico" className="mt-6">
            <Historico 
              usuario={usuario}
              permissoes={permissoes}
              onDadosCarregados={setDadosHistorico}
            />
          </TabsContent>

          {permissoes.podeAnalisar && (
            <TabsContent value="analises" className="mt-6">
              <Analises 
                usuario={usuario}
                permissoes={permissoes}
                onDadosCarregados={setDadosAnalises}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}