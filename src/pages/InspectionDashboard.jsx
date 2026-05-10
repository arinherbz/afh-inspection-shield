import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import {
  ShieldCheck,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Calendar,
  Filter,
  Search,
} from 'lucide-react'
import { format, subHours } from 'date-fns'

const REQUIRED_DOCUMENTS = [
  { id: 'resident_roster', name: 'Resident Roster', category: 'Residents' },
  { id: 'mar_audit_trail', name: 'MAR Audit Trail', category: 'Medications' },
  { id: 'staff_credentials', name: 'Staff Credentials', category: 'Staff' },
  { id: 'fire_drill_log', name: 'Fire Drill Log', category: 'Safety' },
  { id: 'incident_reports_complete', name: 'Incident Reports (Complete)', category: 'Incidents' },
  { id: 'negotiated_care_plans', name: 'Negotiated Care Plans', category: 'Care' },
  { id: 'resident_assessments', name: 'Resident Assessments', category: 'Care' },
  { id: 'signed_residency_agreements', name: 'Signed Residency Agreements', category: 'Residents' },
  { id: 'polst_forms', name: 'POLST Forms', category: 'Care' },
  { id: 'emergency_preparedness_plan', name: 'Emergency Preparedness Plan', category: 'Safety' },
  { id: 'infection_control_plan', name: 'Infection Control Plan', category: 'Safety' },
  { id: 'training_records', name: 'Training Records', category: 'Staff' },
  { id: 'personal_belongings_inventory', name: 'Personal Belongings Inventory', category: 'Residents' },
  { id: 'disclosure_of_services_10_508', name: 'Disclosure of Services (10-508)', category: 'Compliance' },
  { id: 'seizure_safety_plans', name: 'Seizure Safety Plans', category: 'Care' },
]

const CATEGORIES = [...new Set(REQUIRED_DOCUMENTS.map(d => d.category))]

