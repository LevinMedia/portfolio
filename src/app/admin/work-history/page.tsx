'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import CompanyLogoUploader from '@/app/components/CompanyLogoUploader'
import Input from '@/app/components/ui/Input'
import Textarea from '@/app/components/ui/Textarea'
import Select from '@/app/components/ui/Select'

interface WorkPosition {
  id: string
  position_title: string
  position_description?: string
  start_date: string
  end_date?: string
  position_order: number
}

interface WorkCompany {
  id: string
  company_name: string
  company_logo_url?: string
  employment_type?: string
  display_order: number
  positions: WorkPosition[]
}

interface CompanyFormData {
  company_name: string
  company_logo_url: string
  employment_type: string
}

interface PositionFormData {
  position_title: string
  position_description: string
  start_date: string
  end_date: string
}

export default function WorkHistoryAdmin() {
  const [companies, setCompanies] = useState<WorkCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [showPositionForm, setShowPositionForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<WorkCompany | null>(null)
  const [editingPosition, setEditingPosition] = useState<{ company: WorkCompany; position: WorkPosition } | null>(null)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [showLogoUploader, setShowLogoUploader] = useState(false)
  const [imageLoadError, setImageLoadError] = useState<string | null>(null)

  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    company_name: '',
    company_logo_url: '',
    employment_type: ''
  })

  const [positionForm, setPositionForm] = useState<PositionFormData>({
    position_title: '',
    position_description: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchWorkHistory()
  }, [])

  const fetchWorkHistory = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching work history...')
      const response = await fetch('/api/admin/work-history')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Fetched work history result:', result)
        setCompanies(result || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch work history:', errorData)
      }
    } catch (error) {
      console.error('Error fetching work history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedCompanies(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(companyId)) {
        newExpanded.delete(companyId)
      } else {
        newExpanded.add(companyId)
      }
      return newExpanded
    })
  }

  const handleAddCompany = () => {
    setEditingCompany(null)
    setCompanyForm({
      company_name: '',
      company_logo_url: '',
      employment_type: ''
    })
    setShowCompanyForm(true)
  }

  const handleEditCompany = (company: WorkCompany) => {
    setEditingCompany(company)
    setCompanyForm({
      company_name: company.company_name,
      company_logo_url: company.company_logo_url || '',
      employment_type: company.employment_type || ''
    })
    setShowCompanyForm(true)
  }

  const handleSaveCompany = async () => {
    try {
      const response = await fetch('/api/admin/work-history', {
        method: editingCompany ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'company',
          data: {
            ...companyForm,
            id: editingCompany?.id
          }
        }),
      })

      if (response.ok) {
        setShowCompanyForm(false)
        setEditingCompany(null)
        fetchWorkHistory() // Refresh data
      } else {
        console.error('Failed to save company')
      }
    } catch (error) {
      console.error('Error saving company:', error)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm('Are you sure you want to delete this company and all its positions?')) {
      try {
        // This would be replaced with actual API call
        console.log('Deleting company:', companyId)
        fetchWorkHistory() // Refresh data
      } catch (error) {
        console.error('Error deleting company:', error)
      }
    }
  }

  const handleAddPosition = (company: WorkCompany) => {
    setSelectedCompanyId(company.id)
    setEditingPosition(null)
    setPositionForm({
      position_title: '',
      position_description: '',
      start_date: '',
      end_date: ''
    })
    setShowPositionForm(true)
  }

  const handleEditPosition = (company: WorkCompany, position: WorkPosition) => {
    setSelectedCompanyId(company.id)
    setEditingPosition({ company, position })
    setPositionForm({
      position_title: position.position_title,
      position_description: position.position_description || '',
      start_date: position.start_date,
      end_date: position.end_date || ''
    })
    setShowPositionForm(true)
  }

  const handleSavePosition = async () => {
    try {
      const response = await fetch('/api/admin/work-history', {
        method: editingPosition ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'position',
          data: {
            ...positionForm,
            company_id: selectedCompanyId,
            id: editingPosition?.position.id
          }
        }),
      })

      if (response.ok) {
        setShowPositionForm(false)
        setEditingPosition(null)
        fetchWorkHistory() // Refresh data
      } else {
        console.error('Failed to save position')
      }
    } catch (error) {
      console.error('Error saving position:', error)
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    if (confirm('Are you sure you want to delete this position?')) {
      try {
        // This would be replaced with actual API call
        console.log('Deleting position:', positionId)
        fetchWorkHistory() // Refresh data
      } catch (error) {
        console.error('Error deleting position:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Work History Management</h1>
        <button
          onClick={handleAddCompany}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Company
        </button>
      </div>

      {/* Companies List */}
      <div className="bg-background border border-border/20 shadow overflow-hidden sm:rounded-md" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <ul className="divide-y divide-border/20">
          {companies.filter(company => company && company.id).map((company, index) => (
            <li key={company.id || `company-${index}`}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCompanyExpansion(company.id)}
                    className="mr-3 flex-shrink-0"
                  >
                    {expandedCompanies.has(company.id) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Company Logo */}
                  {company.company_logo_url && (
                    <div className="w-8 h-8 relative mr-3 flex-shrink-0 border border-border/20 rounded">
                      <Image
                        src={company.company_logo_url}
                        alt={`${company.company_name} logo`}
                        fill
                        className="object-contain"
                        onError={() => {
                          console.error('Company logo failed to load:', company.company_logo_url)
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-primary truncate">
                        {company.company_name}
                      </p>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {company.employment_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {company.positions.length} position{company.positions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddPosition(company)}
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Add Position"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEditCompany(company)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Company"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                    title="Delete Company"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Positions */}
              {expandedCompanies.has(company.id) && (
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    {company.positions.filter(position => position && position.id).map((position, index) => (
                      <div key={position.id || `position-${index}`} className="ml-8 bg-muted rounded-lg p-4 border border-border/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {position.position_title}
                            </h4>
                            {position.position_description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {position.position_description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(position.start_date).toLocaleDateString()} - {position.end_date ? new Date(position.end_date).toLocaleDateString() : 'Present'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditPosition(company, position)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit Position"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(position.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Delete Position"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Company Form Modal */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-background border-border/20" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h3>
              <form className="space-y-4">
                <Input
                  label="Company Name"
                  type="text"
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Logo
                  </label>
                  
                  {/* Logo Preview */}
                  {companyForm.company_logo_url && (
                    <div className="mb-4 p-4 border border-border/20 rounded-lg bg-muted/5">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 relative border border-border/20 rounded bg-muted/10 flex items-center justify-center">
                          {imageLoadError === companyForm.company_logo_url ? (
                            <PhotoIcon className="w-8 h-8 text-muted-foreground" />
                          ) : (
                            <>
                              <Image
                                src={companyForm.company_logo_url}
                                alt="Company logo"
                                fill
                                className="object-contain"
                                onError={() => {
                                  console.error('Next.js Image failed to load:', companyForm.company_logo_url)
                                  setImageLoadError(companyForm.company_logo_url)
                                }}
                                onLoad={() => {
                                  console.log('Next.js Image loaded successfully:', companyForm.company_logo_url)
                                  if (imageLoadError === companyForm.company_logo_url) {
                                    setImageLoadError(null)
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground/60">Current logo</p>
                          <p className="text-xs text-muted-foreground break-all">
                            {companyForm.company_logo_url}
                          </p>
                          {imageLoadError === companyForm.company_logo_url && (
                            <p className="text-xs text-destructive mt-1">
                              Failed to load image
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Logo Upload Button */}
                  <button
                    type="button"
                    onClick={() => setShowLogoUploader(true)}
                    className="inline-flex items-center px-4 py-2 border border-border/20 rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    {companyForm.company_logo_url ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  
                  {/* Manual URL Input (fallback) */}
                  <div className="mt-3">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Or enter URL manually:
                    </label>
                    <input
                      type="text"
                      value={companyForm.company_logo_url}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_logo_url: e.target.value })}
                      className="block w-full px-3 py-2 border border-border/20 rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                <Select
                  label="Employment Type"
                  value={companyForm.employment_type}
                  onChange={(e) => setCompanyForm({ ...companyForm, employment_type: e.target.value })}
                  options={[
                    { value: '', label: 'Select type' },
                    { value: 'Full-time Remote', label: 'Full-time Remote' },
                    { value: 'Full-time On-site', label: 'Full-time On-site' },
                    { value: 'Full-time Hybrid', label: 'Full-time Hybrid' },
                    { value: 'Contract Remote', label: 'Contract Remote' },
                    { value: 'Contract On-site', label: 'Contract On-site' },
                    { value: 'Self-employed / Freelance', label: 'Self-employed / Freelance' },
                    { value: 'Remote / Full-time', label: 'Remote / Full-time' },
                    { value: 'Hybrid / Full-time', label: 'Hybrid / Full-time' },
                  ]}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCompanyForm(false)}
                    className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCompany}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Position Form Modal */}
      {showPositionForm && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-background border-border/20" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {editingPosition ? 'Edit Position' : 'Add Position'}
              </h3>
              <form className="space-y-4">
                <Input
                  label="Position Title"
                  type="text"
                  value={positionForm.position_title}
                  onChange={(e) => setPositionForm({ ...positionForm, position_title: e.target.value })}
                  placeholder="Enter position title"
                />
                <Textarea
                  label="Description"
                  value={positionForm.position_description}
                  onChange={(e) => setPositionForm({ ...positionForm, position_description: e.target.value })}
                  rows={3}
                  placeholder="Enter position description"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={positionForm.start_date}
                    onChange={(e) => setPositionForm({ ...positionForm, start_date: e.target.value })}
                  />
                  <Input
                    label="End Date (leave empty for current)"
                    type="date"
                    value={positionForm.end_date}
                    onChange={(e) => setPositionForm({ ...positionForm, end_date: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPositionForm(false)}
                    className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePosition}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Company Logo Uploader */}
      {showLogoUploader && (
        <CompanyLogoUploader
          currentLogo={companyForm.company_logo_url}
          currentAlt={`${companyForm.company_name} logo`}
          onLogoChange={(logoUrl) => {
            setCompanyForm({ ...companyForm, company_logo_url: logoUrl })
            setShowLogoUploader(false)
          }}
          onClose={() => setShowLogoUploader(false)}
        />
      )}
    </div>
  )
}
