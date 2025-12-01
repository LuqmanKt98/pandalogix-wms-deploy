"use client";
import React from 'react'
import { Package, AlertCircle, Boxes, FileText } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function Dashboard({ clients, shipments, received, products, selectedDashboardClient, setSelectedDashboardClient, BRAND }) {
  const filteredShipments = selectedDashboardClient 
    ? shipments.filter(s => s.clientId === selectedDashboardClient)
    : shipments
  const filteredReceived = selectedDashboardClient
    ? received.filter(r => r.clientId === selectedDashboardClient)
    : received
  const filteredProducts = selectedDashboardClient
    ? products.filter(p => p.clientId === selectedDashboardClient)
    : products

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">View Client:</label>
          <select
            value={selectedDashboardClient || ''}
            onChange={(e) => setSelectedDashboardClient(e.target.value ? parseInt(e.target.value) : null)}
            className="select-base"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedDashboardClient && (
        <div className="card p-4 border-l-4 border-brand-green">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {clients.find(c => c.id === selectedDashboardClient)?.name}
              </h3>
              <p className="text-sm text-gray-500">
                Contact: {clients.find(c => c.id === selectedDashboardClient)?.contact} |
                {' '}Phone: {clients.find(c => c.id === selectedDashboardClient)?.phone}
              </p>
            </div>
            <button
              onClick={() => setSelectedDashboardClient(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View All Clients
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-gray-400" />
            <div className="ml-5 w-full">
              <dt className="text-sm font-medium text-gray-500">Total Shipments</dt>
              <dd className="text-2xl font-semibold text-gray-900">{filteredShipments.length}</dd>
              <dd className="text-xs text-gray-500 mt-1">
                Last 30 days: {filteredShipments.filter(s => {
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return new Date(s.date) >= thirtyDaysAgo
                }).length}
              </dd>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-gray-400" />
            <div className="ml-5 w-full">
              <dt className="text-sm font-medium text-gray-500">Goods Received</dt>
              <dd className="text-2xl font-semibold text-gray-900">{filteredReceived.length}</dd>
              <dd className="text-xs text-gray-500 mt-1">
                Total Units: {filteredReceived.reduce((sum, r) => sum + r.quantity, 0).toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <Boxes className="h-6 w-6 text-gray-400" />
            <div className="ml-5 w-full">
              <dt className="text-sm font-medium text-gray-500">Total Inventory</dt>
              <dd className="text-2xl font-semibold" style={{ color: BRAND.bambooGreen }}>
                {filteredProducts.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
              </dd>
              <dd className="text-xs text-gray-500 mt-1">
                {filteredProducts.length} SKU{filteredProducts.length !== 1 ? 's' : ''}
              </dd>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-gray-400" />
            <div className="ml-5 w-full">
              <dt className="text-sm font-medium text-gray-500">Alerts</dt>
              <dd className="text-2xl font-semibold" style={{ color: filteredProducts.filter(p => p.quantity < p.minStock).length > 0 ? '#EF4444' : BRAND.bambooGreen }}>
                {filteredProducts.filter(p => p.quantity < p.minStock).length}
              </dd>
              <dd className="text-xs text-gray-500 mt-1">Low stock items</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Inspections:</span>
              <span className="text-sm font-semibold">{filteredReceived.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">QC Passed:</span>
              <span className="text-sm font-semibold" style={{ color: BRAND.bambooGreen }}>
                {filteredReceived.filter(r => r.qcPassed !== false).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">QC Issues:</span>
              <span className="text-sm font-semibold text-red-600">
                {filteredReceived.filter(r => r.qcPassed === false).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Pass Rate:</span>
              <span className="text-sm font-semibold" style={{ color: BRAND.bambooGreen }}>
                {filteredReceived.length > 0 ? Math.round((filteredReceived.filter(r => r.qcPassed !== false).length / filteredReceived.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Photos Captured:</span>
              <span className="text-sm font-semibold">
                {filteredReceived.reduce((sum, r) => sum + (r.photos?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expiring Soon</h3>
          <div className="space-y-2">
            {(() => {
              const thirtyDaysFromNow = new Date()
              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
              const expiringSoon = filteredReceived.filter(r => {
                if (!r.expirationDate) return false
                return new Date(r.expirationDate) <= thirtyDaysFromNow && new Date(r.expirationDate) >= new Date()
              })
              if (expiringSoon.length === 0) {
                return <p className="text-sm text-gray-500">No items expiring in the next 30 days</p>
              }
              return expiringSoon.slice(0, 5).map(r => {
                const product = products.find(p => p.id === r.productId)
                const client = clients.find(c => c.id === r.clientId)
                return (
                  <div key={r.id} className="flex justify-between items-center text-sm border-l-4 pl-3" style={{ borderColor: BRAND.boxOrange }}>
                    <div>
                      <p className="font-medium text-gray-900">{product?.name}</p>
                      <p className="text-xs text-gray-500">{!selectedDashboardClient && client?.name + ' - '}Lot: {r.lotNumber}</p>
                    </div>
                    <span className="text-xs font-medium" style={{ color: BRAND.boxOrange }}>
                      {r.expirationDate}
                    </span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>

      {!selectedDashboardClient ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipments by Client</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clients.map(client => ({
                name: client.name.split(' ')[0],
                packages: shipments.filter(s => s.clientId === client.id).reduce((sum, s) => sum + (s.packages || 0), 0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="packages" fill={BRAND.bambooGreen} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Received vs Shipped (Units)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clients.map(client => ({
                name: client.name.split(' ')[0],
                received: received.filter(r => r.clientId === client.id).reduce((sum, r) => sum + r.quantity, 0),
                shipped: shipments.filter(s => s.clientId === client.id).reduce((sum, s) => sum + (s.totalItems || 0), 0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="received" fill={BRAND.bambooGreen} name="Received" />
                <Bar dataKey="shipped" fill={BRAND.boxOrange} name="Shipped" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Received vs Shipped (Units)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{
              name: 'Total',
              received: filteredReceived.reduce((sum, r) => sum + r.quantity, 0),
              shipped: filteredShipments.reduce((sum, s) => sum + (s.totalItems || 0), 0)
            }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="received" fill={BRAND.bambooGreen} name="Received" />
              <Bar dataKey="shipped" fill={BRAND.boxOrange} name="Shipped" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
