
import { Product, CustomerType } from './types';

// Data parsed from the provided OCR of the PDF file.
const rawProducts = [
    { codigo: "68008", producto: "ALAS POLLO FRESCO", categoria: "POLLO", precio: "2,89" },
    { codigo: "68003", producto: "PECHUGA DE POLLO FRESCA ENTERA", categoria: "POLLO", precio: "5,79" },
    { codigo: "68028", producto: "PECHUGA DE POLLO FRESCA FILETEADA", categoria: "POLLO", precio: "6,40" },
    { codigo: "68001", producto: "POLLO PRIMERA FRESCO", categoria: "POLLO", precio: "3,95" },
    { codigo: "68044", producto: "FILETE PECHUGA CORRAL", categoria: "DESPIECE POLLO DE CORRAL", precio: "7,90" },
    { codigo: "14044", producto: "KEBAB TERNERA CONGELADO ROLLO 10KG", categoria: "ESPECIAL KEBAB", precio: "5,20" },
    { codigo: "63039", producto: "CHULETAS CORDERO FRESCAS", categoria: "CORDERO RECENTAL", precio: "19,50" },
    { codigo: "63013", producto: "CARRET LECHAL FRESCO", categoria: "CORDERO LECHAL", precio: "28,50" },
    { codigo: "65025", producto: "CHULETAS CERDO FRESCAS", categoria: "CERDO Y DESPIECE FRESCO", precio: "4,90" },
    { codigo: "65006", producto: "SOLOMILLO CERDO FRESCO", categoria: "CERDO Y DESPIECE FRESCO", precio: "6,90" },
    { codigo: "65046", producto: "HAMBURGUESA CERDO FRESCA", categoria: "HAMBURGUESAS", precio: "5,90" },
    { codigo: "68031", producto: "HAMBURGUESA POLLO FRESCA", categoria: "HAMBURGUESAS", precio: "6,90" },
    { codigo: "71018", producto: "HAMBURGUESA DE VACA", categoria: "HAMBURGUESAS", precio: "11,50" },
    { codigo: "67070", producto: "HAMBURGUESA ANGUS", categoria: "HAMBURGUESAS", precio: "12,50" },
    { codigo: "65051", producto: "CINTA DE LOMO", categoria: "CERDO IBÉRICO FRESCO", precio: "28,90" },
    { codigo: "67062", producto: "CHULETON AÑOJO FRESCO", categoria: "AÑOJO Y DESPIECE FRESCO", precio: "18,90" },
    { codigo: "67122", producto: "SOLOMILLO AÑOJO FRESCO +3", categoria: "AÑOJO Y DESPIECE FRESCO", precio: "30,50" },
    { codigo: "67053", producto: "LOMO ALTO ANGUS", categoria: "ANGUS", precio: "28,90" },
    { codigo: "66105", producto: "SOLOMILLO", categoria: "ANGUS", precio: "36,50" },
    { codigo: "70021", producto: "ENTRECOT BLANCO", categoria: "TERNERA BLANCA", precio: "26,50" },
    { codigo: "71057", producto: "SOLOMILLO BLANCO", categoria: "TERNERA BLANCA", precio: "33,40" },
    { codigo: "71020", producto: "ENTRECOT", categoria: "VACUNO", precio: "18,50" },
    { codigo: "41008", producto: "PECHUGA POLLO", categoria: "POLLO CONGELADO", precio: "5,70" },
    { codigo: "30068", producto: "PATATAS 3/8", categoria: "PATATAS", precio: "1,95" },
    { codigo: "20321", producto: "COLA LANGOSTINO 31/35", categoria: "LANGOSTINOS CONGELADOS", precio: "7,90" },
    { codigo: "12011", producto: "SOLOMILLO CERDO", categoria: "CERDO CONGELADO", precio: "6,90" },
    { codigo: "12086", producto: "CARRET COCHINILLO", categoria: "COCHINILLO CONGELADO", precio: "18,50" },
    { codigo: "75059", producto: "JAMÓN IBÉRICO BELLOTA", categoria: "EMBUTIDOS", precio: "49,50" },
    { codigo: "75372", producto: "JAMÓN IBÉRICO LONCHEADO", categoria: "EMBUTIDOS", precio: "72,40" },
    { codigo: "75226", producto: "QUESO CURADO MEZCLA", categoria: "QUESOS", precio: "9,95" },
    { codigo: "67116", producto: "HUEVOS FRESCOS L", categoria: "HUEVOS", precio: "2,95" },
];

export const INITIAL_PRODUCTS: Product[] = rawProducts.map((p, index) => {
    const precio_30 = parseFloat(p.precio.replace(',', '.'));
    const coste_base = precio_30 / 1.30;
    return {
        id: `prod-${index + 1}`,
        codigo: p.codigo,
        nombre: p.producto,
        categoria: p.categoria,
        precio_30: precio_30,
        coste_base: coste_base,
        fecha_creacion: new Date(),
        fecha_ultima_actualizacion: new Date(),
    };
});

export const CUSTOMER_TYPE_MARGINS: Record<CustomerType, number> = {
    [CustomerType.CHINO]: 0.17,
    [CustomerType.HINDU]: 0.17,
    [CustomerType.BASE]: 0.30,
    [CustomerType.HOSTELERIA]: 0.35, // Fixed internal logic value
    [CustomerType.HOTEL_CATERING_VOLUMEN]: 0.40, // Fixed internal logic value
};
