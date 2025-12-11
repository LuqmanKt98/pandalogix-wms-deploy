"use client"

import { useState, useEffect, useRef } from "react"
import { useCurrentUser, useAuth } from "@/contexts/auth-context"
import { getShipments, getClients, createShipment, updateShipment, deleteShipment, addShipmentAttachment, removeShipmentAttachment } from "@/lib/firestore"
import { uploadFile, deleteFile } from "@/lib/storage"
import { Shipment, Client, ShipmentItem, ShipmentStatus, ShipmentType, Attachment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Trash2, Edit, Eye, Loader2, RefreshCw, Truck, X, Upload, FileText, Image, Download, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

const statusColors: Record<ShipmentStatus, string> = {
    'Planned': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    'Created': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    'Booked': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Picked Up': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Delivered': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

const typeColors: Record<ShipmentType, string> = {
    'Standard': 'bg-gray-500/10 text-gray-500',
    'FBA': 'bg-orange-500/10 text-orange-500',
    'TikTok': 'bg-pink-500/10 text-pink-500',
    'Other': 'bg-purple-500/10 text-purple-500',
}

export default function ShipmentsPage() {
    const currentUser = useCurrentUser()
    const { isAdmin, isSuperAdmin } = useAuth()
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [viewingRecord, setViewingRecord] = useState<Shipment | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [recordToDelete, setRecordToDelete] = useState<Shipment | null>(null)
    const [uploadingFile, setUploadingFile] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        clientId: "",
        shipmentType: "Standard" as ShipmentType,
        numberOfPallets: 0,
        status: "Created" as ShipmentStatus,
        destination: "",
        carrier: "",
        trackingNumber: "",
        notes: "",
        items: [] as ShipmentItem[],
    })

    const [newItem, setNewItem] = useState<ShipmentItem>({
        sku: "",
        name: "",
        quantity: 0,
        cartonQuantity: 0,
        palletInfo: "",
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [shipmentsData, clientsData] = await Promise.all([
                getShipments(),
                getClients(),
            ])
            setShipments(shipmentsData)
            setClients(clientsData)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredShipments = shipments.filter(shipment => {
        const matchesSearch =
            shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (shipment.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (shipment.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || shipment.status === statusFilter
        const matchesType = typeFilter === "all" || shipment.shipmentType === typeFilter
        return matchesSearch && matchesStatus && matchesType
    })

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown'
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return format(date, 'MMM d, yyyy')
        } catch {
            return 'Invalid date'
        }
    }

    const handleAddItem = () => {
        if (!newItem.sku || !newItem.name || newItem.quantity <= 0) return
        setFormData({
            ...formData,
            items: [...formData.items, { ...newItem }],
        })
        setNewItem({ sku: "", name: "", quantity: 0, cartonQuantity: 0, palletInfo: "" })
    }

    const handleRemoveItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        })
    }

    const handleSubmit = async () => {
        if (!formData.clientId || !currentUser) return
        if (formData.items.length === 0) {
            toast({ title: "Validation error", description: "Please add at least one item.", variant: "destructive" })
            return
        }

        const selectedClient = clients.find(c => c.id === formData.clientId)
        if (!selectedClient) return

        setIsSubmitting(true)
        try {
            const data = {
                date: new Date(formData.date),
                clientId: formData.clientId,
                clientName: selectedClient.name,
                shipmentType: formData.shipmentType,
                numberOfPallets: formData.numberOfPallets,
                status: formData.status,
                destination: formData.destination,
                carrier: formData.carrier,
                trackingNumber: formData.trackingNumber,
                notes: formData.notes,
                items: formData.items,
            }

            if (editingId) {
                await updateShipment(editingId, data, currentUser)
                toast({ title: "Shipment updated", description: `Shipment to ${formData.destination} has been updated.`, variant: "success" })
            } else {
                await createShipment(data, currentUser)
                toast({ title: "Shipment created", description: `New shipment to ${formData.destination} has been created.`, variant: "success" })
            }
            await loadData()
            resetForm()
        } catch (error) {
            console.error('Error saving shipment:', error)
            toast({ title: "Error", description: "Failed to save shipment. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setIsAddOpen(false)
        setEditingId(null)
        setFormData({
            date: new Date().toISOString().split('T')[0],
            clientId: "",
            shipmentType: "Standard",
            numberOfPallets: 0,
            status: "Created",
            destination: "",
            carrier: "",
            trackingNumber: "",
            notes: "",
            items: [],
        })
    }

    const handleEdit = (record: Shipment) => {
        setFormData({
            date: format(record.date.toDate(), 'yyyy-MM-dd'),
            clientId: record.clientId,
            shipmentType: record.shipmentType,
            numberOfPallets: record.numberOfPallets,
            status: record.status,
            destination: record.destination || "",
            carrier: record.carrier || "",
            trackingNumber: record.trackingNumber || "",
            notes: record.notes || "",
            items: record.items || [],
        })
        setEditingId(record.id)
        setIsAddOpen(true)
    }

    const handleView = (record: Shipment) => {
        setViewingRecord(record)
        setIsViewOpen(true)
    }

    const handleDeleteClick = (record: Shipment) => {
        setRecordToDelete(record)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!recordToDelete || !currentUser) return

        setIsSubmitting(true)
        try {
            await deleteShipment(recordToDelete.id, currentUser)
            await loadData()
            toast({ title: "Shipment deleted", description: "Shipment has been deleted.", variant: "success" })
        } catch (error) {
            console.error('Error deleting record:', error)
            toast({ title: "Error", description: "Failed to delete shipment. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmOpen(false)
            setRecordToDelete(null)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bol' | 'label' | 'photo') => {
        if (!e.target.files || !e.target.files[0] || !viewingRecord || !currentUser) return

        const file = e.target.files[0]
        setUploadingFile(true)

        try {
            const attachment = await uploadFile(file, `shipments/${viewingRecord.id}`, type)
            await addShipmentAttachment(viewingRecord.id, attachment, currentUser)

            // Refresh the viewing record
            await loadData()
            const updated = shipments.find(s => s.id === viewingRecord.id)
            if (updated) {
                setViewingRecord({ ...updated, attachments: [...(updated.attachments || []), attachment] })
            }
            toast({ title: "File uploaded", description: `${file.name} has been uploaded.`, variant: "success" })
        } catch (error) {
            console.error('Error uploading file:', error)
            toast({ title: "Upload failed", description: "Failed to upload file. Make sure Firebase Storage is enabled.", variant: "destructive" })
        } finally {
            setUploadingFile(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveAttachment = async (attachment: Attachment) => {
        if (!viewingRecord || !currentUser) return

        try {
            await deleteFile(`shipments/${viewingRecord.id}`, attachment.id)
            await removeShipmentAttachment(viewingRecord.id, attachment.id, currentUser)

            // Update viewing record
            setViewingRecord({
                ...viewingRecord,
                attachments: viewingRecord.attachments.filter(a => a.id !== attachment.id)
            })
            await loadData()
            toast({ title: "Attachment removed", description: `${attachment.name} has been removed.`, variant: "success" })
        } catch (error) {
            console.error('Error removing attachment:', error)
            toast({ title: "Error", description: "Failed to remove attachment.", variant: "destructive" })
        }
    }

    const getAttachmentIcon = (type: string) => {
        switch (type) {
            case 'bol':
            case 'label':
                return <FileText className="h-4 w-4" />
            case 'photo':
                return <Image className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading shipments...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
                <div className="flex gap-2">
                    <Button onClick={loadData} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    {(isAdmin || isSuperAdmin) && (
                        <Dialog open={isAddOpen} onOpenChange={(open) => {
                            setIsAddOpen(open)
                            if (!open) resetForm()
                        }}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> New Shipment</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingId ? 'Edit' : 'New'} Shipment</DialogTitle>
                                    <DialogDescription>
                                        Create an outbound shipment with items and details.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    {/* Header Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date *</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Client *</Label>
                                            <Select
                                                value={formData.clientId}
                                                onValueChange={(val) => setFormData({ ...formData, clientId: val })}
                                            >
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
                                            <Label>Shipment Type</Label>
                                            <Select
                                                value={formData.shipmentType}
                                                onValueChange={(val: ShipmentType) => setFormData({ ...formData, shipmentType: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Standard">Standard</SelectItem>
                                                    <SelectItem value="FBA">FBA (Amazon)</SelectItem>
                                                    <SelectItem value="TikTok">TikTok Shop</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(val: ShipmentStatus) => setFormData({ ...formData, status: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Planned">Planned</SelectItem>
                                                    <SelectItem value="Created">Created</SelectItem>
                                                    <SelectItem value="Booked">Booked</SelectItem>
                                                    <SelectItem value="Picked Up">Picked Up</SelectItem>
                                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Destination {(formData.shipmentType === 'FBA' || formData.shipmentType === 'TikTok') && '(FC Code)'}</Label>
                                            <Input
                                                value={formData.destination}
                                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                                placeholder={formData.shipmentType === 'FBA' ? 'e.g., PHX5' : 'Destination'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Carrier</Label>
                                            <Input
                                                value={formData.carrier}
                                                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                                                placeholder="e.g., UPS, FedEx"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tracking Number</Label>
                                            <Input
                                                value={formData.trackingNumber}
                                                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label># Pallets</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.numberOfPallets}
                                                onChange={(e) => setFormData({ ...formData, numberOfPallets: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Optional notes..."
                                            rows={2}
                                        />
                                    </div>

                                    {/* Items Section */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium mb-4">Items</h4>

                                        {/* Add Item Form */}
                                        <div className="grid grid-cols-6 gap-2 mb-4 p-4 bg-muted/50 rounded-lg">
                                            <div className="space-y-1">
                                                <Label className="text-xs">SKU</Label>
                                                <Input
                                                    value={newItem.sku}
                                                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                                                    placeholder="SKU"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Name</Label>
                                                <Input
                                                    value={newItem.name}
                                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                    placeholder="Item name"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={newItem.quantity}
                                                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Cartons</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={newItem.cartonQuantity}
                                                    onChange={(e) => setNewItem({ ...newItem, cartonQuantity: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Pallet Info</Label>
                                                <Input
                                                    value={newItem.palletInfo}
                                                    onChange={(e) => setNewItem({ ...newItem, palletInfo: e.target.value })}
                                                    placeholder="e.g., P1"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button type="button" onClick={handleAddItem} size="sm" className="w-full">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        {formData.items.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead className="text-right">Qty</TableHead>
                                                        <TableHead className="text-right">Cartons</TableHead>
                                                        <TableHead>Pallet</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {formData.items.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="font-mono">{item.sku}</TableCell>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">{item.cartonQuantity}</TableCell>
                                                            <TableCell>{item.palletInfo || '-'}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                >
                                                                    <X className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">No items added yet</p>
                                        )}

                                        {formData.items.length > 0 && (
                                            <div className="flex justify-end mt-2 text-sm text-muted-foreground">
                                                Total: {formData.items.reduce((sum, i) => sum + i.quantity, 0)} units in {formData.items.reduce((sum, i) => sum + i.cartonQuantity, 0)} cartons
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingId ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>{editingId ? 'Update' : 'Create'} Shipment</>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by client, destination, tracking..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="w-[140px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="FBA">FBA</SelectItem>
                            <SelectItem value="TikTok">TikTok</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[150px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Planned">Planned</SelectItem>
                            <SelectItem value="Created">Created</SelectItem>
                            <SelectItem value="Booked">Booked</SelectItem>
                            <SelectItem value="Picked Up">Picked Up</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right"># Units</TableHead>
                            <TableHead className="text-right"># Pallets</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredShipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No shipments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredShipments.map((shipment, index) => (
                                <motion.tr
                                    key={shipment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>{formatDate(shipment.date)}</TableCell>
                                    <TableCell className="font-medium">{shipment.clientName}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[shipment.shipmentType]}`}>
                                            {shipment.shipmentType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{shipment.numberOfUnits}</TableCell>
                                    <TableCell className="text-right">{shipment.numberOfPallets}</TableCell>
                                    <TableCell>{shipment.destination || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[shipment.status]}`}>
                                            {shipment.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleView(shipment)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {(isAdmin || isSuperAdmin) && (
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(shipment)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Shipment Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewingRecord && (
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="items">Items ({viewingRecord.items?.length || 0})</TabsTrigger>
                                <TabsTrigger value="attachments">Attachments ({viewingRecord.attachments?.length || 0})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-6 mt-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Date</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-medium">{formatDate(viewingRecord.date)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Client</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-medium">{viewingRecord.clientName}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Type</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[viewingRecord.shipmentType]}`}>
                                                {viewingRecord.shipmentType}
                                            </span>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Status</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[viewingRecord.status]}`}>
                                                {viewingRecord.status}
                                            </span>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Destination</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-medium">{viewingRecord.destination || '-'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Carrier</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-medium">{viewingRecord.carrier || '-'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground">Tracking</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-mono text-sm">{viewingRecord.trackingNumber || '-'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-xs text-muted-foreground"># Pallets</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="font-medium">{viewingRecord.numberOfPallets}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-2xl font-bold">{viewingRecord.numberOfUnits}</p>
                                        <p className="text-sm text-muted-foreground">Total Units</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-2xl font-bold">{viewingRecord.items?.length || 0}</p>
                                        <p className="text-sm text-muted-foreground">SKUs</p>
                                    </div>
                                </div>

                                {viewingRecord.notes && (
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                        <p>{viewingRecord.notes}</p>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                    Created by {viewingRecord.createdByName} on {formatDate(viewingRecord.createdAt)}
                                </div>
                            </TabsContent>

                            <TabsContent value="items" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Cartons</TableHead>
                                            <TableHead>Pallet</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(viewingRecord.items || []).map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono">{item.sku}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.cartonQuantity}</TableCell>
                                                <TableCell>{item.palletInfo || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="attachments" className="mt-4 space-y-4">
                                {/* Upload Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const type = fileInputRef.current?.dataset.uploadType as 'bol' | 'label' | 'photo' || 'other'
                                            handleFileUpload(e, type)
                                        }}
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadingFile}
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.dataset.uploadType = 'bol'
                                                fileInputRef.current.click()
                                            }
                                        }}
                                    >
                                        {uploadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Upload BOL
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadingFile}
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.dataset.uploadType = 'label'
                                                fileInputRef.current.click()
                                            }
                                        }}
                                    >
                                        {uploadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Upload Label
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadingFile}
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.dataset.uploadType = 'photo'
                                                fileInputRef.current.accept = 'image/*'
                                                fileInputRef.current.click()
                                            }
                                        }}
                                    >
                                        {uploadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Upload Photo
                                    </Button>
                                </div>

                                {/* Attachments List */}
                                {(viewingRecord.attachments || []).length > 0 ? (
                                    <div className="grid gap-2">
                                        {viewingRecord.attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getAttachmentIcon(attachment.type)}
                                                    <div>
                                                        <p className="font-medium text-sm">{attachment.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {attachment.type.toUpperCase()} • {(attachment.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveAttachment(attachment)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No attachments yet. Upload BOLs, labels, or photos above.
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Note: File uploads require Firebase Storage with Blaze plan.
                                </p>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shipment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this shipment for {recordToDelete?.clientName}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