export default function InspectionDashboard() {
  const { home } = useHome()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch document status
  const { data: documents, isLoading } = useQuery({
    queryKey: ['required-documents', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('required_documents')
        .select('*')
        .eq('home_id', home?.id)
      return data || []
    },
    enabled: !!home,
  })

  // Fetch recent inspection packets
  const { data: recentPackets } = useQuery({
    queryKey: ['inspection-packets', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('inspection_packets')
        .select('*')
        .eq('home_id', home?.id)
        .order('generated_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!home,
  })

  // Check if cached packet exists (within 24 hours)
  const cachedPacket = recentPackets?.find(p =>
    subHours(new Date(), 24) < new Date(p.generated_at)
  )

  // Calculate readiness score
  const getDocumentStatus = (docId) => {
    const doc = documents?.find(d => d.document_type === docId)
    if (!doc) return { status: 'missing', label: 'Missing', color: 'error' }
    return {
      status: doc.status,
      label: doc.status === 'present' ? 'Present' :
             doc.status === 'expiring' ? 'Expiring' :
             doc.status === 'expired' ? 'Expired' : 'Missing',
      color: doc.status === 'present' ? 'success' :
             doc.status === 'expiring' ? 'warning' : 'error',
      expiresAt: doc.expires_at,
      uploadedAt: doc.uploaded_at,
    }
  }

  const presentCount = REQUIRED_DOCUMENTS.filter(d =>
    getDocumentStatus(d.id).status === 'present'
  ).length
  const score = Math.round((presentCount / REQUIRED_DOCUMENTS.length) * 100)

  // Generate inspection packet mutation
  const generatePacket = useMutation({
    mutationFn: async () => {
      // In production, this would call a Supabase Edge Function
      // For now, we'll simulate the process
      const { data, error } = await supabase
        .from('inspection_packets')
        .insert([{
          home_id: home.id,
          generated_at: new Date().toISOString(),
          document_count: presentCount,
          missing_documents: REQUIRED_DOCUMENTS
            .filter(d => getDocumentStatus(d.id).status !== 'present')
            .map(d => d.id),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inspection-packets'])
    },
  })

  // Filter documents
  const filteredDocuments = REQUIRED_DOCUMENTS.filter(doc => {
    const status = getDocumentStatus(doc.id)
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || status.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Sort: critical first (missing/expiring/expired), then alphabetically
  const sortedDocuments = filteredDocuments.sort((a, b) => {
    const statusA = getDocumentStatus(a.id)
    const statusB = getDocumentStatus(b.id)
    const priority = { expired: 0, missing: 1, expiring: 2, present: 3 }
    const priorityDiff = (priority[statusA.status] || 3) - (priority[statusB.status] || 3)
    if (priorityDiff !== 0) return priorityDiff
    return a.name.localeCompare(b.name)
  })

  const handleFileUpload = async (docId, file) => {
    // In production, upload to Supabase Storage and create document record
    console.log('Uploading file for', docId, file)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inspection Readiness</h1>
          <p className="text-slate-500 mt-1">
            Ensure your Adult Family Home is ready for DSHS inspections
          </p>
        </div>
        <div className="flex gap-3">
          {cachedPacket && (
            <button className="btn btn-secondary">
              <FileText className="h-4 w-4 mr-2" />
              Use Cached Packet
            </button>
          )}
          <button
            onClick={() => generatePacket.mutate()}
            disabled={generatePacket.isPending}
            className="btn btn-primary"
          >
            {generatePacket.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Inspection Packet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Readiness Score Card */}
      <div className={`card ${
        score >= 90 ? 'bg-success-50 border-success-200' :
        score >= 70 ? 'bg-warning-50 border-warning-200' :
        'bg-error-50 border-error-200'
      } border-2`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Overall Readiness Score</p>
            <p className={`text-5xl font-bold mt-2 ${
              score >= 90 ? 'text-success-600' :
              score >= 70 ? 'text-warning-600' :
              'text-error-600'
            }`}>
              {score}%
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {presentCount} of {REQUIRED_DOCUMENTS.length} required documents ready
            </p>
          </div>
          <div className="relative">
            <ShieldCheck className={`h-24 w-24 ${
              score >= 90 ? 'text-success-500' :
              score >= 70 ? 'text-warning-500' :
              'text-error-500'
            }`} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input pl-9 pr-8 min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
              <option value="missing">Missing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Required Documents ({sortedDocuments.length})
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDocuments.map((doc) => {
              const status = getDocumentStatus(doc.id)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      status.color === 'success' ? 'bg-success-100' :
                      status.color === 'warning' ? 'bg-warning-100' :
                      'bg-error-100'
                    }`}>
                      {status.status === 'present' ? (
                        <CheckCircle className={`h-5 w-5 ${
                          status.color === 'success' ? 'text-success-600' :
                          status.color === 'warning' ? 'text-warning-600' :
                          'text-error-600'
                        }`} />
                      ) : (
                        <AlertCircle className={`h-5 w-5 ${
                          status.color === 'success' ? 'text-success-600' :
                          status.color === 'warning' ? 'text-warning-600' :
                          'text-error-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.category}</p>
                      {status.expiresAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Expires: {format(new Date(status.expiresAt), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${
                      status.color === 'success' ? 'badge-success' :
                      status.color === 'warning' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {status.label}
                    </span>
                    <button
                      onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                      className="btn btn-secondary py-1.5 px-3 text-sm"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {status.status === 'present' ? 'Update' : 'Upload'}
                    </button>
                    <input
                      id={`file-${doc.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && handleFileUpload(doc.id, e.target.files[0])}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Packets */}
      {recentPackets && recentPackets.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Recent Inspection Packets
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Generated</th>
                  <th className="table-th">Documents</th>
                  <th className="table-th">Missing</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPackets.map((packet) => (
                  <tr key={packet.id} className="table-tr-hover">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(packet.generated_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="badge badge-success">{packet.document_count} ready</span>
                    </td>
                    <td className="table-td">
                      {packet.missing_documents?.length > 0 ? (
                        <span className="badge badge-error">
                          {packet.missing_documents.length} missing
                        </span>
                      ) : (
                        <span className="badge badge-success">All present</span>
                      )}
                    </td>
                    <td className="table-td">
                      <button className="btn btn-secondary py-1.5 px-3 text-sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}