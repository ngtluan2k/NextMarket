"use client"

import type React from "react"
import { Card, Button } from "antd"
import { Link2, Copy, ExternalLink } from "lucide-react"

export function AffiliateLinks() {
  const affiliateLinks = [
    {
      name: "Primary Link",
      url: "uui.com/40B0020",
      clicks: 0,
      conversions: 0,
      status: "Active",
    },
    {
      name: "Secondary Link",
      url: "uui.com/40B0021",
      clicks: 0,
      conversions: 0,
      status: "Active",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Ilelakinwa Olajide</span>
          <span>/</span>
          <span>Affiliate Links</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Affiliate Links</h1>
        <p className="text-gray-600">Manage and track your affiliate links.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          Create New Link
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {affiliateLinks.map((link) => (
          <Card key={link.name} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.name}</p>
                  <p className="text-xs text-gray-600">{link.url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="text-gray-600 hover:bg-gray-50">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button className="text-gray-600 hover:bg-gray-50">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Clicks</p>
                <p className="text-lg font-bold text-gray-900">{link.clicks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-lg font-bold text-gray-900">{link.conversions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-sm text-green-600">{link.status}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
