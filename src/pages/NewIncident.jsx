import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'

const incidentSchema = z.object({
  incident_type: z.enum(['fall', 'medication_error', 'behavior', 'injury', 'elopement', 'other']),
  occurred_at: z.string(),
  resident_id: z.string().min(1, 'Please select a resident'),
  description: z.string().min(10, 'Please provide a detailed description'),
  witness_name: z.string().optional().or(z.literal('')),
  witness_statement: z.string().optional().or(z.literal('')),
  actions_taken: z.string().min(10, 'Please describe actions taken'),
  family_notified: z.boolean(),
  dshs_notified: z.boolean(),
  follow_up_required: z.boolean(),
})

const STEPS = [
  { id: 1, name: 'Incident Type' },
  { id: 2, name: 'Details' },
  { id: 3, name: 'Notifications' },
  { id: 4, name: 'Review & Submit' },
]

export default function NewIncident() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { home } = useHome()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)

  const { data: residents } = useQuery({
    queryKey: ['active-residents', home?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .eq('home_id', home?.id)
        .eq('is_active', true)
        .order('last_name')
      return data || []
    },
    enabled: !!home,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      incident_type: 'fall',
      occurred_at: new Date().toISOString().slice(0, 16),
      resident_id: searchParams.get('residentId') || '',
      description: '',
      witness_name: '',
      witness_statement: '',
      actions_taken: '',
      family_notified: false,
      dshs_notified: false,
      follow_up_required: false,
    },
  })

  const formData = watch()

  // Auto-detect DSHS notification requirement
  const requiresDSHSNotification = ['fall', 'medication_error', 'elopement'].includes(formData.incident_type)

  const createIncident = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('incidents').insert([{
        ...data,
        home_id: home.id,
        reported_by: user.id,
        occurred_at: new Date(data.occurred_at).toISOString(),
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents'])
      navigate('/incidents')
    },
  })

  const onSubmit = (data) => {
    createIncident.mutate(data)
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report an Incident</h1>
          <p className="text-slate-500 mt-1">Complete the guided workflow to document an incident</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="card">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                currentStep > step.id ? 'bg-success-500 text-white' :
                currentStep === step.id ? 'bg-primary-600 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                currentStep === step.id ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {step.name}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  currentStep > step.id ? 'bg-success-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        {/* Step 1: Incident Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">What type of incident occurred?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'fall', label: 'Fall', icon: '🏥' },
                { id: 'medication_error', label: 'Medication Error', icon: '💊' },
                { id: 'behavior', label: 'Behavior', icon: '😤' },
                { id: 'injury', label: 'Injury', icon: '🤕' },
                { id: 'elopement', label: 'Elopement', icon: '🚶' },
                { id: 'other', label: 'Other', icon: '📝' },
              ].map((type) => (
                <label key={type.id} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.incident_type === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    value={type.id}
                    {...register('incident_type')}
                    className="hidden"
                  />
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <span className="font-medium text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
            {errors.incident_type && (
              <p className="form-error">{errors.incident_type.message}</p>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Incident Details</h2>

            <div>
              <label className="form-label">Resident Involved</label>
              <select {...register('resident_id')} className="form-input">
                <option value="">Select a resident...</option>
                {residents?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.first_name} {r.last_name}
                  </option>
                ))}
              </select>
              {errors.resident_id && <p className="form-error">{errors.resident_id.message}</p>}
            </div>

            <div>
              <label className="form-label">When did this occur?</label>
              <input
                type="datetime-local"
                {...register('occurred_at')}
                className="form-input"
              />
              {errors.occurred_at && <p className="form-error">{errors.occurred_at.message}</p>}
            </div>

            <div>
              <label className="form-label">Description of Incident</label>
              <textarea
                {...register('description')}
                rows={4}
                className="form-input"
                placeholder="Provide a detailed description of what happened..."
              />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            <div>
              <label className="form-label">Witness Name (if any)</label>
              <input
                type="text"
                {...register('witness_name')}
                className="form-input"
                placeholder="Name of witness"
              />
            </div>

            <div>
              <label className="form-label">Witness Statement (if any)</label>
              <textarea
                {...register('witness_statement')}
                rows={3}
                className="form-input"
                placeholder="Statement from witness..."
              />
            </div>

            <div>
              <label className="form-label">Actions Taken</label>
              <textarea
                {...register('actions_taken')}
                rows={3}
                className="form-input"
                placeholder="Describe immediate actions taken..."
              />
              {errors.actions_taken && <p className="form-error">{errors.actions_taken.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Notifications */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>

            <div className="p-4 bg-slate-50 rounded-lg">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('family_notified')}
                  className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-slate-700">Family has been notified</span>
                  <p className="text-sm text-slate-500">Document that the resident's family/emergency contact was informed</p>
                </div>
              </label>
            </div>

            {requiresDSHSNotification && (
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5" />
                  <div>
                    <span className="font-medium text-warning-800">DSHS Notification Required</span>
                    <p className="text-sm text-warning-700 mt-1">
                      This type of incident requires notification to DSHS within specific timeframes.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    {...register('dshs_notified')}
                    className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <span className="font-medium text-slate-700">DSHS has been notified</span>
                </label>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-lg">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('follow_up_required')}
                  className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-slate-700">Follow-up required</span>
                  <p className="text-sm text-slate-500">This incident requires additional follow-up actions</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Review & Submit</h2>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Incident Type</p>
                  <p className="font-medium capitalize">{formData.incident_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Occurred At</p>
                  <p className="font-medium">{new Date(formData.occurred_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Resident</p>
                  <p className="font-medium">
                    {residents?.find(r => r.id === formData.resident_id)
                      ? `${residents.find(r => r.id === formData.resident_id).first_name} ${residents.find(r => r.id === formData.resident_id).last_name}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Family Notified</p>
                  <p className="font-medium">{formData.family_notified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">DSHS Notified</p>
                  <p className="font-medium">{formData.dshs_notified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Follow-up Required</p>
                  <p className="font-medium">{formData.follow_up_required ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium mt-1">{formData.description}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Actions Taken</p>
                <p className="font-medium mt-1">{formData.actions_taken}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                By submitting this report, I attest that the information provided is accurate and complete to the best of my knowledge. My typed name serves as my legal signature per Washington State law.
              </p>
              <p className="text-xs text-slate-500">
                Submitting as: {user?.email}
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          {currentStep > 1 ? (
            <button type="button" onClick={prevStep} className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button type="button" onClick={nextStep} className="btn btn-primary">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={createIncident.isPending}
              className="btn btn-success"
            >
              {createIncident.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Incident Report
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}