import { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'superAdmin' | 'admin' | 'staff';

// User interface
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Client interface
export interface Client {
    id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    notes?: string;
    customPackaging?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Goods Received Item
export interface GoodsReceivedItem {
    sku: string;
    name: string;
    quantity: number;
    palletQuantity: number;
    notes?: string;
}

// Goods Received status
export type GoodsReceivedStatus = 'Draft' | 'Completed' | 'Adjusted';

// Goods Received interface
export interface GoodsReceived {
    id: string;
    dateReceived: Timestamp;
    clientId: string;
    clientName: string;
    referenceId: string;
    numberOfPallets: number;
    numberOfSkus: number;
    totalUnits: number;
    status: GoodsReceivedStatus;
    items: GoodsReceivedItem[];
    notes?: string;
    createdBy: string;
    createdByName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Shipment types
export type ShipmentType = 'Standard' | 'FBA' | 'TikTok' | 'Other';

// Shipment mode - distinguishes between pallet shipments and daily bulk entries
export type ShipmentMode = 'pallet' | 'daily-bulk';

// Shipment status
export type ShipmentStatus = 'Planned' | 'Created' | 'Booked' | 'Picked Up' | 'Delivered';

// Shipment Item
export interface ShipmentItem {
    sku: string;
    name: string;
    quantity: number;
    cartonQuantity: number;
    palletInfo?: string;
}

// SKU Quantity for daily bulk entries
export interface SkuQuantity {
    sku: string;
    name: string;
    quantity: number;
}

// Pack sizes for daily bulk entries
export interface PackSizes {
    singlePacks: number;
    twoPacks: number;
    threePacks: number;
    fourPacks: number;
}

// Attachment interface
export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: 'bol' | 'label' | 'photo' | 'other';
    size: number;
    uploadedAt: Timestamp;
}

// Shipment interface
export interface Shipment {
    id: string;
    date: Timestamp;
    clientId: string;
    clientName: string;
    shipmentType: ShipmentType;
    shipmentMode: ShipmentMode;
    numberOfUnits: number;
    numberOfPallets: number;
    status: ShipmentStatus;
    destination?: string;
    carrier?: string;
    trackingNumber?: string;
    // For pallet shipments (outbound)
    items: ShipmentItem[];
    attachments: Attachment[];
    // For daily bulk entries
    packSizes?: PackSizes;
    skuQuantities?: SkuQuantity[];
    totalPackages?: number;
    notes?: string;
    createdBy: string;
    createdByName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Activity Log action types
export type ActivityAction = 'create' | 'update' | 'delete';

// Activity Log interface
export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: ActivityAction;
    collection: string;
    documentId: string;
    documentName: string;
    details: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    timestamp: Timestamp;
}

// Form data types (without Timestamp for creating new records)
export interface CreateClientData {
    name: string;
    contact: string;
    phone: string;
    email: string;
    notes?: string;
    customPackaging?: string;
}

export interface CreateGoodsReceivedData {
    dateReceived: Date;
    clientId: string;
    clientName: string;
    referenceId: string;
    numberOfPallets: number;
    items: GoodsReceivedItem[];
    notes?: string;
    status: GoodsReceivedStatus;
}

export interface CreateShipmentData {
    date: Date;
    clientId: string;
    clientName: string;
    shipmentType: ShipmentType;
    shipmentMode: ShipmentMode;
    numberOfPallets: number;
    destination?: string;
    carrier?: string;
    trackingNumber?: string;
    // For pallet shipments
    items: ShipmentItem[];
    // For daily bulk entries
    packSizes?: PackSizes;
    skuQuantities?: SkuQuantity[];
    totalPackages?: number;
    notes?: string;
    status: ShipmentStatus;
}

export interface CreateUserData {
    email: string;
    name: string;
    role: UserRole;
}

// Inventory Item interface
export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    clientId: string;
    clientName: string;
    quantity: number;
    minStock: number;
    location?: string;
    notes?: string;
    createdBy: string;
    createdByName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Form data for creating inventory items
export interface CreateInventoryItemData {
    sku: string;
    name: string;
    clientId: string;
    clientName: string;
    quantity: number;
    minStock: number;
    location?: string;
    notes?: string;
}

// Inventory adjustment for tracking stock changes
export interface InventoryAdjustment {
    type: 'add' | 'remove' | 'set';
    quantity: number;
    reason: string;
}
