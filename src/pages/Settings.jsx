import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useHome } from '../contexts/HomeContext'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Settings as SettingsIcon, Building, Users, Bell, Shield, Upload } from 'lucide-react'

const homeSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  license_number: z.string().min(5, 'License number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  zip: z.string().min(5, 'Valid ZIP code is required'),
  bed_capacity: z.number().min(6).max(8),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
})

const TABS = [
  { id: 'general', name: 'General', icon: Building },
  { id: 'documents', name: 'Documents', icon: Upload },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
]

export default function Settings() {
  const { home, updateHome } = useHome()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(homeSchema),
    defaultValues: {
      business_name: home?.business_name || '',
      license_number: home?.license_number || '',
      address: home?.address || '',
      city: home?.city || '',
      zip: home?.zip || '',
      bed_capacity: home?.bed_capacity || 6,
      phone: home?.phone || '',
      email: home?.email || '',
    },
  })

  // Reset form when home data loads
  useState(() => {
    if (home) {
      reset({
        business_name: home.business_name || '',
        license_number: home.license_number || '',
        address: home.address || '',
        city: home.city || '',
        zip: home.zip || '',
        bed_capacity: home.bed_capacity || 6,
        phone: home.phone || '',
        email: home.email || '',
      })
    }
  })

  const updateSettings = useMutation({
    mutationFn: async (data) => {
      await updateHome(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home'])
    },
  })

  const onSubmit = (data) => {
    updateSettings.mutate(data)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your home settings and preferences</p>
      </div>

      <div className="flex gap-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Home Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  {...register('business_name')}
                  className={`form-input ${errors.business_name ? 'form-input-error' : ''}`}
                />
                {errors.business_name && (
                  <p className="form-error">{errors.business_name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">DSHS License Number</label>
                <input
                  type="text"
                  {...register('license_number')}
                  className={`form-input ${errors.license_number ? 'form-input-error' : ''}`}
                />
                {errors.license_number && (
                  <p className="form-error">{errors.license_number.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className={`form-input ${errors.address ? 'form-input-error' : ''}`}
                />
                {errors.address && (
                  <p className="form-error">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  {...register('city')}
                  className={`form-input ${errors.city ? 'form-input-error' : ''}`}
                />
                {errors.city && (
                  <p className="form-error">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  {...register('zip')}
                  className={`form-input ${errors.zip ? 'form-input-error' : ''}`}
                />
                {errors.zip && (
                  <p className="form-error">{errors.zip.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Bed Capacity</label>
                <select
                  {...register('bed_capacity', { valueAsNumber: true })}
                  className="form-input"
                >
                  {[6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} beds</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="btn btn-primary"
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Document Management</h2>
            <p className="text-slate-500">
              Upload and manage required documents for DSHS inspections.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">Drag and drop files here, or click to browse</p>
              <p className="text-sm text-slate-500">PDF, DOC, JPG up to 10MB</p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { id: 'email_incidents', label: 'Email notifications for new incidents', description: 'Receive an email when a new incident is reported' },
                { id: 'email_expiring', label: 'Email notifications for expiring documents', description: 'Get reminded 30 days before documents expire' },
                { id: 'email_certs', label: 'Email notifications for expiring certifications', description: 'Get reminded when staff certifications are expiring' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-700">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Security Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">Change Password</p>
                <p className="text-sm text-slate-500 mb-3">Update your password regularly for security</p>
                <button className="btn btn-secondary text-sm">Change Password</button>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 mb-3">Add an extra layer of security to your account</p>
                <button className="btn btn-secondary text-sm">Enable 2FA</button>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">Active Sessions</p>
                <p className="text-sm text-slate-500 mb-3">Manage your active login sessions</p>
                <div className="text-sm text-slate-600">
                  <p>Current session: {user?.email}</p>
                  <p className="text-slate-400 text-xs mt-1">Last active: Just now</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}