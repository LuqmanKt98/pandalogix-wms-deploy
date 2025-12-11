import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    DocumentData,
    QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import {
    Client,
    GoodsReceived,
    Shipment,
    ActivityLog,
    User,
    InventoryItem,
    CreateClientData,
    CreateGoodsReceivedData,
    CreateShipmentData,
    CreateUserData,
    CreateInventoryItemData,
    InventoryAdjustment,
    ActivityAction,
    GoodsReceivedItem,
    ShipmentItem,
    Attachment,
} from './types';

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    CLIENTS: 'clients',
    GOODS_RECEIVED: 'goodsReceived',
    SHIPMENTS: 'shipments',
    ACTIVITY_LOG: 'activityLog',
    INVENTORY: 'inventory',
} as const;

// Helper to convert Firestore document to typed object
function docToObject<T>(doc: DocumentData, id: string): T {
    return { ...doc.data(), id } as T;
}

// ==================== ACTIVITY LOG ====================

export async function logActivity(
    userId: string,
    userName: string,
    userEmail: string,
    action: ActivityAction,
    collectionName: string,
    documentId: string,
    documentName: string,
    details: string,
    changes?: Record<string, { old: unknown; new: unknown }>
): Promise<void> {
    try {
        await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOG), {
            userId,
            userName,
            userEmail,
            action,
            collection: collectionName,
            documentId,
            documentName,
            details,
            changes: changes || null,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - activity logging should not break main operations
    }
}

export async function getActivityLogs(limitCount: number = 100): Promise<ActivityLog[]> {
    const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOG),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<ActivityLog>(doc, doc.id));
}

// ==================== USERS ====================

export async function getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return snapshot.docs.map(doc => docToObject<User>(doc, doc.id));
}

export async function getUserById(userId: string): Promise<User | null> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToObject<User>(docSnap, docSnap.id);
    }
    return null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return docToObject<User>(snapshot.docs[0], snapshot.docs[0].id);
}

export async function createUser(userId: string, data: CreateUserData): Promise<User> {
    // Ensure role is always set, default to 'staff' if not provided
    const userData = {
        email: data.email,
        name: data.name,
        role: data.role || 'staff',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Use setDoc to create or overwrite the document
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const { setDoc } = await import('firebase/firestore');
    await setDoc(docRef, userData, { merge: false });

    const createdDoc = await getDoc(docRef);
    return docToObject<User>(createdDoc, createdDoc.id);
}

export async function updateUser(
    userId: string,
    data: Partial<CreateUserData>,
    currentUser?: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const oldDoc = await getDoc(docRef);

    // Ensure we don't accidentally remove the role field
    const updateData: any = {
        updatedAt: serverTimestamp(),
    };

    // Only add fields that are provided
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;

    await updateDoc(docRef, updateData);

    if (currentUser && oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'update',
            COLLECTIONS.USERS,
            userId,
            oldData.name,
            `Updated user: ${oldData.name}`
        );
    }
}

export async function deleteUser(
    userId: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const oldDoc = await getDoc(docRef);

    await deleteDoc(docRef);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'delete',
            COLLECTIONS.USERS,
            userId,
            oldData.name,
            `Deleted user: ${oldData.name}`
        );
    }
}

// ==================== CLIENTS ====================

export async function getClients(): Promise<Client[]> {
    const q = query(collection(db, COLLECTIONS.CLIENTS), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<Client>(doc, doc.id));
}

export async function getClientById(clientId: string): Promise<Client | null> {
    const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToObject<Client>(docSnap, docSnap.id);
    }
    return null;
}

export async function createClient(
    data: CreateClientData,
    currentUser: { id: string; name: string; email: string }
): Promise<Client> {
    const clientData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), clientData);

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'create',
        COLLECTIONS.CLIENTS,
        docRef.id,
        data.name,
        `Created client: ${data.name}`
    );

    const createdDoc = await getDoc(docRef);
    return docToObject<Client>(createdDoc, createdDoc.id);
}

export async function updateClient(
    clientId: string,
    data: Partial<CreateClientData>,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
    const oldDoc = await getDoc(docRef);

    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'update',
            COLLECTIONS.CLIENTS,
            clientId,
            oldData.name,
            `Updated client: ${oldData.name}`
        );
    }
}

export async function deleteClient(
    clientId: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
    const oldDoc = await getDoc(docRef);

    await deleteDoc(docRef);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'delete',
            COLLECTIONS.CLIENTS,
            clientId,
            oldData.name,
            `Deleted client: ${oldData.name}`
        );
    }
}

