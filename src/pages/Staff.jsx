import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { UserCog, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { format, isWithinInterval, subDays } from 'date-fns'
import { useState } from 'react'

export default function Staff() {
  const { home } = useHome()
  const [showInactive, setShowInactive] = useState(false)

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('home_id', home?.id)
        .eq('is_active', !showInactive)
        .order('last_name')
      return data || []
    },
    enabled: !!home,
  })

  const getExpiringCerts = (staffMember) => {
    const certs = staffMember.certifications || {}
    return Object.entries(certs).filter(([_, date]) => {
      const certDate = new Date(date)
      return isWithinInterval(certDate, {
        start: new Date(),
        end: subDays(new Date(), -30)
      })
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff</h1>
          <p className="text-slate-500 mt-1">Manage staff members and certifications</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      <div className="flex items-center gap-4">
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

      <div className="card">
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
                  <th className="table-th">Role</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Certifications</th>
                  <th className="table-th">Background Check</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {staff?.map((member) => {
                  const expiringCerts = getExpiringCerts(member)
                  return (
                    <tr key={member.id} className="table-tr-hover">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {member.first_name[0]}{member.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-slate-500">Hired {member.hire_date ? format(new Date(member.hire_date), 'MMM yyyy') : 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="badge badge-primary capitalize">{member.role}</span>
                      </td>
                      <td className="table-td">{member.phone || '-'}</td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1">
                          {expiringCerts.length > 0 ? (
                            <span className="badge badge-warning text-xs">
                              {expiringCerts.length} expiring
                            </span>
                          ) : (
                            <span className="badge badge-success text-xs">All current</span>
                          )}
                        </div>
                      </td>
                      <td className="table-td">
                        {member.background_check_date ? (
                          <div className="flex items-center gap-2">
                            {member.background_check_passed ? (
                              <CheckCircle className="h-4 w-4 text-success-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-warning-500" />
                            )}
                            <span className="text-sm">
                              {format(new Date(member.background_check_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not on file</span>
                        )}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${member.is_active ? 'badge-success' : 'badge-error'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {staff?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <UserCog className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p>No staff members found</p>
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