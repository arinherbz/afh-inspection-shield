import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Pill,
  Clock,
  ChevronRight,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { format, isWithinInterval, subDays } from 'date-fns'

const REQUIRED_DOCUMENTS = [
  'resident_roster',
  'mar_audit_trail',
  'staff_credentials',
  'fire_drill_log',
  'incident_reports_complete',
  'negotiated_care_plans',
  'resident_assessments',
  'signed_residency_agreements',
  'polst_forms',
  'emergency_preparedness_plan',
  'infection_control_plan',
  'training_records',
  'personal_belongings_inventory',
  'disclosure_of_services_10_508',
  'seizure_safety_plans',
]

export default function Dashboard() {
  const { home, staffRole } = useHome()

  // Fetch inspection readiness data
  const { data: readinessData } = useQuery({
    queryKey: ['inspection-readiness'],
    queryFn: async () => {
      const { data: documents } = await supabase
        .from('required_documents')
        .select('document_type, status, expires_at')
        .eq('home_id', home?.id)

      const present = documents?.filter(d => d.status === 'present').length || 0
      const total = REQUIRED_DOCUMENTS.length
      const score = Math.round((present / total) * 100)

      const missing = REQUIRED_DOCUMENTS.filter(type =>
        !documents?.find(d => d.document_type === type && d.status === 'present')
      )

      const expiring = documents?.filter(d => {
        if (!d.expires_at) return false
        return isWithinInterval(new Date(d.expires_at), {
          start: new Date(),
          end: subDays(new Date(), -30)
        })
      }) || []

      return { score, missing, expiring, total, present }
    },
    enabled: !!home,
  })

  // Fetch recent incidents
  const { data: recentIncidents } = useQuery({
    queryKey: ['recent-incidents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, residents(first_name, last_name)')
        .eq('home_id', home?.id)
        .order('occurred_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!home,
  })

  // Fetch staff with expiring certifications
  const { data: expiringCerts } = useQuery({
    queryKey: ['expiring-certs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('home_id', home?.id)
        .eq('is_active', true)
      return data?.filter(s => {
        const certs = s.certifications || {}
        return Object.values(certs).some(date => {
          const certDate = new Date(date)
          return isWithinInterval(certDate, {
            start: new Date(),
            end: subDays(new Date(), -30)
          })
        })
      }) || []
    },
    enabled: !!home,
  })

  // Fetch today's medication administration stats
  const { data: medStats } = useQuery({
    queryKey: ['med-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('medication_administrations')
        .select('status')
        .eq('scheduled_time', today)
      const total = data?.length || 0
      const given = data?.filter(d => d.status === 'given').length || 0
      return { total, given, percentage: total ? Math.round((given / total) * 100) : 0 }
    },
    enabled: !!home,
  })

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success-500'
    if (score >= 70) return 'text-warning-500'
    return 'text-error-500'
  }

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-success-50 border-success-200'
    if (score >= 70) return 'bg-warning-50 border-warning-200'
    return 'bg-error-50 border-error-200'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back{home ? ` to ${home.business_name}` : ''}
        </p>
      </div>

      {/* Inspection Readiness Score - Hero Card */}
      <div className={`card ${getScoreBg(readinessData?.score || 0)} border-2`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Inspection Readiness</p>
            <p className="text-5xl font-bold mt-2">
              <span className={getScoreColor(readinessData?.score || 0)}>
                {readinessData?.score || 0}%
              </span>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {readinessData?.present || 0} of {readinessData?.total || REQUIRED_DOCUMENTS.length} documents ready
            </p>
          </div>
          <div className="relative">
            <ShieldCheck className={`h-24 w-24 ${getScoreColor(readinessData?.score || 0)}`} />
            <svg className="absolute inset-0 h-24 w-24" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(readinessData?.score || 0) * 2.83} 283`}
                className={getScoreColor(readinessData?.score || 0)}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link to="/inspection" className="btn btn-primary">
            View Inspection Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
          {readinessData?.missing?.length > 0 && (
            <Link to="/inspection" className="btn btn-secondary">
              Fix {readinessData.missing.length} Missing
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Medication Pass Completion */}
        <div className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Pill className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {medStats?.percentage || 0}%
              </p>
              <p className="text-sm text-slate-500">Med Pass Today</p>
            </div>
          </div>
        </div>

        {/* Unresolved Incidents */}
        <div className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {recentIncidents?.filter(i => !i.closed_at).length || 0}
              </p>
              <p className="text-sm text-slate-500">Open Incidents</p>
            </div>
          </div>
        </div>

        {/* Expiring Certifications */}
        <div className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {expiringCerts?.length || 0}
              </p>
              <p className="text-sm text-slate-500">Expiring Certs</p>
            </div>
          </div>
        </div>

        {/* Active Residents */}
        <div className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Users className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {home?.bed_capacity || 6}
              </p>
              <p className="text-sm text-slate-500">Bed Capacity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Missing Documents</h2>
            <Link to="/inspection" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          {readinessData?.missing?.length > 0 ? (
            <ul className="space-y-2">
              {readinessData.missing.slice(0, 5).map((doc) => (
                <li key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700 capitalize">
                    {doc.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-error">Missing</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <ShieldCheck className="h-12 w-12 mx-auto text-success-500 mb-2" />
              <p>All documents are up to date!</p>
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Incidents</h2>
            <Link to="/incidents" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          {recentIncidents?.length > 0 ? (
            <ul className="space-y-3">
              {recentIncidents.slice(0, 4).map((incident) => (
                <li key={incident.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${incident.closed_at ? 'bg-success-500' : 'bg-error-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-700 capitalize">
                        {incident.incident_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {incident.residents?.first_name} {incident.residents?.last_name} • {format(new Date(incident.occurred_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  {!incident.closed_at && (
                    <span className="badge badge-warning">Open</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No recent incidents</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/incidents/new" className="btn btn-secondary justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Incident
          </Link>
          <Link to="/residents" className="btn btn-secondary justify-start">
            <Users className="h-4 w-4 mr-2" />
            Add Resident
          </Link>
          <Link to="/medications" className="btn btn-secondary justify-start">
            <Pill className="h-4 w-4 mr-2" />
            eMAR
          </Link>
          <Link to="/staff" className="btn btn-secondary justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Manage Staff
          </Link>
        </div>
      </div>
    </div>
  )
}