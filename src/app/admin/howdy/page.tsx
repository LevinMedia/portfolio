'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import ImageUploader from '@/app/components/ImageUploader'

interface HowdyData {
  id: string
  image_src: string
  image_alt: string
  greeting: string
  li_1: string
  li_2: string
}

export default function HowdyAdmin() {
  const [data, setData] = useState<HowdyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState<HowdyData>({
    id: '',
    image_src: '',
    image_alt: '',
    greeting: '',
    li_1: '',
    li_2: ''
  })

  // Check if there are unsaved changes
  const hasChanges = data && (
    formData.image_src !== data.image_src ||
    formData.image_alt !== data.image_alt ||
    formData.greeting !== data.greeting ||
    formData.li_1 !== data.li_1 ||
    formData.li_2 !== data.li_2
  )

  useEffect(() => {
    fetchHowdyData()
  }, [])

  const fetchHowdyData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/howdy')
      if (response.ok) {
        const result = await response.json()
        setData(result)
        setFormData(result)
      } else {
        console.error('Failed to fetch howdy data')
      }
    } catch (error) {
      console.error('Error fetching howdy data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/admin/howdy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setData(result)
        console.log('Howdy content saved successfully')
        
        // Trigger cache revalidation
        try {
          const revalidateResponse = await fetch('/api/revalidate/howdy', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REVALIDATION_SECRET || 'your-secret-key'}`,
            },
          })
          
          if (revalidateResponse.ok) {
            console.log('Cache revalidated successfully')
          } else {
            console.warn('Failed to revalidate cache, but content was saved')
          }
        } catch (revalidateError) {
          console.warn('Failed to revalidate cache:', revalidateError)
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to save howdy data:', errorData.error)
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Error saving howdy data:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent, field: keyof HowdyData) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditingField(null)
    }
    if (e.key === 'Escape') {
      setEditingField(null)
      // Reset to original value
      if (data) {
        setFormData(prev => ({ ...prev, [field]: data[field] }))
      }
    }
  }

  // Convert database fields to component format
  const listItems: { emoji: string; text: string }[] = []
  if (formData.li_1) {
    const [emoji, ...textParts] = formData.li_1.split(' ')
    listItems.push({
      emoji: emoji || '•',
      text: textParts.join(' ')
    })
  }
  if (formData.li_2) {
    const [emoji, ...textParts] = formData.li_2.split(' ')
    listItems.push({
      emoji: emoji || '•',
      text: textParts.join(' ')
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">Admin</span>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground">Howdy</span>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Howdy Content Management</h1>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckIcon className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>

      {/* Live WYSIWYG Editor - Using the actual Howdy component structure */}
      <div className="bg-background border border-border/20 rounded-lg p-8 shadow-lg" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <div className="text-sm text-muted-foreground mb-6 flex items-center">
          <PencilIcon className="h-4 w-4 mr-2" />
          Click on any element to edit it directly
        </div>

        {/* Actual Howdy Component Structure - But Editable */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start" style={{ gap: 'var(--grid-major)' }}>
          {/* Image Box - Editable */}
          <div 
            className="relative border border-blue-200/15 rounded-none lg:flex-shrink-0 mx-auto lg:mx-0 image-container group cursor-pointer hover:border-primary/50 transition-colors" 
            style={{ 
              padding: 'var(--grid-major)'
            }}
            onClick={() => setEditingField('image_src')}
          >
            {formData.image_src ? (
              <Image 
                src={formData.image_src} 
                alt={formData.image_alt}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border/20 rounded">
                <span className="text-sm">Click to add image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <PencilIcon className="h-6 w-6 text-white" />
            </div>
          </div>

          <main className="relative flex flex-col items-center sm:items-start border border-blue-200/15 rounded-none w-full lg:flex-grow" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
            {/* Greeting - Editable */}
            <div 
              className="w-full border border-blue-200/10 rounded-none group cursor-pointer hover:border-primary/50 transition-colors" 
              style={{ padding: 'var(--grid-major)' }}
              onClick={() => setEditingField('greeting')}
            >
              {editingField === 'greeting' ? (
                <input
                  type="text"
                  value={formData.greeting}
                  onChange={(e) => setFormData(prev => ({ ...prev, greeting: e.target.value }))}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => handleKeyDown(e, 'greeting')}
                  className="w-full text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                <div className="relative group-hover:bg-primary/5 transition-colors">
                  <div className="text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)]">
                    {formData.greeting || 'Click to add greeting...'}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PencilIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
            
            {/* List Items - Single Editable Area (matches frontend structure) */}
            <div 
              className="w-full border border-blue-200/10 rounded-none group cursor-pointer hover:border-primary/50 transition-colors" 
              style={{ padding: 'var(--grid-major)' }}
              onClick={() => setEditingField('li_1')}
            >
              <div className="relative group-hover:bg-primary/5 transition-colors">
                <ul className="w-full list-none text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)]">
                  {/* First List Item - Editable */}
                  <li className="tracking-[-.01em] flex items-start gap-2" style={{ marginBottom: listItems.length > 1 ? 'var(--grid-major)' : '0' }}>
                    {editingField === 'li_1' ? (
                      <input
                        type="text"
                        value={formData.li_1}
                        onChange={(e) => setFormData(prev => ({ ...prev, li_1: e.target.value }))}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => handleKeyDown(e, 'li_1')}
                        className="flex-1 text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] bg-transparent border-none outline-none"
                        placeholder="Enter list item (e.g., 🚀 I orchestrate software architecture)"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-lg">{listItems[0]?.emoji || '•'}</span>
                        <span onClick={(e) => {
                          e.stopPropagation()
                          setEditingField('li_1')
                        }} className="flex-1 cursor-pointer">
                          {listItems[0]?.text || 'Click to add first list item...'}
                        </span>
                      </>
                    )}
                  </li>
                  
                  {/* Second List Item - Editable */}
                  {listItems.length > 1 && (
                    <li className="tracking-[-.01em] flex items-start gap-2">
                      {editingField === 'li_2' ? (
                        <input
                          type="text"
                          value={formData.li_2}
                          onChange={(e) => setFormData(prev => ({ ...prev, li_2: e.target.value }))}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => handleKeyDown(e, 'li_2')}
                          className="flex-1 text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] bg-transparent border-none outline-none"
                          placeholder="Enter second list item (e.g., 🎯 Let's make awesome happen)"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="text-lg">{listItems[1]?.emoji || '•'}</span>
                          <span onClick={(e) => {
                            e.stopPropagation()
                            setEditingField('li_2')
                          }} className="flex-1 cursor-pointer">
                            {listItems[1]?.text || 'Click to add second list item...'}
                          </span>
                        </>
                      )}
                    </li>
                  )}
                  
                  {/* Add second item if only one exists */}
                  {listItems.length === 1 && (
                    <li className="tracking-[-.01em] flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingField('li_2')
                        }} 
                        className="flex-1 cursor-pointer text-muted-foreground"
                      >
                        Click to add second list item...
                      </span>
                    </li>
                  )}
                </ul>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PencilIcon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Buttons - Non-editable for now */}
            <div className="w-full flex items-stretch flex-row border border-blue-200/15 rounded-none" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
              <button className="flex-1 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded border border-transparent hover:bg-primary/90 transition-colors">
                View selected work
              </button>
              <button className="flex-1 bg-transparent text-primary px-4 py-2 text-sm font-medium rounded border border-primary hover:bg-primary/10 transition-colors">
                Site settings
              </button>
            </div>
          </main>
        </div>

        {/* Image Uploader Modal */}
        {editingField === 'image_src' && (
          <ImageUploader
            currentImage={formData.image_src}
            currentAlt={formData.image_alt}
            onImageChange={(imageUrl, altText) => {
              setFormData(prev => ({ 
                ...prev, 
                image_src: imageUrl, 
                image_alt: altText 
              }))
              setEditingField(null)
            }}
            onClose={() => setEditingField(null)}
          />
        )}
      </div>
    </div>
  )
}