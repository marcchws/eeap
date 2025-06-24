'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAnalisePredicContext } from './context'

// Tipos específicos
interface AlertaPreditivo {
  id: string
  colaboradorId: string
  colaboradorNome: string
  departamento: string
  cargo: string
  tipoAlerta: 'individual' | 'coletivo' | 'padrao'
  severidade: 'baixa' | 'media' | 'alta' | 'critica'
  scoreAtual: number
  scoreAnterior: number
  dataGeracao: string
  descricao: string
  fatoresIdentificados: string[]
  acoesRecomendadas: string[]
  prazoIntervencao: string
  status: 'novo' | 'em_acao' | 'resolvido' | 'ignorado'
  responsavel?: string
  dataResolucao?: string
  observacoes?: string
}

interface ModalAcaoProps {
  alerta: AlertaPreditivo | null
  isOpen: boolean
  onClose: () => void
  onSalvar: (alertaId: string, acao: string, observacoes: string) => Promise<void>
}

// Componente Modal de Ação
function ModalAcao({ alerta, isOpen, onClose, onSalvar }: ModalAcaoProps) {
  const [acaoSelecionada, setAcaoSelecionada] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const montadoRef = useRef(true)
  
  useEffect(() => {
    montadoRef.current = true
    return () => { montadoRef.current = false }
  }, [])
  
  useEffect(() => {
    if (isOpen && alerta) {
      setAcaoSelecionada('')
      setObservacoes('')
    }
  }, [isOpen, alerta])
  
  const handleSalvar = useCallback(async () => {
    if (!alerta || !acaoSelecionada.trim()) {
      toast.error('Selecione uma ação antes de continuar')
      return
    }
    
    setSalvando(true)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvando(false)
        toast.error('Tempo excedido. Tente novamente.')
      }
    }, 5000)
    
    try {
      await onSalvar(alerta.id, acaoSelecionada, observacoes)
      if (montadoRef.current) {
        toast.success('Ação registrada com sucesso')
        onClose()
      }
    } catch (error) {
      console.error('Erro ao salvar ação:', error)
      if (montadoRef.current) {
        toast.error('Falha ao registrar ação. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setSalvando(false)
      }
    }
  }, [alerta, acaoSelecionada, observacoes, onSalvar, onClose])
  
  if (!alerta) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Ação - {alerta.colaboradorNome}</DialogTitle>
          <DialogDescription>
            Score atual: {alerta.scoreAtual} | Departamento: {alerta.departamento}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Ação Recomendada</label>
            <Select value={acaoSelecionada} onValueChange={setAcaoSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma ação..." />
              </SelectTrigger>
              <SelectContent>
                {alerta.acoesRecomendadas.map((acao, index) => (
                  <SelectItem key={index} value={acao}>
                    {acao}
                  </SelectItem>
                ))}
                <SelectItem value="conversa_desenvolvimento">Conversa de desenvolvimento</SelectItem>
                <SelectItem value="revisao_salarial">Revisão salarial</SelectItem>
                <SelectItem value="mudanca_projeto">Mudança de projeto</SelectItem>
                <SelectItem value="plano_carreira">Discussão de plano de carreira</SelectItem>
                <SelectItem value="melhoria_ambiente">Melhoria do ambiente de trabalho</SelectItem>
                <SelectItem value="acao_personalizada">Ação personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Observações e Detalhes</label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as ações tomadas, próximos passos, prazos, etc..."
              rows={4}
              disabled={salvando}
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Fatores Identificados:</h4>
            <ul className="list-disc list-inside text-sm text-blue-800">
              {alerta.fatoresIdentificados.map((fator, index) => (
                <li key={index}>{fator}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando || !acaoSelecionada.trim()}>
            {salvando ? (
              <>
                <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Registrar Ação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente principal
export default function CentralAlertas({ onAlertasChange }: { onAlertasChange: (count: number) => void }) {
  // Estados
  const [alertas, setAlertas] = useState<AlertaPreditivo[]>([])
  const [alertasFiltrados, setAlertasFiltrados] = useState<AlertaPreditivo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  
  // Filtros
  const [filtroSeveridade, setFiltroSeveridade] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [termoBusca, setTermoBusca] = useState('')
  
  // Modal
  const [modalAcao, setModalAcao] = useState<AlertaPreditivo | null>(null)
  
  // Paginação
  const [pagina, setPagina] = useState(1)
  const itensPorPagina = 10
  
  const montadoRef = useRef(true)
  const { perfilUsuario } = useAnalisePredicContext()
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])
  
  // Funções utilitárias
  const formatarData = useCallback((dataString: string | undefined): string => {
    if (!dataString) return 'N/A'
    
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) return 'Data inválida'
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Erro de formato'
    }
  }, [])
  
  const getSeveridadeCor = useCallback((severidade: string) => {
    const cores = {
      baixa: 'bg-blue-100 text-blue-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800'
    }
    return cores[severidade as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  const getStatusCor = useCallback((status: string) => {
    const cores = {
      novo: 'bg-blue-100 text-blue-800',
      em_acao: 'bg-yellow-100 text-yellow-800',
      resolvido: 'bg-green-100 text-green-800',
      ignorado: 'bg-gray-100 text-gray-800'
    }
    return cores[status as keyof typeof cores] || 'bg-gray-100 text-gray-800'
  }, [])
  
  // API Mock
  const carregarAlertas = useCallback(async () => {
    if (!montadoRef.current) return
    
    setCarregando(true)
    setErro(null)
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false)
        setErro('Tempo de carregamento excedido. Tente novamente.')
      }
    }, 8000)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      if (montadoRef.current) {
        const mockAlertas: AlertaPreditivo[] = [
          {
            id: 'alert_001',
            colaboradorId: 'emp_001',
            colaboradorNome: 'Carlos Silva',
            departamento: 'Tecnologia',
            cargo: 'Desenvolvedor Senior',
            tipoAlerta: 'individual',
            severidade: 'critica',
            scoreAtual: 92,
            scoreAnterior: 65,
            dataGeracao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            descricao: 'Score de risco aumentou drasticamente em 48h',
            fatoresIdentificados: [
              'Feedback negativo sobre liderança',
              'Horas extras excessivas últimas 3 semanas',
              'Não participou da última pesquisa de clima'
            ],
            acoesRecomendadas: [
              'Conversa imediata com gestor direto',
              'Revisão da carga de trabalho',
              'Avaliação de mudança de equipe'
            ],
            prazoIntervencao: '24 horas',
            status: 'novo'
          },
          {
            id: 'alert_002',
            colaboradorId: 'emp_002',
            colaboradorNome: 'Ana Santos',
            departamento: 'Marketing',
            cargo: 'Analista de Marketing',
            tipoAlerta: 'individual',
            severidade: 'alta',
            scoreAtual: 78,
            scoreAnterior: 58,
            dataGeracao: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            descricao: 'Padrão de desengajamento detectado',
            fatoresIdentificados: [
              'Ausência em reuniões de equipe',
              'Queda na qualidade de entregas',
              'Sem interação em ferramentas colaborativas'
            ],
            acoesRecomendadas: [
              'Conversa de feedback individual',
              'Verificar satisfação com projeto atual',
              'Oferecer oportunidades de desenvolvimento'
            ],
            prazoIntervencao: '3 dias',
            status: 'em_acao',
            responsavel: 'Maria Costa (RH)'
          },
          {
            id: 'alert_003',
            colaboradorId: 'emp_003',
            colaboradorNome: 'Pedro Oliveira',
            departamento: 'Vendas',
            cargo: 'Consultor de Vendas',
            tipoAlerta: 'individual',
            severidade: 'media',
            scoreAtual: 64,
            scoreAnterior: 45,
            dataGeracao: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            descricao: 'Aumento gradual no score de risco',
            fatoresIdentificados: [
              'Metas não atingidas últimos 2 meses',
              'Feedback sobre processo de vendas',
              'Interesse em vagas externas (LinkedIn)'
            ],
            acoesRecomendadas: [
              'Revisão de metas e targets',
              'Treinamento adicional em vendas',
              'Conversa sobre plano de carreira'
            ],
            prazoIntervencao: '1 semana',
            status: 'novo'
          },
          {
            id: 'alert_004',
            colaboradorId: 'emp_004',
            colaboradorNome: 'Julia Ferreira',
            departamento: 'Operações',
            cargo: 'Coordenadora de Processos',
            tipoAlerta: 'individual',
            severidade: 'critica',
            scoreAtual: 89,
            scoreAnterior: 71,
            dataGeracao: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            descricao: 'Múltiplos fatores de risco identificados',
            fatoresIdentificados: [
              'Conflito com novo gestor',
              'Sobrecarga de responsabilidades',
              'Proposta de emprego externa confirmada'
            ],
            acoesRecomendadas: [
              'Intervenção imediata da liderança senior',
              'Revisão salarial emergencial',
              'Plano de retenção personalizado'
            ],
            prazoIntervencao: 'Imediato',
            status: 'novo'
          },
          {
            id: 'alert_005',
            colaboradorId: 'emp_005',
            colaboradorNome: 'Roberto Lima',
            departamento: 'Tecnologia',
            cargo: 'Tech Lead',
            tipoAlerta: 'individual',
            severidade: 'alta',
            scoreAtual: 82,
            scoreAnterior: 69,
            dataGeracao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            descricao: 'Padrão de comportamento pré-saída',
            fatoresIdentificados: [
              'Redução na participação em projetos',
              'Delegando responsabilidades rapidamente',
              'Aumento de ausências e trabalho remoto'
            ],
            acoesRecomendadas: [
              'Conversa sobre perspectivas de carreira',
              'Oferecer novos desafios técnicos',
              'Discussão sobre compensação'
            ],
            prazoIntervencao: '2 dias',
            status: 'resolvido',
            responsavel: 'João Silva (CTO)',
            dataResolucao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            observacoes: 'Oferecida promoção para Arquiteto Senior. Colaborador aceitou e score reduziu para 45.'
          }
        ]
        
        setAlertas(mockAlertas)
        
        // Contar alertas críticos para o parent
        const alertasCriticos = mockAlertas.filter(a => 
          a.severidade === 'critica' && a.status === 'novo'
        ).length
        onAlertasChange(alertasCriticos)
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
      if (montadoRef.current) {
        setErro('Falha ao carregar alertas. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (montadoRef.current) {
        setCarregando(false)
      }
    }
  }, [onAlertasChange])
  
  // Efeito para carregar dados
  useEffect(() => {
    carregarAlertas()
  }, [carregarAlertas])
  
  // Filtrar alertas
  useEffect(() => {
    let filtrados = [...alertas]
    
    // Filtro por severidade
    if (filtroSeveridade !== 'todos') {
      filtrados = filtrados.filter(alerta => alerta.severidade === filtroSeveridade)
    }
    
    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(alerta => alerta.status === filtroStatus)
    }
    
    // Filtro por departamento
    if (filtroDepartamento !== 'todos') {
      filtrados = filtrados.filter(alerta => alerta.departamento.toLowerCase() === filtroDepartamento)
    }
    
    // Busca por termo
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase()
      filtrados = filtrados.filter(alerta =>
        alerta.colaboradorNome.toLowerCase().includes(termo) ||
        alerta.departamento.toLowerCase().includes(termo) ||
        alerta.cargo.toLowerCase().includes(termo) ||
        alerta.descricao.toLowerCase().includes(termo)
      )
    }
    
    // Ordenar por severidade e data
    filtrados.sort((a, b) => {
      const severidadeOrder = { critica: 4, alta: 3, media: 2, baixa: 1 }
      const severidadeA = severidadeOrder[a.severidade as keyof typeof severidadeOrder]
      const severidadeB = severidadeOrder[b.severidade as keyof typeof severidadeOrder]
      
      if (severidadeA !== severidadeB) {
        return severidadeB - severidadeA
      }
      
      return new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime()
    })
    
    setAlertasFiltrados(filtrados)
    setPagina(1) // Reset pagination
  }, [alertas, filtroSeveridade, filtroStatus, filtroDepartamento, termoBusca])
  
  // Paginação
  const alertasPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itensPorPagina
    return alertasFiltrados.slice(inicio, inicio + itensPorPagina)
  }, [alertasFiltrados, pagina, itensPorPagina])
  
  const totalPaginas = Math.ceil(alertasFiltrados.length / itensPorPagina)
  const filtrosAplicados = filtroSeveridade !== 'todos' || filtroStatus !== 'todos' || filtroDepartamento !== 'todos' || termoBusca.trim() !== ''
  
  // Handlers
  const handleLimparFiltros = useCallback(() => {
    setFiltroSeveridade('todos')
    setFiltroStatus('todos')
    setFiltroDepartamento('todos')
    setTermoBusca('')
    toast.info('Filtros limpos')
  }, [])
  
  const handleAcaoAlerta = useCallback((alerta: AlertaPreditivo) => {
    setModalAcao(alerta)
  }, [])
  
  const handleSalvarAcao = useCallback(async (alertaId: string, acao: string, observacoes: string) => {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setAlertas(prev => prev.map(alerta => 
      alerta.id === alertaId 
        ? { 
            ...alerta, 
            status: 'em_acao' as const,
            responsavel: perfilUsuario.nome,
            observacoes: observacoes 
          }
        : alerta
    ))
    
    setModalAcao(null)
  }, [perfilUsuario.nome])
  
  const handlePaginaChange = useCallback((novaPagina: number) => {
    setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)))
  }, [totalPaginas])
  
  // Renderização de estados
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando alertas...</p>
        </div>
      </div>
    )
  }
  
  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar alertas</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={carregarAlertas}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Central de Alertas Preditivos</CardTitle>
          <CardDescription>
            Gestão de alertas de risco e intervenções proativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar colaborador, departamento..."
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filtroSeveridade} onValueChange={setFiltroSeveridade}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_acao">Em Ação</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="ignorado">Ignorado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="operações">Operações</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={handleLimparFiltros}
              disabled={!filtrosAplicados}
            >
              Limpar Filtros
            </Button>
          </div>
          
          {filtrosAplicados && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {alertasFiltrados.length} de {alertas.length} alertas
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lista de alertas */}
      {!carregando && !erro && alertasPaginados.length === 0 && (
        <div className="text-center py-16">
          <LucideIcons.Inbox className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhum alerta encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhum alerta corresponde aos filtros aplicados. Tente ajustar os critérios.'
              : 'Não há alertas no momento. Isso é uma boa notícia!'
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
      
      {alertasPaginados.length > 0 && (
        <div className="space-y-4">
          {alertasPaginados.map((alerta) => (
            <Card key={alerta.id} className={`border-l-4 ${
              alerta.severidade === 'critica' ? 'border-l-red-500' :
              alerta.severidade === 'alta' ? 'border-l-orange-500' :
              alerta.severidade === 'media' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{alerta.colaboradorNome}</h4>
                      <Badge className={getSeveridadeCor(alerta.severidade)}>
                        {alerta.severidade}
                      </Badge>
                      <Badge className={getStatusCor(alerta.status)}>
                        {alerta.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      {alerta.cargo} • {alerta.departamento} • 
                      Score: {alerta.scoreAnterior} → {alerta.scoreAtual} 
                      <span className="text-red-600 font-medium">
                        (+{alerta.scoreAtual - alerta.scoreAnterior})
                      </span>
                    </div>
                    
                    <p className="text-sm mb-3">{alerta.descricao}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Fatores identificados:</span>
                        <ul className="list-disc list-inside text-muted-foreground mt-1">
                          {alerta.fatoresIdentificados.map((fator, index) => (
                            <li key={index}>{fator}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="font-medium">Ações recomendadas:</span>
                        <ul className="list-disc list-inside text-muted-foreground mt-1">
                          {alerta.acoesRecomendadas.map((acao, index) => (
                            <li key={index}>{acao}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                      <div>
                        Gerado em: {formatarData(alerta.dataGeracao)} • 
                        Prazo: {alerta.prazoIntervencao}
                      </div>
                      
                      {alerta.responsavel && (
                        <div>
                          Responsável: {alerta.responsavel}
                        </div>
                      )}
                    </div>
                    
                    {alerta.observacoes && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="font-medium text-green-800">Observações:</span>
                        <p className="text-green-700 mt-1">{alerta.observacoes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    {alerta.status === 'novo' && (
                      <Button
                        onClick={() => handleAcaoAlerta(alerta)}
                        className="whitespace-nowrap"
                      >
                        <LucideIcons.Play className="mr-2 h-4 w-4" />
                        Tomar Ação
                      </Button>
                    )}
                    
                    {alerta.status === 'resolvido' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <LucideIcons.CheckCircle className="mr-1 h-3 w-3" />
                        Resolvido
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Paginação */}
      {!carregando && !erro && alertasFiltrados.length > 0 && totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {alertasPaginados.length} de {alertasFiltrados.length} alertas
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
                      Math.abs(numeroPagina - pagina) <= 1
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
      
      {/* Modal de ação */}
      <ModalAcao
        alerta={modalAcao}
        isOpen={modalAcao !== null}
        onClose={() => setModalAcao(null)}
        onSalvar={handleSalvarAcao}
      />
    </div>
  )
}