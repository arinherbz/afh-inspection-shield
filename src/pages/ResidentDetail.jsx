import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, AlertTriangle, Pill, FileText, Activity, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function ResidentDetail() {
  const { id } = useParams()

  const { data: resident, isLoading } = useQuery({
    queryKey: ['resident', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('residents')
        .select('*')
        .eq('id', id)
        .single()
      return data
    },
    enabled: !!id,
  })

  const { data: medications } = useQuery({
    queryKey: ['resident-medications', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('resident_id', id)
        .eq('discontinued', false)
      return data || []
    },
    enabled: !!id,
  })

  const { data: incidents } = useQuery({
    queryKey: ['resident-incidents', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .eq('resident_id', id)
        .order('occurred_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Resident not found</p>
        <Link to="/residents" className="btn btn-primary mt-4">
          Back to Residents
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/residents" className="btn btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {resident.first_name} {resident.last_name}
          </h1>
          <p className="text-slate-500">
            Room {resident.room_number || 'N/A'} • Admitted {resident.admission_date ? format(new Date(resident.admission_date), 'MMM d, yyyy') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Alert Flags */}
      {resident.alert_flags?.length > 0 && (
        <div className="card bg-warning-50 border-warning-200 border">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <h2 className="font-semibold text-warning-800">Alert Flags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {resident.alert_flags.map((flag) => (
              <span key={flag} className="badge badge-warning">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to={`/incidents/new?residentId=${id}`} className="btn btn-secondary">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Incident
        </Link>
        <Link to={`/medications/new?residentId=${id}`} className="btn btn-secondary">
          <Pill className="h-4 w-4 mr-2" />
          Add Medication
        </Link>
        <button className="btn btn-secondary">
          <FileText className="h-4 w-4 mr-2" />
          Add Note
        </button>
        <Link to={`/residents/${id}/edit`} className="btn btn-secondary">
          <Activity className="h-4 w-4 mr-2" />
          Edit Profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-6">
            <button className="pb-3 border-b-2 border-primary-500 text-primary-600 font-medium text-sm">
              Profile
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">
              Care Plan
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">
              Medications ({medications?.length || 0})
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">
              Incidents ({incidents?.length || 0})
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">
              Care Notes
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Personal Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Full Name</dt>
                  <dd className="text-slate-800">{resident.first_name} {resident.last_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Room Number</dt>
                  <dd className="text-slate-800">{resident.room_number || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Admission Date</dt>
                  <dd className="text-slate-800">{resident.admission_date ? format(new Date(resident.admission_date), 'MMM d, yyyy') : 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Primary Physician</dt>
                  <dd className="text-slate-800">{resident.primary_physician || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Medical Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Medicaid ID</dt>
                  <dd className="text-slate-800">{resident.medicaid_id || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">POLST on File</dt>
                  <dd className="text-slate-800">{resident.polst_on_file ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Care Plan Completed</dt>
                  <dd className="text-slate-800">{resident.care_plan_completed ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Assessment Completed</dt>
                  <dd className="text-slate-800">{resident.assessment_completed ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {resident.diagnoses?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-slate-800 mb-2">Diagnoses</h3>
              <div className="flex flex-wrap gap-2">
                {resident.diagnoses.map((diag, idx) => (
                  <span key={idx} className="badge badge-primary">{diag}</span>
                ))}
              </div>
            </div>
          )}

          {resident.allergies?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-slate-800 mb-2">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {resident.allergies.map((allergy, idx) => (
                  <span key={idx} className="badge badge-error">{allergy}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}