'use client'

export default function GuestbookAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Guestbook Management</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Guestbook Management
            </h3>
            <p className="text-gray-500 mb-4">
              Manage visitor messages, moderate comments, and respond to guestbook entries.
            </p>
            <div className="text-sm text-gray-400">
              This feature will be implemented in a future update.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
