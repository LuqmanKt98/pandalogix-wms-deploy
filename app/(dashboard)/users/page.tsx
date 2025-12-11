"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getUsers, deleteUser, updateUser } from "@/lib/firestore"
import { User, UserRole } from "@/lib/types"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createUser } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Search, Trash2, Edit, Shield, User as UserIcon, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"


export default function UsersPage() {
    const { user: currentUser, firebaseUser, isSuperAdmin, isAdmin, loading: authLoading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Both Admin and Super Admin can manage users
    const canManageUsers = isSuperAdmin || isAdmin
    const canAccessPage = isSuperAdmin || isAdmin

    // Form state for new user
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff" as UserRole,
    })

    // Form state for editing user
    const [editForm, setEditForm] = useState({
        name: "",
        role: "staff" as UserRole,
    })

    useEffect(() => {
        if (!authLoading && !canAccessPage) {
            router.push('/dashboard')
            return
        }

        if (!authLoading && canAccessPage) {
            loadUsers()
        }
    }, [canAccessPage, authLoading, router])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            setError("Please fill in all fields")
            return
        }

        if (newUser.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();

            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                    name: newUser.name,
                    role: newUser.role,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error && data.error.includes('email-already-in-use')) {
                    throw new Error("An account with this email already exists");
                }
                throw new Error(data.error || "Failed to create user");
            }

            await loadUsers()
            setIsAddOpen(false)
            setNewUser({ name: "", email: "", password: "", role: "staff" })
            toast({ title: "User created", description: `${newUser.name} has been added.`, variant: "success" })
        } catch (err: any) {
            console.error('Error creating user:', err)
            setError(err.message || "Failed to create user")
            toast({ title: "Error", description: err.message || "Failed to create user.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setEditForm({
            name: user.name,
            role: user.role,
        })
        setIsEditOpen(true)
    }

    const handleUpdateUser = async () => {
        if (!editingUser || !currentUser || !firebaseUser) return

        setIsSubmitting(true)
        setError(null)

        try {
            const token = await firebaseUser.getIdToken()

            const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editForm.name,
                    role: editForm.role,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to update user")
            }

            await loadUsers()
            setIsEditOpen(false)
            setEditingUser(null)
            toast({ title: "User updated", description: `${editForm.name}'s information has been updated.`, variant: "success" })
        } catch (err: any) {
            console.error('Error updating user:', err)
            setError(err.message || "Failed to update user")
            toast({ title: "Error", description: err.message || "Failed to update user.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!userToDelete || !currentUser || !firebaseUser) return

        // Prevent deleting superAdmin users - client side check
        if (userToDelete.role === 'superAdmin') {
            toast({ title: "Error", description: "Super Admin users cannot be deleted.", variant: "destructive" })
            setDeleteConfirmOpen(false)
            setUserToDelete(null)
            return
        }

        setIsSubmitting(true)
        try {
            const token = await firebaseUser.getIdToken()

            const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete user")
            }

            await loadUsers()
            toast({ title: "User deleted", description: `${userToDelete.name} has been deleted.`, variant: "success" })
        } catch (error: any) {
            console.error('Error deleting user:', error)
            toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmOpen(false)
            setUserToDelete(null)
        }
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown'
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return format(date, 'MMM d, yyyy')
        } catch {
            return 'Invalid date'
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                </div>
            </div>
        )
    }

    if (!canAccessPage) {
        return null
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">
                        {canManageUsers ? 'Manage system users and their roles' : 'View system users and their roles'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadUsers} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    {canManageUsers && (
                        <Dialog open={isAddOpen} onOpenChange={(open) => {
                            setIsAddOpen(open)
                            if (!open) {
                                setError(null)
                                setNewUser({ name: "", email: "", password: "", role: "staff" })
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>
                                        Create a new user account with the specified role.
                                    </DialogDescription>
                                </DialogHeader>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={newUser.role}
                                            onValueChange={(val: UserRole) => setNewUser({ ...newUser, role: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="staff">Staff</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="superAdmin">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddUser} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create User"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-sm font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'superAdmin'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            : user.role === 'admin'
                                                ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                            {user.role === 'superAdmin' ? (
                                                <Shield className="h-3 w-3" />
                                            ) : user.role === 'admin' ? (
                                                <Shield className="h-3 w-3" />
                                            ) : (
                                                <UserIcon className="h-3 w-3" />
                                            )}
                                            {user.role === 'superAdmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Staff'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            {canManageUsers && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={user.id === currentUser?.id || user.role === 'superAdmin'}
                                                        title={user.role === 'superAdmin' ? 'Super Admin cannot be deleted' : undefined}
                                                    >
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

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => {
                setIsEditOpen(open)
                if (!open) {
                    setError(null)
                    setEditingUser(null)
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details and role.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={editForm.role}
                                onValueChange={(val: UserRole) => setEditForm({ ...editForm, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superAdmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
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
