'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, AlertCircle, Boxes, FileText, Building2 } from 'lucide-react';
import Nav from './components/Nav'
import Dashboard from './components/Dashboard'
import ClientsView from './components/ClientsView'
import GoodsReceivedView from './components/GoodsReceivedView'
import ShipmentsView from './components/ShipmentsView'
import InventoryView from './components/InventoryView'
import ReportsView from './components/ReportsView'

// PandaLogix Brand Colors
const BRAND = {
  pandaBlack: '#121212',
  bambooGreen: '#2CCB5A',
  softCream: '#FAF5EE',
  boxOrange: '#F4A340',
  charcoal: '#3E3E3E',
  lightBamboo: '#D9F7E3'
};

// Logo
const LOGO = "data:image/webp;base64,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";

// Storage
const storage = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};

const WMSApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [received, setReceived] = useState([]);
  
  // Shipment modal state
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedClientForShipment, setSelectedClientForShipment] = useState(null);
  const [newShipment, setNewShipment] = useState({
    date: new Date().toISOString().split('T')[0],
    singlePacks: 0,
    twoPacks: 0,
    threePacks: 0,
    fourPacks: 0,
    skuQuantities: []
  });
  
  // Reports state
  const [selectedReportClient, setSelectedReportClient] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Dashboard state
  const [selectedDashboardClient, setSelectedDashboardClient] = useState(null);
  
  // Page filters
  const [selectedGoodsReceivedClient, setSelectedGoodsReceivedClient] = useState(null);
  const [selectedShipmentsClient, setSelectedShipmentsClient] = useState(null);
  const [selectedInventoryClient, setSelectedInventoryClient] = useState(null);
  
  // Client management state
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    notes: '',
    customPackaging: ''
  });
  
  // Goods Received QC modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedClientForReceive, setSelectedClientForReceive] = useState(null);
  const [newReceipt, setNewReceipt] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: 0,
    pallets: 0,
    poNumber: '',
    lotNumber: '',
    expirationDate: '',
    photos: [],
    damageNotes: '',
    qcPassed: true
  });

  const initializeData = () => {
    if (!storage.get('wms_initialized')) {
      storage.set('wms_clients', [
        { id: 1, name: 'Acme Corporation', contact: 'John Smith', phone: '555-0100', email: 'john@acme.com' },
        { id: 2, name: 'TechStart Inc', contact: 'Jane Doe', phone: '555-0200', email: 'jane@techstart.com' }
      ]);
      storage.set('wms_products', [
        { id: 1, sku: 'ACME-001', name: 'Blue Widget', clientId: 1, quantity: 500, minStock: 100 },
        { id: 2, sku: 'ACME-002', name: 'Red Gadget', clientId: 1, quantity: 300, minStock: 50 },
        { id: 3, sku: 'TECH-001', name: 'Smart Device', clientId: 2, quantity: 150, minStock: 30 },
        { id: 4, sku: 'TECH-002', name: 'USB Cable', clientId: 2, quantity: 25, minStock: 50 }
      ]);
      const demoShipments = [];
      for (let i = 1; i <= 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 60));
        demoShipments.push({
          id: i,
          clientId: Math.random() > 0.5 ? 1 : 2,
          date: date.toISOString().split('T')[0],
          packages: Math.floor(Math.random() * 20) + 5
        });
      }
      storage.set('wms_shipments', demoShipments);
      
      const demoReceived = [
        { id: 1, clientId: 1, productId: 1, quantity: 500, pallets: 5, poNumber: 'PO-2025-001', date: '2025-01-05', lotNumber: 'LOT-2025-001' },
        { id: 2, clientId: 2, productId: 3, quantity: 200, pallets: 2, poNumber: 'PO-2025-002', date: '2025-01-20', lotNumber: 'LOT-2025-002' }
      ];
      storage.set('wms_received', demoReceived);
      storage.set('wms_damaged', []);
      storage.set('wms_initialized', true);
    }
  };

  const loadData = () => {
    setClients(storage.get('wms_clients') || []);
    setProducts(storage.get('wms_products') || []);
    setShipments(storage.get('wms_shipments') || []);
    setReceived(storage.get('wms_received') || []);
  };

  useEffect(() => {
    initializeData();
    loadData();
    
    // Set default date range to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, []);
  
  const openShipmentModal = (clientId) => {
    setSelectedClientForShipment(clientId);
    const clientProducts = products.filter(p => p.clientId === clientId);
    const skuQuantities = clientProducts.map(p => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: 0
    }));
    setNewShipment({
      date: new Date().toISOString().split('T')[0],
      singlePacks: 0,
      twoPacks: 0,
      threePacks: 0,
      fourPacks: 0,
      skuQuantities: skuQuantities
    });
    setShowShipmentModal(true);
  };
  
  const updateSkuQuantity = (productId, quantity) => {
    setNewShipment(prev => ({
      ...prev,
      skuQuantities: prev.skuQuantities.map(sq => 
        sq.productId === productId ? { ...sq, quantity: parseInt(quantity) || 0 } : sq
      )
    }));
  };
  
  const calculateTotals = () => {
    const totalPackages = parseInt(newShipment.singlePacks || 0) + 
                          parseInt(newShipment.twoPacks || 0) + 
                          parseInt(newShipment.threePacks || 0) + 
                          parseInt(newShipment.fourPacks || 0);
    const totalItems = newShipment.skuQuantities.reduce((sum, sq) => sum + sq.quantity, 0);
    return { totalPackages, totalItems };
  };
  
  const addShipment = () => {
    const { totalPackages, totalItems } = calculateTotals();
    
    if (!selectedClientForShipment || totalPackages === 0) {
      alert('Please enter package counts');
      return;
    }
    
    const existingShipments = storage.get('wms_shipments') || [];
    const newShipmentRecord = {
      id: existingShipments.length + 1,
      clientId: selectedClientForShipment,
      date: newShipment.date,
      packages: totalPackages,
      singlePacks: parseInt(newShipment.singlePacks || 0),
      twoPacks: parseInt(newShipment.twoPacks || 0),
      threePacks: parseInt(newShipment.threePacks || 0),
      fourPacks: parseInt(newShipment.fourPacks || 0),
      totalItems: totalItems,
      skuQuantities: newShipment.skuQuantities.filter(sq => sq.quantity > 0)
    };
    
    existingShipments.push(newShipmentRecord);
    storage.set('wms_shipments', existingShipments);
    
    // Deduct inventory
    const currentProducts = storage.get('wms_products') || [];
    newShipment.skuQuantities.forEach(sq => {
      if (sq.quantity > 0) {
        const productIndex = currentProducts.findIndex(p => p.id === sq.productId);
        if (productIndex !== -1) {
          currentProducts[productIndex].quantity -= sq.quantity;
        }
      }
    });
    storage.set('wms_products', currentProducts);
    
    loadData();
    setShowShipmentModal(false);
    setSelectedClientForShipment(null);
  };
  
  const exportToCSV = (data, filename) => {
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const exportShipmentsCSV = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const clientShipments = shipments.filter(s => s.clientId === clientId);
    
    const filtered = clientShipments.filter(s => {
      if (!dateRange.start || !dateRange.end) return true;
      return s.date >= dateRange.start && s.date <= dateRange.end;
    });
    
    const csvData = [
      ['Date', 'Total Packages', 'Single Packs', '2-Packs', '3-Packs', '4-Packs', 'Total Items']
    ];
    
    filtered.forEach(shipment => {
      csvData.push([
        shipment.date,
        shipment.packages,
        shipment.singlePacks || 0,
        shipment.twoPacks || 0,
        shipment.threePacks || 0,
        shipment.fourPacks || 0,
        shipment.totalItems || 0
      ]);
    });
    
    exportToCSV(csvData, `${client.name}_Shipments_${dateRange.start}_to_${dateRange.end}.csv`);
  };
  
  const exportReceivedCSV = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const clientReceived = received.filter(r => r.clientId === clientId);
    
    const filtered = clientReceived.filter(r => {
      if (!dateRange.start || !dateRange.end) return true;
      return r.date >= dateRange.start && r.date <= dateRange.end;
    });
    
    const csvData = [
      ['Date', 'Product', 'Quantity', 'Pallets', 'Lot Number', 'Expiration Date', 'PO Number', 'QC Status', 'Damage Notes']
    ];
    
    filtered.forEach(receipt => {
      const product = products.find(p => p.id === receipt.productId);
      csvData.push([
        receipt.date,
        product?.name || '',
        receipt.quantity,
        receipt.pallets,
        receipt.lotNumber || '',
        receipt.expirationDate || '',
        receipt.poNumber,
        receipt.qcPassed !== false ? 'Passed' : 'Issues',
        receipt.damageNotes || ''
      ]);
    });
    
    exportToCSV(csvData, `${client.name}_Received_${dateRange.start}_to_${dateRange.end}.csv`);
  };
  
  const openReceiveModal = (clientId) => {
    setSelectedClientForReceive(clientId);
    setNewReceipt({
      date: new Date().toISOString().split('T')[0],
      productId: '',
      quantity: 0,
      pallets: 0,
      poNumber: '',
      lotNumber: '',
      expirationDate: '',
      photos: [],
      damageNotes: '',
      qcPassed: true
    });
    setShowReceiveModal(true);
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(readers).then(results => {
      setNewReceipt(prev => ({
        ...prev,
        photos: [...prev.photos, ...results]
      }));
    });
  };
  
  const removePhoto = (index) => {
    setNewReceipt(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };
  
  const addReceipt = () => {
    if (!selectedClientForReceive || !newReceipt.productId || newReceipt.quantity <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    const existingReceipts = storage.get('wms_received') || [];
    const newReceiptRecord = {
      id: existingReceipts.length + 1,
      clientId: selectedClientForReceive,
      productId: parseInt(newReceipt.productId),
      date: newReceipt.date,
      quantity: parseInt(newReceipt.quantity),
      pallets: parseInt(newReceipt.pallets),
      poNumber: newReceipt.poNumber,
      lotNumber: newReceipt.lotNumber,
      expirationDate: newReceipt.expirationDate,
      photos: newReceipt.photos,
      damageNotes: newReceipt.damageNotes,
      qcPassed: newReceipt.qcPassed
    };
    
    existingReceipts.push(newReceiptRecord);
    storage.set('wms_received', existingReceipts);
    
    // Add to inventory
    const currentProducts = storage.get('wms_products') || [];
    const productIndex = currentProducts.findIndex(p => p.id === parseInt(newReceipt.productId));
    if (productIndex !== -1) {
      currentProducts[productIndex].quantity += parseInt(newReceipt.quantity);
    }
    storage.set('wms_products', currentProducts);
    
    // If damaged, record it
    if (newReceipt.damageNotes) {
      const damages = storage.get('wms_damaged') || [];
      damages.push({
        id: damages.length + 1,
        receiptId: newReceiptRecord.id,
        clientId: selectedClientForReceive,
        productId: parseInt(newReceipt.productId),
        date: newReceipt.date,
        notes: newReceipt.damageNotes,
        photos: newReceipt.photos
      });
      storage.set('wms_damaged', damages);
    }
    
    loadData();
    setShowReceiveModal(false);
    setSelectedClientForReceive(null);
  };
  
  const openClientModal = (client = null) => {
    if (client) {
      setEditingClient(client.id);
      setNewClient({
        name: client.name,
        contact: client.contact,
        phone: client.phone,
        email: client.email,
        notes: client.notes || '',
        customPackaging: client.customPackaging || ''
      });
    } else {
      setEditingClient(null);
      setNewClient({
        name: '',
        contact: '',
        phone: '',
        email: '',
        notes: '',
        customPackaging: ''
      });
    }
    setShowClientModal(true);
  };
  
  const saveClient = () => {
    if (!newClient.name || !newClient.contact) {
      alert('Please fill in company name and contact person');
      return;
    }
    
    const existingClients = storage.get('wms_clients') || [];
    
    if (editingClient) {
      // Update existing client
      const updatedClients = existingClients.map(c => 
        c.id === editingClient ? { ...c, ...newClient } : c
      );
      storage.set('wms_clients', updatedClients);
    } else {
      // Add new client
      const newClientRecord = {
        id: existingClients.length > 0 ? Math.max(...existingClients.map(c => c.id)) + 1 : 1,
        ...newClient,
        createdAt: new Date().toISOString().split('T')[0]
      };
      existingClients.push(newClientRecord);
      storage.set('wms_clients', existingClients);
    }
    
    loadData();
    setShowClientModal(false);
    setEditingClient(null);
  };
  
  const deleteClient = (clientId) => {
    if (!confirm('Are you sure you want to delete this client? This will also remove all their products, shipments, and receipts.')) {
      return;
    }
    
    const existingClients = storage.get('wms_clients') || [];
    const updatedClients = existingClients.filter(c => c.id !== clientId);
    storage.set('wms_clients', updatedClients);
    
    // Also clean up related data
    const existingProducts = storage.get('wms_products') || [];
    storage.set('wms_products', existingProducts.filter(p => p.clientId !== clientId));
    
    const existingShipments = storage.get('wms_shipments') || [];
    storage.set('wms_shipments', existingShipments.filter(s => s.clientId !== clientId));
    
    const existingReceived = storage.get('wms_received') || [];
    storage.set('wms_received', existingReceived.filter(r => r.clientId !== clientId));
    
    loadData();
  };

  return (
    <div className="min-h-screen flex" style={{backgroundColor: BRAND.softCream}}>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} LOGO={LOGO} BRAND={BRAND} />

      <div className="flex-1">
        <div className="bg-white shadow-lg">
          <div className="container-max py-6">
            <h1 className="text-2xl font-bold text-brand-green">
              Warehouse Management System
            </h1>
          </div>
        </div>
        
        <div className="container-max py-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              clients={clients}
              shipments={shipments}
              received={received}
              products={products}
              selectedDashboardClient={selectedDashboardClient}
              setSelectedDashboardClient={setSelectedDashboardClient}
              BRAND={BRAND}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              openClientModal={openClientModal}
              deleteClient={deleteClient}
              BRAND={BRAND}
            />
          )}

          {activeTab === 'goods-received' && (
            <GoodsReceivedView
              clients={clients}
              products={products}
              received={received}
              selectedGoodsReceivedClient={selectedGoodsReceivedClient}
              setSelectedGoodsReceivedClient={setSelectedGoodsReceivedClient}
              openReceiveModal={openReceiveModal}
              BRAND={BRAND}
            />
          )}

          {activeTab === 'shipments' && (
            <ShipmentsView
              clients={clients}
              shipments={shipments}
              selectedShipmentsClient={selectedShipmentsClient}
              setSelectedShipmentsClient={setSelectedShipmentsClient}
              openShipmentModal={openShipmentModal}
              BRAND={BRAND}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              clients={clients}
              products={products}
              selectedInventoryClient={selectedInventoryClient}
              setSelectedInventoryClient={setSelectedInventoryClient}
              BRAND={BRAND}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              clients={clients}
              shipments={shipments}
              received={received}
              products={products}
              selectedReportClient={selectedReportClient}
              setSelectedReportClient={setSelectedReportClient}
              dateRange={dateRange}
              setDateRange={setDateRange}
              exportShipmentsCSV={exportShipmentsCSV}
              exportReceivedCSV={exportReceivedCSV}
              BRAND={BRAND}
            />
          )}
        </div>
      </div>
      
      {/* Client Management Modal */}
      {showClientModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowClientModal(false)}></div>
            <div className="inline-block bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </h3>
                  <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Acme Corporation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                      <input
                        type="text"
                        value={newClient.contact}
                        onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="555-0100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                  
                  {/* Special Requirements */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Special Requirements</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Packaging Instructions</label>
                        <textarea
                          value={newClient.customPackaging}
                          onChange={(e) => setNewClient({ ...newClient, customPackaging: e.target.value })}
                          rows="3"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Use branded boxes, bubble wrap fragile items, shrink wrap pallets..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                        <textarea
                          value={newClient.notes}
                          onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                          rows="3"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Any other special requirements or notes about this client..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={saveClient}
                  className="w-full inline-flex justify-center rounded-md border-0 shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
                  style={{backgroundColor: BRAND.bambooGreen}}
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Goods Received QC Modal */}
      {showReceiveModal && selectedClientForReceive && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowReceiveModal(false)}></div>
            <div className="inline-block bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Receive Goods - {clients.find(c => c.id === selectedClientForReceive)?.name}
                  </h3>
                  <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Date *</label>
                      <input
                        type="date"
                        value={newReceipt.date}
                        onChange={(e) => setNewReceipt({ ...newReceipt, date: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                      <select
                        value={newReceipt.productId}
                        onChange={(e) => setNewReceipt({ ...newReceipt, productId: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Product</option>
                        {products.filter(p => p.clientId === selectedClientForReceive).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.sku} - {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        value={newReceipt.quantity}
                        onChange={(e) => setNewReceipt({ ...newReceipt, quantity: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pallets</label>
                      <input
                        type="number"
                        min="0"
                        value={newReceipt.pallets}
                        onChange={(e) => setNewReceipt({ ...newReceipt, pallets: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                      <input
                        type="text"
                        value={newReceipt.poNumber}
                        onChange={(e) => setNewReceipt({ ...newReceipt, poNumber: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  {/* Quality Control Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Quality Control Checks</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                        <input
                          type="text"
                          value={newReceipt.lotNumber}
                          onChange={(e) => setNewReceipt({ ...newReceipt, lotNumber: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="LOT-2025-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <input
                          type="date"
                          value={newReceipt.expirationDate}
                          onChange={(e) => setNewReceipt({ ...newReceipt, expirationDate: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    {/* Photo Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo Verification</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer rounded-md font-medium" style={{color: BRAND.bambooGreen}}>
                              <span>Upload photos</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                      
                      {/* Photo Preview */}
                      {newReceipt.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {newReceipt.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img src={photo} alt={`Upload ${index + 1}`} className="h-24 w-full object-cover rounded" />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Damage Documentation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage Notes (if any)</label>
                      <textarea
                        value={newReceipt.damageNotes}
                        onChange={(e) => setNewReceipt({ ...newReceipt, damageNotes: e.target.value, qcPassed: !e.target.value })}
                        rows="3"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Describe any damage, discrepancies, or quality issues..."
                      />
                      {newReceipt.damageNotes && (
                        <p className="mt-1 text-sm text-red-600">⚠️ This receipt will be flagged for quality issues</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={addReceipt}
                  className="w-full inline-flex justify-center rounded-md border-0 shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
                  style={{backgroundColor: BRAND.bambooGreen}}
                >
                  Complete Receipt
                </button>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Shipment Modal */}
      {showShipmentModal && selectedClientForShipment && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowShipmentModal(false)}></div>
            <div className="inline-block bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add Shipment - {clients.find(c => c.id === selectedClientForShipment)?.name}
                  </h3>
                  <button onClick={() => setShowShipmentModal(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Date</label>
                    <input
                      type="date"
                      value={newShipment.date}
                      onChange={(e) => setNewShipment({ ...newShipment, date: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Package Breakdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Package Breakdown</label>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Single Packs</label>
                        <input
                          type="number"
                          min="0"
                          value={newShipment.singlePacks}
                          onChange={(e) => setNewShipment({ ...newShipment, singlePacks: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">2-Packs</label>
                        <input
                          type="number"
                          min="0"
                          value={newShipment.twoPacks}
                          onChange={(e) => setNewShipment({ ...newShipment, twoPacks: e.target.value })}
                          className="block w-full px-3 py-2 border rounded-md"
                          style={{borderColor: BRAND.boxOrange}}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">3-Packs</label>
                        <input
                          type="number"
                          min="0"
                          value={newShipment.threePacks}
                          onChange={(e) => setNewShipment({ ...newShipment, threePacks: e.target.value })}
                          className="block w-full px-3 py-2 border rounded-md"
                          style={{borderColor: BRAND.boxOrange}}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">4-Packs</label>
                        <input
                          type="number"
                          min="0"
                          value={newShipment.fourPacks}
                          onChange={(e) => setNewShipment({ ...newShipment, fourPacks: e.target.value })}
                          className="block w-full px-3 py-2 border rounded-md"
                          style={{borderColor: BRAND.boxOrange}}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-medium" style={{color: BRAND.bambooGreen}}>
                      Total Packages: {calculateTotals().totalPackages}
                    </div>
                  </div>
                  
                  {/* SKU Quantities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">SKU Quantities</label>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newShipment.skuQuantities.map(sq => (
                            <tr key={sq.productId}>
                              <td className="px-4 py-2 text-sm text-gray-900">{sq.sku}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{sq.name}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={sq.quantity}
                                  onChange={(e) => updateSkuQuantity(sq.productId, e.target.value)}
                                  className="block w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-sm font-medium" style={{color: BRAND.bambooGreen}}>
                      Total Items: {calculateTotals().totalItems}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={addShipment}
                  className="w-full inline-flex justify-center rounded-md border-0 shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
                  style={{backgroundColor: BRAND.bambooGreen}}
                >
                  Record Shipment
                </button>
                <button
                  onClick={() => setShowShipmentModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WMSApp;