// ==================== GOODS RECEIVED ====================

export async function getGoodsReceived(): Promise<GoodsReceived[]> {
    const q = query(
        collection(db, COLLECTIONS.GOODS_RECEIVED),
        orderBy('dateReceived', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<GoodsReceived>(doc, doc.id));
}

export async function getGoodsReceivedById(id: string): Promise<GoodsReceived | null> {
    const docRef = doc(db, COLLECTIONS.GOODS_RECEIVED, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToObject<GoodsReceived>(docSnap, docSnap.id);
    }
    return null;
}

export async function createGoodsReceived(
    data: CreateGoodsReceivedData,
    currentUser: { id: string; name: string; email: string }
): Promise<GoodsReceived> {
    // Calculate totals from items
    const numberOfSkus = data.items.length;
    const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const goodsData = {
        ...data,
        dateReceived: Timestamp.fromDate(data.dateReceived),
        numberOfSkus,
        totalUnits,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.GOODS_RECEIVED), goodsData);

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'create',
        COLLECTIONS.GOODS_RECEIVED,
        docRef.id,
        data.referenceId,
        `Created goods received: ${data.referenceId} for ${data.clientName}`
    );

    const createdDoc = await getDoc(docRef);
    return docToObject<GoodsReceived>(createdDoc, createdDoc.id);
}

export async function updateGoodsReceived(
    id: string,
    data: Partial<CreateGoodsReceivedData>,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.GOODS_RECEIVED, id);
    const oldDoc = await getDoc(docRef);

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // Convert date if provided
    if (data.dateReceived) {
        updateData.dateReceived = Timestamp.fromDate(data.dateReceived);
    }

    // Recalculate totals if items changed
    if (data.items) {
        updateData.numberOfSkus = data.items.length;
        updateData.totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    await updateDoc(docRef, updateData);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'update',
            COLLECTIONS.GOODS_RECEIVED,
            id,
            oldData.referenceId,
            `Updated goods received: ${oldData.referenceId}`
        );
    }
}

export async function deleteGoodsReceived(
    id: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.GOODS_RECEIVED, id);
    const oldDoc = await getDoc(docRef);

    await deleteDoc(docRef);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'delete',
            COLLECTIONS.GOODS_RECEIVED,
            id,
            oldData.referenceId,
            `Deleted goods received: ${oldData.referenceId}`
        );
    }
}

// ==================== SHIPMENTS ====================

export async function getShipments(): Promise<Shipment[]> {
    const q = query(
        collection(db, COLLECTIONS.SHIPMENTS),
        orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<Shipment>(doc, doc.id));
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
    const docRef = doc(db, COLLECTIONS.SHIPMENTS, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToObject<Shipment>(docSnap, docSnap.id);
    }
    return null;
}

export async function createShipment(
    data: CreateShipmentData,
    currentUser: { id: string; name: string; email: string }
): Promise<Shipment> {
    // Calculate total units from items
    const numberOfUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const shipmentData = {
        ...data,
        date: Timestamp.fromDate(data.date),
        numberOfUnits,
        attachments: [],
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.SHIPMENTS), shipmentData);

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'create',
        COLLECTIONS.SHIPMENTS,
        docRef.id,
        `${data.shipmentType} - ${data.clientName}`,
        `Created shipment for ${data.clientName} (${data.shipmentType})`
    );

    const createdDoc = await getDoc(docRef);
    return docToObject<Shipment>(createdDoc, createdDoc.id);
}

export async function updateShipment(
    id: string,
    data: Partial<CreateShipmentData> & { attachments?: Attachment[] },
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHIPMENTS, id);
    const oldDoc = await getDoc(docRef);

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // Convert date if provided
    if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
    }

    // Recalculate total units if items changed
    if (data.items) {
        updateData.numberOfUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    await updateDoc(docRef, updateData);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'update',
            COLLECTIONS.SHIPMENTS,
            id,
            `${oldData.shipmentType} - ${oldData.clientName}`,
            `Updated shipment for ${oldData.clientName}`
        );
    }
}

export async function deleteShipment(
    id: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHIPMENTS, id);
    const oldDoc = await getDoc(docRef);

    await deleteDoc(docRef);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'delete',
            COLLECTIONS.SHIPMENTS,
            id,
            `${oldData.shipmentType} - ${oldData.clientName}`,
            `Deleted shipment for ${oldData.clientName}`
        );
    }
}

