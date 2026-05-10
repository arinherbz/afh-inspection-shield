import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { Users, Plus, Search, Filter, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function ResidentList() {
  const { home } = useHome()
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const { data: residents, isLoading } = useQuery({
    queryKey: ['residents', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('residents')
        .select('*')
        .eq('home_id', home?.id)
        .eq('is_active', !showInactive)
        .order('last_name', { ascending: true })
      return data || []
    },
    enabled: !!home,
  })

  const filteredResidents = residents?.filter(r =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Residents</h1>
          <p className="text-slate-500 mt-1">
            Manage resident information and care plans
          </p>
        </div>
        <Link to="/residents/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Resident
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search residents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600">Show Inactive</span>
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Room</th>
                  <th className="table-th">Admission Date</th>
                  <th className="table-th">Alerts</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents?.map((resident) => (
                  <tr key={resident.id} className="table-tr-hover">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {resident.first_name[0]}{resident.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {resident.first_name} {resident.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">{resident.room_number || '-'}</td>
                    <td className="table-td">
                      {resident.admission_date ? new Date(resident.admission_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-td">
                      {resident.alert_flags?.length > 0 ? (
                        <div className="flex gap-1">
                          {resident.alert_flags.slice(0, 3).map((flag) => (
                            <span key={flag} className="badge badge-warning text-xs">
                              {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span className={`badge ${resident.is_active ? 'badge-success' : 'badge-error'}`}>
                        {resident.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <Link to={`/residents/${resident.id}`} className="text-primary-600 hover:text-primary-500">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredResidents?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p>No residents found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}