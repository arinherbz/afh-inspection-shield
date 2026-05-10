import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { BarChart3, Download, FileText, Pill, AlertTriangle, Users } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const REPORT_TYPES = [
  { id: 'incident_summary', name: 'Incident Summary', icon: AlertTriangle, description: 'Summary of incidents by type and month' },
  { id: 'medication_history', name: 'Medication Pass History', icon: Pill, description: 'Medication administration records' },
  { id: 'staff_certifications', name: 'Staff Certification Report', icon: Users, description: 'Certification expiration tracking' },
  { id: 'inspection_packet', name: 'Inspection Packet', icon: FileText, description: 'Complete DSHS inspection packet (PDF)' },
  { id: 'all_data', name: 'Export All Data', icon: Download, description: 'Export all data to Excel (XLSX)' },
]

export default function Reports() {
  const { home } = useHome()
  const [selectedReport, setSelectedReport] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['report-stats', home?.id],
    queryFn: async () => {
      // Get incident counts by type
      const { data: incidents } = await supabase
        .from('incidents')
        .select('incident_type, occurred_at')
        .eq('home_id', home?.id)
        .gte('occurred_at', subMonths(new Date(), 6).toISOString())

      const incidentByType = {}
      incidents?.forEach(inc => {
        incidentByType[inc.incident_type] = (incidentByType[inc.incident_type] || 0) + 1
      })

      return {
        totalIncidents: incidents?.length || 0,
        incidentByType,
      }
    },
    enabled: !!home,
  })

  const handleGenerateReport = async (reportId) => {
    setIsGenerating(true)
    setSelectedReport(reportId)

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In production, this would generate actual reports
    alert(`Report "${REPORT_TYPES.find(r => r.id === reportId)?.name}" generated successfully!`)

    setIsGenerating(false)
    setSelectedReport(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports & Exports</h1>
        <p className="text-slate-500 mt-1">Generate reports and export data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.totalIncidents || 0}</p>
              <p className="text-sm text-slate-500">Incidents (6 months)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TYPES.map((report) => (
            <div
              key={report.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedReport === report.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleGenerateReport(report.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <report.icon className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800">{report.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                </div>
                {selectedReport === report.id && isGenerating && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Incident Trends</h2>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <p>Chart visualization would appear here</p>
            <p className="text-sm mt-1">Using Recharts library</p>
          </div>
        </div>
      </div>
    </div>
  )
}