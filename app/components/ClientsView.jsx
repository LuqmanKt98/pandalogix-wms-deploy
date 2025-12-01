"use client";
import React from 'react'
import { Building2 } from 'lucide-react'

export default function ClientsView({ clients, openClientModal, deleteClient, BRAND }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={() => openClientModal()}
          className="btn-primary"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Add Client
        </button>
      </div>

      <div className="table-wrapper">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Special Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map(client => (
              <tr key={client.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{client.contact}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{client.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{client.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.customPackaging || client.notes ? (
                    <div className="space-y-1">
                      {client.customPackaging && (
                        <p className="text-xs">
                          <span className="font-medium">Packaging:</span> {client.customPackaging}
                        </p>
                      )}
                      {client.notes && (
                        <p className="text-xs">
                          <span className="font-medium">Notes:</span> {client.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => openClientModal(client)}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
