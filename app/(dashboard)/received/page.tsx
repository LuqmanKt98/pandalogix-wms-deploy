"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/contexts/auth-context"
import { getGoodsReceived, getClients, createGoodsReceived, updateGoodsReceived, deleteGoodsReceived } from "@/lib/firestore"
import { GoodsReceived, Client, GoodsReceivedItem, GoodsReceivedStatus } from "@/lib/types"
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
import { Plus, Search, Trash2, Edit, Eye, Loader2, RefreshCw, Package, X } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

const statusColors: Record<GoodsReceivedStatus, string> = {
    'Draft': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Adjusted': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

export default function ReceivedPage() {
    const currentUser = useCurrentUser()
    const [received, setReceived] = useState<GoodsReceived[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [viewingRecord, setViewingRecord] = useState<GoodsReceived | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [recordToDelete, setRecordToDelete] = useState<GoodsReceived | null>(null)

    const [formData, setFormData] = useState({
        dateReceived: new Date().toISOString().split('T')[0],
        clientId: "",
        referenceId: "",
        numberOfPallets: 0,
        status: "Draft" as GoodsReceivedStatus,
        notes: "",
        items: [] as GoodsReceivedItem[],
    })

    const [newItem, setNewItem] = useState<GoodsReceivedItem>({
        sku: "",
        name: "",
        quantity: 0,
        palletQuantity: 0,
        notes: "",
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [receivedData, clientsData] = await Promise.all([
                getGoodsReceived(),
                getClients(),
            ])
            setReceived(receivedData)
            setClients(clientsData)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredReceived = received.filter(record => {
        const matchesSearch =
            record.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || record.status === statusFilter
        return matchesSearch && matchesStatus
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
        setNewItem({ sku: "", name: "", quantity: 0, palletQuantity: 0, notes: "" })
    }

    const handleRemoveItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        })
    }

    const handleSubmit = async () => {
        if (!formData.clientId || !formData.referenceId || !currentUser) return
        if (formData.items.length === 0) {
            toast({ title: "Validation error", description: "Please add at least one item.", variant: "destructive" })
            return
        }

        const selectedClient = clients.find(c => c.id === formData.clientId)
        if (!selectedClient) return

        setIsSubmitting(true)
        try {
            const data = {
                dateReceived: new Date(formData.dateReceived),
                clientId: formData.clientId,
                clientName: selectedClient.name,
                referenceId: formData.referenceId,
                numberOfPallets: formData.numberOfPallets,
                status: formData.status,
                notes: formData.notes,
                items: formData.items,
            }

            if (editingId) {
                await updateGoodsReceived(editingId, data, currentUser)
                toast({ title: "Record updated", description: `${formData.referenceId} has been updated.`, variant: "success" })
            } else {
                await createGoodsReceived(data, currentUser)
                toast({ title: "Record added", description: `${formData.referenceId} has been added.`, variant: "success" })
            }
            await loadData()
            resetForm()
        } catch (error) {
            console.error('Error saving goods received:', error)
            toast({ title: "Error", description: "Failed to save record. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setIsAddOpen(false)
        setEditingId(null)
        setFormData({
            dateReceived: new Date().toISOString().split('T')[0],
            clientId: "",
            referenceId: "",
            numberOfPallets: 0,
            status: "Draft",
            notes: "",
            items: [],
        })
    }

    const handleEdit = (record: GoodsReceived) => {
        setFormData({
            dateReceived: formatDate(record.dateReceived).includes('Invalid')
                ? new Date().toISOString().split('T')[0]
                : format(record.dateReceived.toDate(), 'yyyy-MM-dd'),
            clientId: record.clientId,
            referenceId: record.referenceId,
            numberOfPallets: record.numberOfPallets,
            status: record.status,
            notes: record.notes || "",
            items: record.items || [],
        })
        setEditingId(record.id)
        setIsAddOpen(true)
    }

    const handleView = (record: GoodsReceived) => {
        setViewingRecord(record)
        setIsViewOpen(true)
    }

    const handleDeleteClick = (record: GoodsReceived) => {
        setRecordToDelete(record)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!recordToDelete || !currentUser) return

        setIsSubmitting(true)
        try {
            await deleteGoodsReceived(recordToDelete.id, currentUser)
            await loadData()
            toast({ title: "Record deleted", description: `${recordToDelete.referenceId} has been deleted.`, variant: "success" })
        } catch (error) {
            console.error('Error deleting record:', error)
            toast({ title: "Error", description: "Failed to delete record. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmOpen(false)
            setRecordToDelete(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading goods received...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Goods Received</h2>
                <div className="flex gap-2">
                    <Button onClick={loadData} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Receive Goods</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit' : 'New'} Goods Received</DialogTitle>
                                <DialogDescription>
                                    Record incoming inventory and items.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                {/* Header Info */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date Received *</Label>
                                        <Input
                                            type="date"
                                            value={formData.dateReceived}
                                            onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
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
                                        <Label>Reference/Receiving ID *</Label>
                                        <Input
                                            value={formData.referenceId}
                                            onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                                            placeholder="e.g., RCV-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val: GoodsReceivedStatus) => setFormData({ ...formData, status: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Draft">Draft</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Adjusted">Adjusted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Number of Pallets</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.numberOfPallets}
                                            onChange={(e) => setFormData({ ...formData, numberOfPallets: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Input
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Optional notes..."
                                        />
                                    </div>
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
                                            <Label className="text-xs">Pallet Qty</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={newItem.palletQuantity}
                                                onChange={(e) => setNewItem({ ...newItem, palletQuantity: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Notes</Label>
                                            <Input
                                                value={newItem.notes}
                                                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                                placeholder="Notes"
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
                                                    <TableHead className="text-right">Pallets</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {formData.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-mono">{item.sku}</TableCell>
                                                        <TableCell>{item.name}</TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">{item.palletQuantity}</TableCell>
                                                        <TableCell className="text-muted-foreground">{item.notes || '-'}</TableCell>
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
                                            Total: {formData.items.reduce((sum, i) => sum + i.quantity, 0)} units across {formData.items.length} SKUs
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
                                        <>{editingId ? 'Update' : 'Save'} Record</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Reference ID or Client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="w-[150px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Adjusted">Adjusted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Received</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Reference ID</TableHead>
                            <TableHead className="text-right"># Pallets</TableHead>
                            <TableHead className="text-right"># SKUs</TableHead>
                            <TableHead className="text-right"># Units</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReceived.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReceived.map((record, index) => (
                                <motion.tr
                                    key={record.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>{formatDate(record.dateReceived)}</TableCell>
                                    <TableCell className="font-medium">{record.clientName}</TableCell>
                                    <TableCell className="font-mono">{record.referenceId}</TableCell>
                                    <TableCell className="text-right">{record.numberOfPallets}</TableCell>
                                    <TableCell className="text-right">{record.numberOfSkus}</TableCell>
                                    <TableCell className="text-right">{record.totalUnits}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleView(record)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(record)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Goods Received Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewingRecord && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-xs text-muted-foreground">Date Received</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="font-medium">{formatDate(viewingRecord.dateReceived)}</p>
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
                                        <CardTitle className="text-xs text-muted-foreground">Reference ID</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="font-mono font-medium">{viewingRecord.referenceId}</p>
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

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold">{viewingRecord.numberOfPallets}</p>
                                    <p className="text-sm text-muted-foreground">Pallets</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold">{viewingRecord.numberOfSkus}</p>
                                    <p className="text-sm text-muted-foreground">SKUs</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold">{viewingRecord.totalUnits}</p>
                                    <p className="text-sm text-muted-foreground">Total Units</p>
                                </div>
                            </div>

                            {viewingRecord.notes && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p>{viewingRecord.notes}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium mb-2">Items ({viewingRecord.items?.length || 0})</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Pallets</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(viewingRecord.items || []).map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono">{item.sku}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.palletQuantity}</TableCell>
                                                <TableCell className="text-muted-foreground">{item.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Created by {viewingRecord.createdByName} on {formatDate(viewingRecord.createdAt)}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Record</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {recordToDelete?.referenceId}? This action cannot be undone.
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
