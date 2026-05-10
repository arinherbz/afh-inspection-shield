import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { AlertTriangle, Plus, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

export default function Incidents() {
  const { home } = useHome()
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, residents(first_name, last_name)')
        .eq('home_id', home?.id)
        .order('occurred_at', { ascending: false })
      return data || []
    },
    enabled: !!home,
  })

  const filteredIncidents = incidents?.filter(incident => {
    if (statusFilter === 'open') return !incident.closed_at
    if (statusFilter === 'closed') return !!incident.closed_at
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incidents</h1>
          <p className="text-slate-500 mt-1">
            Track and manage incident reports
          </p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Link>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}
        >
          All ({incidents?.length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'open' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}
        >
          Open ({incidents?.filter(i => !i.closed_at).length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('closed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'closed' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}
        >
          Closed ({incidents?.filter(i => i.closed_at).length || 0})
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents?.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${incident.closed_at ? 'bg-success-100' : 'bg-error-100'}`}>
                    <AlertTriangle className={`h-5 w-5 ${incident.closed_at ? 'text-success-600' : 'text-error-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 capitalize">
                      {incident.incident_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-slate-500">
                      {incident.residents?.first_name} {incident.residents?.last_name} • {format(new Date(incident.occurred_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${incident.closed_at ? 'badge-success' : 'badge-warning'}`}>
                    {incident.closed_at ? 'Closed' : 'Open'}
                  </span>
                  <Link to={`/incidents/${incident.id}`} className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                    View
                  </Link>
                </div>
              </div>
            ))}
            {filteredIncidents?.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p>No incidents found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}