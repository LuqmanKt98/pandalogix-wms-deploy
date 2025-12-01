"use client";
import React from 'react'
import { Package } from 'lucide-react'

export default function ShipmentsView({ clients, shipments, selectedShipmentsClient, setSelectedShipmentsClient, openShipmentModal, BRAND }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Shipments</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Filter by Client:</label>
          <select
            value={selectedShipmentsClient || ''}
            onChange={(e) => setSelectedShipmentsClient(e.target.value ? parseInt(e.target.value) : null)}
            className="select-base"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedShipmentsClient && (
        <div className="card p-5 border-l-4 border-brand-green">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {clients.find(c => c.id === selectedShipmentsClient)?.name}
              </h3>
              <p className="text-sm text-gray-500">Ready to add shipment</p>
            </div>
            <button
              onClick={() => openShipmentModal(selectedShipmentsClient)}
              className="btn-primary"
            >
              <Package className="h-4 w-4 mr-2" />
              Add Shipment
            </button>
          </div>
        </div>
      )}

      {!selectedShipmentsClient && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-sm text-blue-700">
            Select a client from the dropdown above to add a shipment or view all shipments below.
          </p>
        </div>
      )}

      <div className="table-wrapper">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Shipments
            {selectedShipmentsClient && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({clients.find(c => c.id === selectedShipmentsClient)?.name})
              </span>
            )}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              {!selectedShipmentsClient && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Packages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package Breakdown</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments
              .filter(shipment => !selectedShipmentsClient || shipment.clientId === selectedShipmentsClient)
              .slice(0, 20)
              .map(shipment => {
                const client = clients.find(c => c.id === shipment.clientId)
                return (
                  <tr key={shipment.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.date}</td>
                    {!selectedShipmentsClient && (
                      <td className="px-6 py-4 text-sm text-gray-500">{client?.name}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.packages}</td>
                    <td className="px-6 py-4 text-sm">
                      {shipment.singlePacks !== undefined ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            Single: {shipment.singlePacks || 0}
                          </span>
                          {shipment.twoPacks > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded text-white" style={{ backgroundColor: BRAND.boxOrange }}>
                              2-Packs: {shipment.twoPacks}
                            </span>
                          )}
                          {shipment.threePacks > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded text-white" style={{ backgroundColor: BRAND.boxOrange }}>
                              3-Packs: {shipment.threePacks}
                            </span>
                          )}
                          {shipment.fourPacks > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded text-white" style={{ backgroundColor: BRAND.boxOrange }}>
                              4-Packs: {shipment.fourPacks}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.totalItems || '-'}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
