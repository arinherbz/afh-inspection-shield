import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { Pill, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function Medications() {
  const { home } = useHome()

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medications')
        .select('*, residents(first_name, last_name, room_number)')
        .eq('discontinued', false)
        .order('drug_name')
      return data || []
    },
    enabled: !!home,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Medications (eMAR)</h1>
        <p className="text-slate-500 mt-1">
          Medication Administration Record
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Active Medications ({medications?.length || 0})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Resident</th>
                  <th className="table-th">Medication</th>
                  <th className="table-th">Dose</th>
                  <th className="table-th">Route</th>
                  <th className="table-th">Frequency</th>
                  <th className="table-th">Times</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {medications?.map((med) => (
                  <tr key={med.id} className="table-tr-hover">
                    <td className="table-td">
                      <div>
                        <p className="font-medium">{med.residents?.first_name} {med.residents?.last_name}</p>
                        <p className="text-xs text-slate-500">Room {med.residents?.room_number}</p>
                      </div>
                    </td>
                    <td className="table-td font-medium">{med.drug_name}</td>
                    <td className="table-td">{med.dose}</td>
                    <td className="table-td">{med.route}</td>
                    <td className="table-td">{med.frequency}</td>
                    <td className="table-td">
                      {med.times?.map((t, i) => (
                        <span key={i} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td className="table-td">
                      <span className="badge badge-success">Active</span>
                    </td>
                  </tr>
                ))}
                {medications?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <Pill className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p>No active medications</p>
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