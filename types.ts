
export enum UserRole {
  ADMIN = 'ADMIN',
  COMERCIAL = 'COMERCIAL',
}

export enum CustomerType {
  CHINO = 'CHINO',
  HINDU = 'HINDU',
  HOSTELERIA = 'HOSTELERIA',
  HOTEL_CATERING_VOLUMEN = 'HOTEL_CATERING_VOLUMEN',
  BASE = 'BASE',
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio_30: number; // Price with 30% margin
  coste_base: number; // Calculated base cost
  fecha_creacion: Date;
  fecha_ultima_actualizacion: Date;
}

export interface Customer {
  id: string;
  nombre: string;
  direccion: string;
  placeId?: string;
  googleMapsCategory?: string;
  tipo_cliente: CustomerType;
  fecha_registro: Date;
}

export interface PriceHistoryEntry {
  id: string;
  producto_id: string;
  producto_nombre: string;
  coste_anterior: number;
  coste_nuevo: number;
  fecha_cambio: Date;
}