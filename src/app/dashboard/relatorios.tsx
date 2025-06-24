'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

// Tipos
interface Usuario {
  id: string;
  perfil: 'executivo' | 'chro' | 'gestor';
}

interface ConfiguracaoRelatorio {
  tipo: 'executivo' | 'detalhado' | 'personalizado';
  formato: 'pdf' | 'excel' | 'powerpoint';
  periodo: string;
  departamentos: string[];
  metricas_incluidas: string[];
  incluir_graficos: boolean;
  incluir_recomendacoes: boolean;
  observacoes: string;
}

interface RelatorioGerado {
  id: string;
  nome: string;
  tipo: string;
  formato: string;
  data_geracao: string;
  status: 'gerando' | 'concluido' | 'erro';
  tamanho_arquivo: string;
  url_download?: string;
  usuario_gerador: string;
}

interface Props {
  usuario?: Usuario;
}

// API Mock
const apiMock = {
  gerarRelatorio: async (config: ConfiguracaoRelatorio): Promise<RelatorioGerado> => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const id = `rel_${Date.now()}`;
    const agora = new Date().toISOString();
    
    return {
      id,
      nome: `Relatório ${config.tipo} - ${config.formato.toUpperCase()}`,
      tipo: config.tipo,
      formato: config.formato,
      data_geracao: agora,
      status: 'concluido',
      tamanho_arquivo: '2.4 MB',
      url_download: `/downloads/relatorio_${id}.${config.formato}`,
      usuario_gerador: 'Ana Silva'
    };
  },
  
  obterHistoricoRelatorios: async (): Promise<RelatorioGerado[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        nome: 'Relatório Executivo - PDF',
        tipo: 'executivo',
        formato: 'pdf',
        data_geracao: '2024-06-22T14:30:00',
        status: 'concluido',
        tamanho_arquivo: '1.8 MB',
        url_download: '/downloads/relatorio_1.pdf',
        usuario_gerador: 'Ana Silva'
      },
      {
        id: '2',
        nome: 'Análise Detalhada - Excel',
        tipo: 'detalhado',
        formato: 'excel',
        data_geracao: '2024-06-21T09:15:00',
        status: 'concluido',
        tamanho_arquivo: '3.2 MB',
        url_download: '/downloads/relatorio_2.xlsx',
        usuario_gerador: 'Carlos Santos'
      },
      {
        id: '3',
        nome: 'Apresentação Mensal - PowerPoint',
        tipo: 'executivo',
        formato: 'powerpoint',
        data_geracao: '2024-06-20T16:45:00',
        status: 'concluido',
        tamanho_arquivo: '4.1 MB',
        url_download: '/downloads/relatorio_3.pptx',
        usuario_gerador: 'Ana Silva'
      },
      {
        id: '4',
        nome: 'Relatório Personalizado - PDF',
        tipo: 'personalizado',
        formato: 'pdf',
        data_geracao: '2024-06-19T11:20:00',
        status: 'erro',
        tamanho_arquivo: '-',
        usuario_gerador: 'Maria Oliveira'
      }
    ];
  }
};

// Funções utilitárias
const formatarDataHora = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

const obterIconeFormato = (formato: string) => {
  switch (formato) {
    case 'pdf': return LucideIcons.FileText;
    case 'excel': return LucideIcons.FileSpreadsheet;
    case 'powerpoint': return LucideIcons.Presentation;
    default: return LucideIcons.File;
  }
};

