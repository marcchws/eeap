'use client'

import React from 'react'

// Tipos para o contexto global
interface PerfilUsuario {
  id: string
  nome: string
  tipo: 'executivo' | 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'data_scientist'
  departamento: string
  permissoes: string[]
}

interface EstadoGlobal {
  departamentoSelecionado: string
  periodoSelecionado: string
  filtrosGlobais: {
    departamentos: string[]
    cargos: string[]
    faixasRisco: string[]
  }
}

// Context para compartilhar estado entre seções
const AnalisePredicContext = React.createContext<{
  perfilUsuario: PerfilUsuario
  estadoGlobal: EstadoGlobal
  atualizarFiltrosGlobais: (filtros: Partial<EstadoGlobal['filtrosGlobais']>) => void
} | null>(null)

// Hook para usar o context
export const useAnalisePredicContext = () => {
  const context = React.useContext(AnalisePredicContext)
  if (!context) {
    throw new Error('useAnalisePredicContext deve ser usado dentro de AnalisePredicContext.Provider')
  }
  return context
}

export { AnalisePredicContext }
export type { PerfilUsuario, EstadoGlobal }