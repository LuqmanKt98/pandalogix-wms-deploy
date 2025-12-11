"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/contexts/auth-context"
import { getClients, createClient, updateClient, deleteClient } from "@/lib/firestore"
import { Client } from "@/lib/types"
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
import { Plus, Search, Trash2, Edit, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

export default function ClientsPage() {
    const currentUser = useCurrentUser()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        phone: "",
        email: "",
        notes: "",
        customPackaging: ""
    })

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        setLoading(true)
        try {
            const data = await getClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async () => {
        if (!formData.name || !formData.contact || !currentUser) return

        setIsSubmitting(true)
        try {
            if (editingId) {
                await updateClient(editingId, formData, currentUser)
                toast({ title: "Client updated", description: `${formData.name} has been updated.`, variant: "success" })
            } else {
                await createClient(formData, currentUser)
                toast({ title: "Client added", description: `${formData.name} has been added.`, variant: "success" })
            }
            await loadClients()
            setIsAddOpen(false)
            setEditingId(null)
            setFormData({ name: "", contact: "", phone: "", email: "", notes: "", customPackaging: "" })
        } catch (error) {
            console.error('Error saving client:', error)
            toast({ title: "Error", description: "Failed to save client. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (client: Client) => {
        setFormData({
            name: client.name,
            contact: client.contact,
            phone: client.phone,
            email: client.email,
            notes: client.notes || "",
            customPackaging: client.customPackaging || ""
        })
        setEditingId(client.id)
        setIsAddOpen(true)
    }

    const handleDeleteClick = (client: Client) => {
        setClientToDelete(client)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!clientToDelete || !currentUser) return

        setIsSubmitting(true)
        try {
            await deleteClient(clientToDelete.id, currentUser)
            await loadClients()
            toast({ title: "Client deleted", description: `${clientToDelete.name} has been deleted.`, variant: "success" })
        } catch (error) {
            console.error('Error deleting client:', error)
            toast({ title: "Error", description: "Failed to delete client. Please try again.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmOpen(false)
            setClientToDelete(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading clients...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                <div className="flex gap-2">
                    <Button onClick={loadClients} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open)
                        if (!open) {
                            setEditingId(null)
                            setFormData({ name: "", contact: "", phone: "", email: "", notes: "", customPackaging: "" })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                                <DialogDescription>
                                    Manage client details and preferences.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Company Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact">Contact Person *</Label>
                                        <Input
                                            id="contact"
                                            value={formData.contact}
                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="packaging">Custom Packaging Instructions</Label>
                                    <Input
                                        id="packaging"
                                        value={formData.customPackaging}
                                        onChange={(e) => setFormData({ ...formData, customPackaging: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
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
                                        <>{editingId ? 'Update' : 'Save'} Client</>
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
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client, index) => (
                                <motion.tr
                                    key={client.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.contact}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(client)}>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Client</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {clientToDelete?.name}? This action cannot be undone.
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