// Add attachment to shipment
export async function addShipmentAttachment(
    shipmentId: string,
    attachment: Attachment,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHIPMENTS, shipmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error('Shipment not found');
    }

    const shipmentData = docSnap.data();
    const attachments = shipmentData.attachments || [];
    attachments.push(attachment);

    await updateDoc(docRef, {
        attachments,
        updatedAt: serverTimestamp(),
    });

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'update',
        COLLECTIONS.SHIPMENTS,
        shipmentId,
        `${shipmentData.shipmentType} - ${shipmentData.clientName}`,
        `Added attachment: ${attachment.name}`
    );
}

// Remove attachment from shipment
export async function removeShipmentAttachment(
    shipmentId: string,
    attachmentId: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHIPMENTS, shipmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error('Shipment not found');
    }

    const shipmentData = docSnap.data();
    const attachments = (shipmentData.attachments || []).filter(
        (a: Attachment) => a.id !== attachmentId
    );

    await updateDoc(docRef, {
        attachments,
        updatedAt: serverTimestamp(),
    });

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'update',
        COLLECTIONS.SHIPMENTS,
        shipmentId,
        `${shipmentData.shipmentType} - ${shipmentData.clientName}`,
        `Removed attachment`
    );
}

// ==================== INVENTORY ====================

export async function getInventory(): Promise<InventoryItem[]> {
    const q = query(
        collection(db, COLLECTIONS.INVENTORY),
        orderBy('sku', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<InventoryItem>(doc, doc.id));
}

export async function getInventoryByClient(clientId: string): Promise<InventoryItem[]> {
    const q = query(
        collection(db, COLLECTIONS.INVENTORY),
        where('clientId', '==', clientId),
        orderBy('sku', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToObject<InventoryItem>(doc, doc.id));
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
    const docRef = doc(db, COLLECTIONS.INVENTORY, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToObject<InventoryItem>(docSnap, docSnap.id);
    }
    return null;
}

export async function createInventoryItem(
    data: CreateInventoryItemData,
    currentUser: { id: string; name: string; email: string }
): Promise<InventoryItem> {
    const inventoryData = {
        ...data,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.INVENTORY), inventoryData);

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'create',
        COLLECTIONS.INVENTORY,
        docRef.id,
        `${data.sku} - ${data.name}`,
        `Created inventory item: ${data.sku} for ${data.clientName}`
    );

    const createdDoc = await getDoc(docRef);
    return docToObject<InventoryItem>(createdDoc, createdDoc.id);
}

export async function updateInventoryItem(
    id: string,
    data: Partial<CreateInventoryItemData>,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.INVENTORY, id);
    const oldDoc = await getDoc(docRef);

    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'update',
            COLLECTIONS.INVENTORY,
            id,
            `${oldData.sku} - ${oldData.name}`,
            `Updated inventory item: ${oldData.sku}`
        );
    }
}

export async function deleteInventoryItem(
    id: string,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.INVENTORY, id);
    const oldDoc = await getDoc(docRef);

    await deleteDoc(docRef);

    if (oldDoc.exists()) {
        const oldData = oldDoc.data();
        await logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.email,
            'delete',
            COLLECTIONS.INVENTORY,
            id,
            `${oldData.sku} - ${oldData.name}`,
            `Deleted inventory item: ${oldData.sku}`
        );
    }
}

// Adjust inventory quantity (add, remove, or set)
export async function adjustInventoryQuantity(
    id: string,
    adjustment: InventoryAdjustment,
    currentUser: { id: string; name: string; email: string }
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.INVENTORY, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error('Inventory item not found');
    }

    const currentData = docSnap.data();
    let newQuantity: number;

    switch (adjustment.type) {
        case 'add':
            newQuantity = currentData.quantity + adjustment.quantity;
            break;
        case 'remove':
            newQuantity = Math.max(0, currentData.quantity - adjustment.quantity);
            break;
        case 'set':
            newQuantity = adjustment.quantity;
            break;
    }

    await updateDoc(docRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp(),
    });

    await logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        'update',
        COLLECTIONS.INVENTORY,
        id,
        `${currentData.sku} - ${currentData.name}`,
        `Adjusted quantity: ${adjustment.type} ${adjustment.quantity} (${currentData.quantity} → ${newQuantity}). Reason: ${adjustment.reason}`
    );
}
