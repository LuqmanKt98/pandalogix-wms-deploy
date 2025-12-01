"use client";
import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function InventoryView({ clients, products, selectedInventoryClient, setSelectedInventoryClient, BRAND }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Inventory Management</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Filter by Client:</label>
          <select
            value={selectedInventoryClient || ''}
            onChange={(e) => setSelectedInventoryClient(e.target.value ? parseInt(e.target.value) : null)}
            className="select-base"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedInventoryClient ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => {
            const clientProducts = products.filter(p => p.clientId === client.id)
            const totalInventory = clientProducts.reduce((sum, p) => sum + p.quantity, 0)
            const lowStock = clientProducts.filter(p => p.quantity < p.minStock).length
            return (
              <div key={client.id} className="card p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{client.name}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total SKUs</p>
                    <p className="text-2xl font-bold text-gray-900">{clientProducts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Units</p>
                    <p className="text-2xl font-bold" style={{ color: BRAND.bambooGreen }}>{totalInventory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Low Stock Items</p>
                    <p className="text-2xl font-bold" style={{ color: lowStock > 0 ? '#EF4444' : BRAND.bambooGreen }}>{lowStock}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        (() => {
          const clientProducts = products.filter(p => p.clientId === selectedInventoryClient)
          const totalInventory = clientProducts.reduce((sum, p) => sum + p.quantity, 0)
          const lowStock = clientProducts.filter(p => p.quantity < p.minStock).length
          return (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {clients.find(c => c.id === selectedInventoryClient)?.name}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total SKUs</p>
                  <p className="text-2xl font-bold text-gray-900">{clientProducts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Units</p>
                  <p className="text-2xl font-bold" style={{ color: BRAND.bambooGreen }}>{totalInventory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-bold" style={{ color: lowStock > 0 ? '#EF4444' : BRAND.bambooGreen }}>{lowStock}</p>
                </div>
              </div>
            </div>
          )
        })()
      )}

      <div className="table-wrapper overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            All Products
            {selectedInventoryClient && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({clients.find(c => c.id === selectedInventoryClient)?.name})
              </span>
            )}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              {!selectedInventoryClient && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products
              .filter(product => !selectedInventoryClient || product.clientId === selectedInventoryClient)
              .map(product => {
                const client = clients.find(c => c.id === product.clientId)
                const isLowStock = product.quantity < product.minStock
                return (
                  <tr key={product.id} className={isLowStock ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    {!selectedInventoryClient && (
                      <td className="px-6 py-4 text-sm text-gray-500">{client?.name}</td>
                    )}
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: isLowStock ? '#EF4444' : BRAND.bambooGreen }}>
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.minStock}</td>
                    <td className="px-6 py-4 text-sm">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: BRAND.bambooGreen }}>
                          ✓ In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {products.filter(p => (!selectedInventoryClient || p.clientId === selectedInventoryClient) && p.quantity < p.minStock).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {products.filter(p => (!selectedInventoryClient || p.clientId === selectedInventoryClient) && p.quantity < p.minStock).length} product(s) are below minimum stock levels and need reordering.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
