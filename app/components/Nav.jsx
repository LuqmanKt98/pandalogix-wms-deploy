"use client";
import Image from 'next/image'
import { Package, TrendingUp, AlertCircle, Boxes, FileText, Building2 } from 'lucide-react'

export default function Nav({ activeTab, setActiveTab, LOGO, BRAND }) {
  const tabs = [
    { key: 'dashboard', label: 'dashboard', icon: TrendingUp },
    { key: 'clients', label: 'clients', icon: Building2 },
    { key: 'goods-received', label: 'goods-received', icon: Package },
    { key: 'shipments', label: 'shipments', icon: Package },
    { key: 'inventory', label: 'inventory', icon: Boxes },
    { key: 'reports', label: 'reports', icon: FileText },
  ]

  return (
    <div className="w-64 text-white min-h-screen bg-brand-black">
      <div className="p-6 flex justify-center items-center">
        <Image src={LOGO} alt="PandaLogix" width={128} height={128} className="mb-4" unoptimized />
      </div>
      <nav className="space-y-1 px-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`sidebar-link ${activeTab === key ? 'bg-brand-green text-white' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" />
            <span className="capitalize">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