const obterCorStatus = (status: string): string => {
  switch (status) {
    case 'concluido': return 'text-green-600 bg-green-50';
    case 'gerando': return 'text-blue-600 bg-blue-50';
    case 'erro': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default function Relatorios({ usuario }: Props) {
  // Estados
  const [configuracao, setConfiguracao] = useState<ConfiguracaoRelatorio>({
    tipo: 'executivo',
    formato: 'pdf',
    periodo: 'ultimo_mes',
    departamentos: ['todos'],
    metricas_incluidas: ['enps', 'turnover', 'engajamento'],
    incluir_graficos: true,
    incluir_recomendacoes: true,
    observacoes: ''
  });
  
  const [historico, setHistorico] = useState<RelatorioGerado[]>([]);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [relatorioGerado, setRelatorioGerado] = useState<RelatorioGerado | null>(null);
  
  const montadoRef = useRef(true);
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);
  
  // Carregar histórico
  const carregarHistorico = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoHistorico(true);
    setErroHistorico(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoHistorico(false);
        setErroHistorico('Tempo excedido ao carregar histórico.');
      }
    }, 5000);
    
    try {
      const dados = await apiMock.obterHistoricoRelatorios();
      if (montadoRef.current) {
        setHistorico(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      if (montadoRef.current) {
        setErroHistorico('Falha ao carregar histórico de relatórios.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoHistorico(false);
      }
    }
  }, []);
  
  // Carregar histórico ao montar
  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);
  
  // Handler para mudança de configuração
  const handleConfiguracaoChange = useCallback((campo: keyof ConfiguracaoRelatorio, valor: any) => {
    setConfiguracao(prev => ({ ...prev, [campo]: valor }));
  }, []);
  
  // Handler para toggle de departamentos
  const handleDepartamentoToggle = useCallback((departamento: string) => {
    setConfiguracao(prev => {
      const novos = prev.departamentos.includes(departamento)
        ? prev.departamentos.filter(d => d !== departamento)
        : [...prev.departamentos.filter(d => d !== 'todos'), departamento];
      
      // Se não há departamentos selecionados, selecionar 'todos'
      if (novos.length === 0) {
        return { ...prev, departamentos: ['todos'] };
      }
      
      return { ...prev, departamentos: novos };
    });
  }, []);
  
  // Handler para toggle de métricas
  const handleMetricaToggle = useCallback((metrica: string) => {
    setConfiguracao(prev => {
      const novas = prev.metricas_incluidas.includes(metrica)
        ? prev.metricas_incluidas.filter(m => m !== metrica)
        : [...prev.metricas_incluidas, metrica];
      
      return { ...prev, metricas_incluidas: novas };
    });
  }, []);
  
  // Gerar relatório
  const handleGerarRelatorio = useCallback(async () => {
    if (!montadoRef.current) return;
    
    // Validação básica
    if (configuracao.metricas_incluidas.length === 0) {
      toast.error('Selecione ao menos uma métrica para incluir no relatório');
      return;
    }
    
    setGerandoRelatorio(true);
    setRelatorioGerado(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setGerandoRelatorio(false);
        toast.error('Tempo excedido ao gerar relatório. Tente novamente.');
      }
    }, 10000);
    
    try {
      const relatorio = await apiMock.gerarRelatorio(configuracao);
      if (montadoRef.current) {
        setRelatorioGerado(relatorio);
        toast.success('Relatório gerado com sucesso!');
        
        // Atualizar histórico
        setHistorico(prev => [relatorio, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      if (montadoRef.current) {
        toast.error('Falha ao gerar relatório. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setGerandoRelatorio(false);
      }
    }
  }, [configuracao]);
  
  // Simular download
  const handleDownload = useCallback((relatorio: RelatorioGerado) => {
    if (relatorio.status !== 'concluido') {
      toast.error('Relatório não está disponível para download');
      return;
    }
    
    toast.success(`Download iniciado: ${relatorio.nome}`);
    // Em uma implementação real, seria um link real ou chamada à API
  }, []);
  
  // Validação de configuração
  const configuracaoValida = useMemo(() => {
    return configuracao.metricas_incluidas.length > 0;
  }, [configuracao]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Relatórios</h2>
          <p className="text-gray-600">Gere e baixe relatórios personalizados</p>
        </div>
      </div>
      
      {/* Configuração do relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LucideIcons.Settings className="h-5 w-5" />
            <span>Configurar Novo Relatório</span>
          </CardTitle>
          <CardDescription>
            Configure as opções para gerar um relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo e formato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select
                value={configuracao.tipo}
                onValueChange={(valor) => handleConfiguracaoChange('tipo', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executivo">Executivo</SelectItem>
                  <SelectItem value="detalhado">Detalhado</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {configuracao.tipo === 'executivo' && 'Resumo das principais métricas para liderança'}
                {configuracao.tipo === 'detalhado' && 'Análise completa com dados granulares'}
                {configuracao.tipo === 'personalizado' && 'Relatório com configurações específicas'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="formato">Formato</Label>
              <Select
                value={configuracao.formato}
                onValueChange={(valor) => handleConfiguracaoChange('formato', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="powerpoint">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Período */}
          <div>
            <Label htmlFor="periodo">Período</Label>
            <Select
              value={configuracao.periodo}
              onValueChange={(valor) => handleConfiguracaoChange('periodo', valor)}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                <SelectItem value="ultimo_trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ultimo_semestre">Último Semestre</SelectItem>
                <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                <SelectItem value="personalizado">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Departamentos */}
          <div>
            <Label>Departamentos</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {[
                { id: 'todos', nome: 'Todos os Departamentos' },
                { id: 'tecnologia', nome: 'Tecnologia' },
                { id: 'vendas', nome: 'Vendas' },
                { id: 'marketing', nome: 'Marketing' },
                { id: 'rh', nome: 'Recursos Humanos' },
                { id: 'financeiro', nome: 'Financeiro' },
                { id: 'produto', nome: 'Produto & Design' }
              ].map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept.id}`}
                    checked={configuracao.departamentos.includes(dept.id)}
                    onCheckedChange={() => handleDepartamentoToggle(dept.id)}
                  />
                  <Label htmlFor={`dept-${dept.id}`} className="text-sm">
                    {dept.nome}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Métricas */}
          <div>
            <Label>Métricas a Incluir</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {[
                { id: 'enps', nome: 'eNPS' },
                { id: 'turnover', nome: 'Taxa de Turnover' },
                { id: 'engajamento', nome: 'Score de Engajamento' },
                { id: 'colaboradores_risco', nome: 'Colaboradores em Risco' },
                { id: 'tempo_permanencia', nome: 'Tempo de Permanência' },
                { id: 'promocao_interna', nome: 'Promoção Interna' }
              ].map((metrica) => (
                <div key={metrica.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metrica-${metrica.id}`}
                    checked={configuracao.metricas_incluidas.includes(metrica.id)}
                    onCheckedChange={() => handleMetricaToggle(metrica.id)}
                  />
                  <Label htmlFor={`metrica-${metrica.id}`} className="text-sm">
                    {metrica.nome}
                  </Label>
                </div>
              ))}
            </div>
            {configuracao.metricas_incluidas.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Selecione ao menos uma métrica
              </p>
            )}
          </div>
          
          {/* Opções adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir_graficos"
                checked={configuracao.incluir_graficos}
                onCheckedChange={(checked) => handleConfiguracaoChange('incluir_graficos', checked)}
              />
              <Label htmlFor="incluir_graficos">Incluir Gráficos</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir_recomendacoes"
                checked={configuracao.incluir_recomendacoes}
                onCheckedChange={(checked) => handleConfiguracaoChange('incluir_recomendacoes', checked)}
              />
              <Label htmlFor="incluir_recomendacoes">Incluir Recomendações</Label>
            </div>
          </div>
          
          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações ou contexto específico para este relatório..."
              value={configuracao.observacoes}
              onChange={(e) => handleConfiguracaoChange('observacoes', e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Botão de gerar */}
          <div className="flex justify-end">
            <Button
              onClick={handleGerarRelatorio}
              disabled={gerandoRelatorio || !configuracaoValida}
              className="min-w-[150px]"
            >
              {gerandoRelatorio ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <LucideIcons.Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Relatório recém-gerado */}
      {relatorioGerado && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <LucideIcons.CheckCircle className="h-5 w-5" />
              <span>Relatório Gerado com Sucesso!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{relatorioGerado.nome}</h3>
                <p className="text-sm text-gray-600">
                  Gerado em {formatarDataHora(relatorioGerado.data_geracao)} • {relatorioGerado.tamanho_arquivo}
                </p>
              </div>
              <Button onClick={() => handleDownload(relatorioGerado)}>
                <LucideIcons.Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Histórico de relatórios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <LucideIcons.History className="h-5 w-5" />
                <span>Histórico de Relatórios</span>
              </CardTitle>
              <CardDescription>
                Acesse relatórios gerados anteriormente
              </CardDescription>
            </div>
            <Button variant="outline" onClick={carregarHistorico}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {carregandoHistorico ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  <div className="w-24 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : erroHistorico ? (
            <div className="text-center py-8">
              <LucideIcons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao Carregar</h3>
              <p className="text-gray-600 mb-6">{erroHistorico}</p>
              <Button onClick={carregarHistorico}>Tentar Novamente</Button>
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12">
              <LucideIcons.FileText className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium mb-2">Nenhum Relatório Encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Você ainda não gerou nenhum relatório. Use o formulário acima para criar seu primeiro relatório.
              </p>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <LucideIcons.Plus className="mr-2 h-4 w-4" />
                Gerar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((relatorio) => {
                const IconeFormato = obterIconeFormato(relatorio.formato);
                
                return (
                  <div key={relatorio.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconeFormato className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{relatorio.nome}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatarDataHora(relatorio.data_geracao)}</span>
                          <span>•</span>
                          <span>Por {relatorio.usuario_gerador}</span>
                          {relatorio.tamanho_arquivo !== '-' && (
                            <>
                              <span>•</span>
                              <span>{relatorio.tamanho_arquivo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={obterCorStatus(relatorio.status)}>
                        {relatorio.status === 'concluido' && 'Concluído'}
                        {relatorio.status === 'gerando' && 'Gerando'}
                        {relatorio.status === 'erro' && 'Erro'}
                      </Badge>
                      
                      {relatorio.status === 'concluido' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(relatorio)}
                        >
                          <LucideIcons.Download className="mr-2 h-3 w-3" />
                          Baixar
                        </Button>
                      ) : relatorio.status === 'gerando' ? (
                        <Button variant="outline" size="sm" disabled>
                          <LucideIcons.Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Gerando
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.error('Não foi possível baixar este relatório')}
                        >
                          <LucideIcons.AlertCircle className="mr-2 h-3 w-3" />
                          Erro
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}