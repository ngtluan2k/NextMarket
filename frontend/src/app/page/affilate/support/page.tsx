"use client"

import { DashboardLayout } from "../../../components/affilate/dashboard/dashboard-layout" 

export default function AffiliateSupportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Ilelakinwa Olajide</span>
            <span>/</span>
            <span>Support</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600">Get help and contact our support team.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}