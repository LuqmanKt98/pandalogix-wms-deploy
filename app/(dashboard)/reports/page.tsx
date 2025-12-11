"use client"

import { useState, useEffect } from "react"
import { getClients, getShipments, getGoodsReceived, getInventory } from "@/lib/firestore"
import { Client, Shipment, GoodsReceived, InventoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, FileText, Loader2, RefreshCw, Package } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function ReportsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [goodsReceived, setGoodsReceived] = useState<GoodsReceived[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [selectedClient, setSelectedClient] = useState<string>("")
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [clientsData, shipmentsData, receivedData, inventoryData] = await Promise.all([
                getClients(),
                getShipments(),
                getGoodsReceived(),
                getInventory()
            ])
            setClients(clientsData)
            setShipments(shipmentsData)
            setGoodsReceived(receivedData)
            setInventory(inventoryData)
        } catch (error) {
            console.error('Error loading data:', error)
            toast({ title: "Error", description: "Failed to load report data.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Properly escape CSV cells
    const escapeCSVCell = (cell: any): string => {
        if (cell === null || cell === undefined) return ''
        const str = String(cell)
        // If cell contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const exportToCSV = (data: string[][], filename: string) => {
        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF'
        const csv = BOM + data.map(row => row.map(cell => escapeCSVCell(cell)).join(',')).join('\r\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', filename)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    }

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return ''
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            // Use MM/DD/YYYY format for better Excel compatibility
            return format(date, 'MM/dd/yyyy')
        } catch {
            return ''
        }
    }

    const formatDateTime = (timestamp: any): string => {
        if (!timestamp) return ''
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return format(date, 'MM/dd/yyyy HH:mm')
        } catch {
            return ''
        }
    }

    const handleExportShipments = async () => {
        if (!selectedClient) {
            toast({ title: "Select a client", description: "Please select a client to export.", variant: "destructive" })
            return
        }

        setExporting(true)
        try {
            const client = clients.find(c => c.id === selectedClient)
            const clientShipments = shipments.filter(s => s.clientId === selectedClient)

            const filtered = clientShipments.filter(s => {
                const date = s.date && typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as unknown as string | number)
                const dateStr = format(date, 'yyyy-MM-dd')
                if (!dateRange.start || !dateRange.end) return true
                return dateStr >= dateRange.start && dateStr <= dateRange.end
            })

            const csvData: string[][] = [
                [
                    'Date',
                    'Shipment Type',
                    'Status',
                    'Destination',
                    'Carrier',
                    'Tracking Number',
                    'Number of Pallets',
                    'Number of Units',
                    'Number of SKUs',
                    'Created By',
                    'Created At',
                    'Notes'
                ]
            ]

            filtered.forEach(shipment => {
                csvData.push([
                    formatDate(shipment.date),
                    shipment.shipmentType || '',
                    shipment.status || '',
                    shipment.destination || '',
                    shipment.carrier || '',
                    shipment.trackingNumber || '',
                    shipment.numberOfPallets?.toString() || '0',
                    shipment.numberOfUnits?.toString() || '0',
                    shipment.items?.length?.toString() || '0',
                    shipment.createdByName || '',
                    formatDateTime(shipment.createdAt),
                    shipment.notes || ''
                ])
            })

            // Add item details section
            if (filtered.length > 0 && filtered.some(s => s.items && s.items.length > 0)) {
                csvData.push([]) // Empty row
                csvData.push(['SHIPMENT ITEM DETAILS'])
                csvData.push(['Date', 'Tracking Number', 'SKU', 'Product Name', 'Quantity', 'Cartons', 'Pallet Info'])

                filtered.forEach(shipment => {
                    if (shipment.items && shipment.items.length > 0) {
                        shipment.items.forEach(item => {
                            csvData.push([
                                formatDate(shipment.date),
                                shipment.trackingNumber || '',
                                item.sku || '',
                                item.name || '',
                                item.quantity?.toString() || '0',
                                item.cartonQuantity?.toString() || '0',
                                item.palletInfo || ''
                            ])
                        })
                    }
                })
            }

            const sanitizedClientName = client?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Client'
            exportToCSV(csvData, `${sanitizedClientName}_Shipments_${dateRange.start}_to_${dateRange.end}.csv`)
            toast({ title: "Export successful", description: `Exported ${filtered.length} shipment records.` })
        } catch (error) {
            console.error('Error exporting:', error)
            toast({ title: "Export failed", description: "Failed to export shipments.", variant: "destructive" })
        } finally {
            setExporting(false)
        }
    }

    const handleExportReceived = async () => {
        if (!selectedClient) {
            toast({ title: "Select a client", description: "Please select a client to export.", variant: "destructive" })
            return
        }

        setExporting(true)
        try {
            const client = clients.find(c => c.id === selectedClient)
            const clientReceived = goodsReceived.filter(r => r.clientId === selectedClient)

            const filtered = clientReceived.filter(r => {
                const date = r.dateReceived.toDate ? r.dateReceived.toDate() : new Date(r.dateReceived)
                const dateStr = format(date, 'yyyy-MM-dd')
                if (!dateRange.start || !dateRange.end) return true
                return dateStr >= dateRange.start && dateStr <= dateRange.end
            })

            const csvData: string[][] = [
                [
                    'Date Received',
                    'Reference ID',
                    'Status',
                    'Number of Pallets',
                    'Number of SKUs',
                    'Total Units',
                    'Created By',
                    'Created At',
                    'Notes'
                ]
            ]

            filtered.forEach(record => {
                csvData.push([
                    formatDate(record.dateReceived),
                    record.referenceId || '',
                    record.status || '',
                    record.numberOfPallets?.toString() || '0',
                    record.numberOfSkus?.toString() || '0',
                    record.totalUnits?.toString() || '0',
                    record.createdByName || '',
                    formatDateTime(record.createdAt),
                    record.notes || ''
                ])
            })

            // Add item details section
            if (filtered.length > 0 && filtered.some(r => r.items && r.items.length > 0)) {
                csvData.push([]) // Empty row
                csvData.push(['GOODS RECEIVED ITEM DETAILS'])
                csvData.push(['Date', 'Reference ID', 'SKU', 'Product Name', 'Quantity', 'Pallets', 'Item Notes'])

                filtered.forEach(record => {
                    if (record.items && record.items.length > 0) {
                        record.items.forEach(item => {
                            csvData.push([
                                formatDate(record.dateReceived),
                                record.referenceId || '',
                                item.sku || '',
                                item.name || '',
                                item.quantity?.toString() || '0',
                                item.palletQuantity?.toString() || '0',
                                item.notes || ''
                            ])
                        })
                    }
                })
            }

            const sanitizedClientName = client?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Client'
            exportToCSV(csvData, `${sanitizedClientName}_GoodsReceived_${dateRange.start}_to_${dateRange.end}.csv`)
            toast({ title: "Export successful", description: `Exported ${filtered.length} goods received records.` })
        } catch (error) {
            console.error('Error exporting:', error)
            toast({ title: "Export failed", description: "Failed to export goods received.", variant: "destructive" })
        } finally {
            setExporting(false)
        }
    }

    const handleExportInventory = async () => {
        if (!selectedClient) {
            toast({ title: "Select a client", description: "Please select a client to export.", variant: "destructive" })
            return
        }

        setExporting(true)
        try {
            const client = clients.find(c => c.id === selectedClient)
            const clientInventory = inventory.filter(i => i.clientId === selectedClient)

            // Sort by SKU for better organization
            const sortedInventory = [...clientInventory].sort((a, b) => a.sku.localeCompare(b.sku))

            const csvData: string[][] = [
                [
                    'SKU',
                    'Product Name',
                    'Current Quantity',
                    'Minimum Stock',
                    'Stock Status',
                    'Location',
                    'Created By',
                    'Last Updated',
                    'Notes'
                ]
            ]

            sortedInventory.forEach(item => {
                const status = item.quantity === 0
                    ? 'Out of Stock'
                    : item.quantity <= item.minStock
                    ? 'Low Stock'
                    : 'In Stock'

                csvData.push([
                    item.sku || '',
                    item.name || '',
                    item.quantity?.toString() || '0',
                    item.minStock?.toString() || '0',
                    status,
                    item.location || '',
                    item.createdByName || '',
                    formatDateTime(item.updatedAt),
                    item.notes || ''
                ])
            })

            // Add summary section
            const totalItems = sortedInventory.length
            const totalQuantity = sortedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0)
            const outOfStock = sortedInventory.filter(item => item.quantity === 0).length
            const lowStock = sortedInventory.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length
            const inStock = sortedInventory.filter(item => item.quantity > item.minStock).length

            csvData.push([]) // Empty row
            csvData.push(['INVENTORY SUMMARY'])
            csvData.push(['Total SKUs', totalItems.toString()])
            csvData.push(['Total Units', totalQuantity.toString()])
            csvData.push(['In Stock', inStock.toString()])
            csvData.push(['Low Stock', lowStock.toString()])
            csvData.push(['Out of Stock', outOfStock.toString()])
            csvData.push(['Report Generated', formatDateTime(new Date())])

            const sanitizedClientName = client?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Client'
            exportToCSV(csvData, `${sanitizedClientName}_Inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            toast({ title: "Export successful", description: `Exported ${clientInventory.length} inventory items.` })
        } catch (error) {
            console.error('Error exporting:', error)
            toast({ title: "Export failed", description: "Failed to export inventory.", variant: "destructive" })
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading report data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
                <Button onClick={loadData} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Export Configuration</CardTitle>
                        <CardDescription>
                            Select a client and date range to generate reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select value={selectedClient} onValueChange={setSelectedClient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Shipments Report
                        </CardTitle>
                        <CardDescription>
                            Export shipment history for the selected client and date range.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={handleExportShipments}
                            disabled={!selectedClient || exporting}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Goods Received Report
                        </CardTitle>
                        <CardDescription>
                            Export goods received history for the selected client and date range.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={handleExportReceived}
                            disabled={!selectedClient || exporting}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Inventory Report
                        </CardTitle>
                        <CardDescription>
                            Export current inventory levels for the selected client.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={handleExportInventory}
                            disabled={!selectedClient || exporting}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download CSV
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
