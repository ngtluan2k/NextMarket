"use client"

import type React from "react"
import { Card, Button } from "antd"
import { BookOpen, ExternalLink } from "lucide-react"

export function Resources() {
  const resources = [
    {
      title: "Affiliate Marketing Guide",
      description: "Learn the basics of affiliate marketing and how to maximize your earnings.",
      link: "https://skilarna.com/guides/affiliate-marketing",
    },
    {
      title: "Promotional Strategies",
      description: "Discover effective strategies to promote your affiliate links.",
      link: "https://skilarna.com/guides/promotion-strategies",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Ilelakinwa Olajide</span>
          <span>/</span>
          <span>Resources</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
        <p className="text-gray-600">Access helpful guides and materials to boost your affiliate success.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource) => (
          <Card key={resource.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{resource.title}</p>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
              </div>
              <Button className="text-gray-600 hover:bg-gray-50">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

