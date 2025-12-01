"use client";
import React from 'react'
import { Package } from 'lucide-react'

export default function GoodsReceivedView({ clients, products, received, selectedGoodsReceivedClient, setSelectedGoodsReceivedClient, openReceiveModal, BRAND }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Goods Received</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Filter by Client:</label>
          <select
            value={selectedGoodsReceivedClient || ''}
            onChange={(e) => setSelectedGoodsReceivedClient(e.target.value ? parseInt(e.target.value) : null)}
            className="select-base"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedGoodsReceivedClient && (
        <div className="card p-5 border-l-4 border-brand-green">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {clients.find(c => c.id === selectedGoodsReceivedClient)?.name}
              </h3>
              <p className="text-sm text-gray-500">Ready to receive goods</p>
            </div>
          <button
            onClick={() => openReceiveModal(selectedGoodsReceivedClient)}
            className="btn-primary"
          >
              <Package className="h-4 w-4 mr-2" />
              Receive Goods
            </button>
          </div>
        </div>
      )}

      {!selectedGoodsReceivedClient && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-sm text-blue-700">
            Select a client from the dropdown above to receive goods or view all receipts below.
          </p>
        </div>
      )}

      <div className="table-wrapper">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Receiving History
            {selectedGoodsReceivedClient && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({clients.find(c => c.id === selectedGoodsReceivedClient)?.name})
              </span>
            )}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              {!selectedGoodsReceivedClient && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pallets</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exp Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QC Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {received
              .filter(item => !selectedGoodsReceivedClient || item.clientId === selectedGoodsReceivedClient)
              .map(item => {
                const client = clients.find(c => c.id === item.clientId)
                const product = products.find(p => p.id === item.productId)
                const isPassed = item.qcPassed !== false
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                    {!selectedGoodsReceivedClient && (
                      <td className="px-6 py-4 text-sm text-gray-500">{client?.name}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">{product?.name}</td>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: BRAND.bambooGreen }}>{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.pallets}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.lotNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.expirationDate || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.poNumber}</td>
                    <td className="px-6 py-4 text-sm">
                      {isPassed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: BRAND.bambooGreen }}>
                          ✓ Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ⚠ Issues
                        </span>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">📷 {item.photos.length}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
