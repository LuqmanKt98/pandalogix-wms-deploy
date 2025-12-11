"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/contexts/auth-context"
import { getInventory, getClients, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity } from "@/lib/firestore"
import { InventoryItem, Client } from "@/lib/types"
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
import { Plus, Search, Trash2, Edit, RefreshCw, Loader2, PackagePlus } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

export default function InventoryPage() {
    const currentUser = useCurrentUser()
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        clientId: "",
        quantity: 0,
        minStock: 0,
        location: "",
        notes: ""
    })

    const [adjustmentData, setAdjustmentData] = useState({
        type: "add" as "add" | "remove" | "set",
        quantity: 0,
        reason: ""
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [inventoryData, clientsData] = await Promise.all([
                getInventory(),
                getClients()
            ])
            setInventory(inventoryData)
            setClients(clientsData)
        } catch (error) {
            console.error('Error loading inventory:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesClient = selectedClientFilter === "all" || item.clientId === selectedClientFilter
        return matchesSearch && matchesClient
    })

    const handleSubmit = async () => {
        if (!formData.sku || !formData.name || !formData.clientId || !currentUser) return

        const selectedClient = clients.find(c => c.id === formData.clientId)
        if (!selectedClient) return

        setIsSubmitting(true)
        try {
            const data: any = {
                sku: formData.sku,
                name: formData.name,
                clientId: formData.clientId,
                clientName: selectedClient.name,
                quantity: formData.quantity,
                minStock: formData.minStock,
            }

            // Only add optional fields if they have values
            if (formData.location) {
                data.location = formData.location
            }
            if (formData.notes) {
                data.notes = formData.notes
            }

            if (editingId) {
                await updateInventoryItem(editingId, data, currentUser)
                toast({ title: "Product updated", description: `${formData.sku} has been updated.`, variant: "success" })
            } else {
                await createInventoryItem(data, currentUser)
                toast({ title: "Product added", description: `${formData.sku} has been added to inventory.`, variant: "success" })
            }
            await loadData()
            resetForm()
        } catch (error) {
            console.error('Error saving inventory item:', error)
            toast({ title: "Error", description: "Failed to save inventory item. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAdjustQuantity = async () => {
        if (!adjustingItem || !currentUser || adjustmentData.quantity <= 0) return

        setIsSubmitting(true)
        try {
            await adjustInventoryQuantity(adjustingItem.id, {
                type: adjustmentData.type,
                quantity: adjustmentData.quantity,
                reason: adjustmentData.reason || 'No reason provided'
            }, currentUser)
            await loadData()
            toast({ title: "Quantity adjusted", description: `${adjustingItem.sku} quantity has been updated.`, variant: "success" })
            setIsAdjustOpen(false)
            setAdjustingItem(null)
            setAdjustmentData({ type: "add", quantity: 0, reason: "" })
        } catch (error) {
            console.error('Error adjusting quantity:', error)
            toast({ title: "Error", description: "Failed to adjust quantity. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setIsAddOpen(false)
        setEditingId(null)
        setFormData({
            sku: "",
            name: "",
            clientId: "",
            quantity: 0,
            minStock: 0,
            location: "",
            notes: ""
        })
    }

    const handleEdit = (item: InventoryItem) => {
        setFormData({
            sku: item.sku,
            name: item.name,
            clientId: item.clientId,
            quantity: item.quantity,
            minStock: item.minStock,
            location: item.location || "",
            notes: item.notes || ""
        })
        setEditingId(item.id)
        setIsAddOpen(true)
    }

    const handleAdjustClick = (item: InventoryItem) => {
        setAdjustingItem(item)
        setAdjustmentData({ type: "add", quantity: 0, reason: "" })
        setIsAdjustOpen(true)
    }

    const handleDeleteClick = (item: InventoryItem) => {
        setItemToDelete(item)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !currentUser) return

        setIsSubmitting(true)
        try {
            await deleteInventoryItem(itemToDelete.id, currentUser)
            await loadData()
            toast({ title: "Product deleted", description: `${itemToDelete.sku} has been deleted.`, variant: "success" })
        } catch (error) {
            console.error('Error deleting item:', error)
            toast({ title: "Error", description: "Failed to delete item. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmOpen(false)
            setItemToDelete(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading inventory...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
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
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit' : 'Add New'} Product</DialogTitle>
                                <DialogDescription>
                                    {editingId ? 'Update product details.' : 'Create a new product SKU for a client.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="client" className="text-right">Client *</Label>
                                    <div className="col-span-3">
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
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sku" className="text-right">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g., PROD-001"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Product name"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="quantity" className="text-right">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="minStock" className="text-right">Min Stock</Label>
                                    <Input
                                        id="minStock"
                                        type="number"
                                        min="0"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="location" className="text-right">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g., Aisle B, Shelf 3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes" className="text-right">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="col-span-3"
                                        rows={2}
                                    />
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
                                        <>{editingId ? 'Update' : 'Save'} Product</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="w-[200px]">
                    <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Client" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Min Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInventory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInventory.map((item, index) => {
                                const isLowStock = item.quantity <= item.minStock
                                const isOutOfStock = item.quantity === 0
                                return (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b transition-colors hover:bg-muted/50"
                                    >
                                        <TableCell className="font-mono font-medium">{item.sku}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.clientName}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.location || '-'}</TableCell>
                                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{item.minStock}</TableCell>
                                        <TableCell>
                                            {isOutOfStock ? (
                                                <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                                                    Out of Stock
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                                    In Stock
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleAdjustClick(item)} title="Adjust quantity">
                                                    <PackagePlus className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Adjust Quantity Dialog */}
            <Dialog open={isAdjustOpen} onOpenChange={(open) => {
                setIsAdjustOpen(open)
                if (!open) {
                    setAdjustingItem(null)
                    setAdjustmentData({ type: "add", quantity: 0, reason: "" })
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Quantity</DialogTitle>
                        <DialogDescription>
                            {adjustingItem && (
                                <span>Adjust inventory for <strong>{adjustingItem.sku}</strong> (Current: {adjustingItem.quantity})</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select
                                value={adjustmentData.type}
                                onValueChange={(val: "add" | "remove" | "set") => setAdjustmentData({ ...adjustmentData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Add Stock</SelectItem>
                                    <SelectItem value="remove">Remove Stock</SelectItem>
                                    <SelectItem value="set">Set Quantity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustmentData.quantity}
                                onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                value={adjustmentData.reason}
                                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                placeholder="e.g., Received shipment, Damaged goods, Physical count adjustment..."
                                rows={2}
                            />
                        </div>
                        {adjustingItem && adjustmentData.quantity > 0 && (
                            <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                <p className="text-muted-foreground">
                                    New quantity will be: <strong className="text-foreground">
                                        {adjustmentData.type === 'add'
                                            ? adjustingItem.quantity + adjustmentData.quantity
                                            : adjustmentData.type === 'remove'
                                                ? Math.max(0, adjustingItem.quantity - adjustmentData.quantity)
                                                : adjustmentData.quantity}
                                    </strong>
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAdjustQuantity} disabled={isSubmitting || adjustmentData.quantity <= 0}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adjusting...
                                </>
                            ) : (
                                "Apply Adjustment"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{itemToDelete?.sku}</strong> ({itemToDelete?.name})? This action cannot be undone.
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
