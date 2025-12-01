"use client";
import React from 'react'
import { FileText } from 'lucide-react'

export default function ReportsView({ clients, shipments, received, products, selectedReportClient, setSelectedReportClient, dateRange, setDateRange, exportShipmentsCSV, exportReceivedCSV, BRAND }) {
  return (
    <div className="space-y-6">
      {!selectedReportClient ? (
        <>
          <h2 className="text-3xl font-bold text-gray-900">Reports - Select Client</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => {
              const clientShipments = shipments.filter(s => s.clientId === client.id)
              const clientReceived = received.filter(r => r.clientId === client.id)
              return (
                <div
                  key={client.id}
                  className="bg-white shadow rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedReportClient(client.id)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{client.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Shipments:</span>
                      <span className="text-sm font-medium">{clientShipments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Receipts:</span>
                      <span className="text-sm font-medium">{clientReceived.length}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedReportClient(null)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-gray-900">
                {clients.find(c => c.id === selectedReportClient)?.name} - Reports
              </h2>
            </div>
          </div>

          <div className="card p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Shipments Report</h3>
              <button
                onClick={() => exportShipmentsCSV(selectedReportClient)}
                className="btn-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package Breakdown</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipments
                  .filter(s => s.clientId === selectedReportClient)
                  .filter(s => {
                    if (!dateRange.start || !dateRange.end) return true
                    return s.date >= dateRange.start && s.date <= dateRange.end
                  })
                  .map(shipment => (
                    <tr key={shipment.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{shipment.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{shipment.packages}</td>
                      <td className="px-6 py-4 text-sm">
                        {shipment.singlePacks !== undefined ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs">S:{shipment.singlePacks || 0}</span>
                            {shipment.twoPacks > 0 && <span className="text-xs" style={{ color: BRAND.boxOrange }}>2P:{shipment.twoPacks}</span>}
                            {shipment.threePacks > 0 && <span className="text-xs" style={{ color: BRAND.boxOrange }}>3P:{shipment.threePacks}</span>}
                            {shipment.fourPacks > 0 && <span className="text-xs" style={{ color: BRAND.boxOrange }}>4P:{shipment.fourPacks}</span>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{shipment.totalItems || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrapper">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Goods Received Report</h3>
              <button
                onClick={() => exportReceivedCSV(selectedReportClient)}
                className="btn-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pallets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exp Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QC Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {received
                  .filter(r => r.clientId === selectedReportClient)
                  .filter(r => {
                    if (!dateRange.start || !dateRange.end) return true
                    return r.date >= dateRange.start && r.date <= dateRange.end
                  })
                  .map(receipt => {
                    const product = products.find(p => p.id === receipt.productId)
                    const isPassed = receipt.qcPassed !== false
                    return (
                      <tr key={receipt.id} className={isPassed ? '' : 'bg-red-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900">{receipt.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{product?.name}</td>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: BRAND.bambooGreen }}>{receipt.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{receipt.pallets}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{receipt.lotNumber || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{receipt.expirationDate || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            {isPassed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: BRAND.bambooGreen }}>
                                ✓ Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ⚠ Issues
                              </span>
                            )}
                            {receipt.photos && receipt.photos.length > 0 && (
                              <span className="ml-2 text-xs text-gray-500">📷 {receipt.photos.length}</span>
                            )}
                          </div>
                          {receipt.damageNotes && (
                            <p className="mt-1 text-xs text-red-600">{receipt.damageNotes}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
