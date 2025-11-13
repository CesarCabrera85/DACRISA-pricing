import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UserRole, CustomerType, type Product, type Customer, type PriceHistoryEntry } from './types';
import { INITIAL_PRODUCTS, CUSTOMER_TYPE_MARGINS } from './constants';
import { classifyCustomer } from './services/geminiService';
import { Modal, Spinner, SearchIcon, UserIcon, AdminIcon } from './components/common';

// --- Main App Component ---
const App: React.FC = () => {
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.COMERCIAL);
    const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const addCustomer = (customer: Customer) => {
        setCustomers(prev => [customer, ...prev]);
    };

    const updateProductCost = (productId: string, newCost: number) => {
        let updatedProduct: Product | undefined;
        const originalProduct = products.find(p => p.id === productId);
        if (!originalProduct) return;

        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                updatedProduct = { ...p, coste_base: newCost, fecha_ultima_actualizacion: new Date() };
                return updatedProduct;
            }
            return p;
        }));

        if (updatedProduct) {
            const historyEntry: PriceHistoryEntry = {
                id: `hist-${Date.now()}`,
                producto_id: productId,
                producto_nombre: updatedProduct.nombre,
                coste_anterior: originalProduct.coste_base,
                coste_nuevo: newCost,
                fecha_cambio: new Date(),
            };
            setPriceHistory(prev => [historyEntry, ...prev]);
        }
    };

    const header = (
        <Header currentUserRole={currentUserRole} onRoleChange={setCurrentUserRole} />
    );

    if (selectedCustomer) {
        return (
            <div className="min-h-screen bg-base-100 text-gray-200">
                {header}
                <PriceCheckerView
                    customer={selectedCustomer}
                    products={products}
                    onBack={() => setSelectedCustomer(null)}
                />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-base-100 text-gray-200">
            {header}
            <main className="p-4 sm:p-6 md:p-8">
                {currentUserRole === UserRole.ADMIN ? (
                    <AdminView products={products} priceHistory={priceHistory} onUpdateCost={updateProductCost} />
                ) : (
                    <ComercialView customers={customers} onAddCustomer={addCustomer} onSelectCustomer={setSelectedCustomer} />
                )}
            </main>
        </div>
    );
};

// --- Header Component ---
interface HeaderProps {
    currentUserRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUserRole, onRoleChange }) => {
    const isComercial = currentUserRole === UserRole.COMERCIAL;

    return (
        <header className="bg-neutral shadow-lg p-4 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">
                Dacrisa<span className="text-accent">Pricing</span>
            </h1>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 hidden sm:block">Current Role:</span>
                <div className="flex items-center bg-base-100 rounded-full p-1">
                    <button
                        onClick={() => onRoleChange(UserRole.COMERCIAL)}
                        className={`p-2 rounded-full transition-colors duration-300 ${isComercial ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        title="Comercial Role"
                        aria-label="Switch to Comercial Role"
                    >
                        <UserIcon />
                    </button>
                    <button
                        onClick={() => onRoleChange(UserRole.ADMIN)}
                        className={`p-2 rounded-full transition-colors duration-300 ${!isComercial ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        title="Admin Role"
                        aria-label="Switch to Admin Role"
                    >
                        <AdminIcon />
                    </button>
                </div>
            </div>
        </header>
    );
};

// --- View Components ---

// Comercial View
interface ComercialViewProps {
    customers: Customer[];
    onAddCustomer: (customer: Customer) => void;
    onSelectCustomer: (customer: Customer) => void;
}

const ComercialView: React.FC<ComercialViewProps> = ({ customers, onAddCustomer, onSelectCustomer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Customer Management</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-accent hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    + Add Prospect
                </button>
            </div>
            {customers.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No customers yet. Click 'Add Prospect' to start.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map(c => (
                        <div key={c.id} className="bg-neutral rounded-lg shadow-md p-4 flex flex-col justify-between hover:shadow-accent/50 transition-shadow">
                            <div>
                                <h3 className="font-bold text-lg text-white">{c.nombre}</h3>
                                <p className="text-sm text-gray-400">{c.direccion}</p>
                                {c.googleMapsCategory && (
                                    <p className="text-xs text-gray-500 italic mt-1">
                                        Google Maps Category: "{c.googleMapsCategory}"
                                    </p>
                                )}
                                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${c.tipo_cliente === CustomerType.BASE ? 'bg-gray-600' : 'bg-blue-800'} text-white`}>
                                    {c.tipo_cliente}
                                </span>
                            </div>
                            <button onClick={() => onSelectCustomer(c)} className="mt-4 w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                Consult Prices
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <AddProspectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCustomer={onAddCustomer} />
        </>
    );
};

// Price Checker View
interface PriceCheckerViewProps {
    customer: Customer;
    products: Product[];
    onBack: () => void;
}

const PriceCheckerView: React.FC<PriceCheckerViewProps> = ({ customer, products, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');

    const margin = CUSTOMER_TYPE_MARGINS[customer.tipo_cliente];
    const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.categoria)))], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo.includes(searchTerm)) &&
            (category === 'all' || p.categoria === category)
        );
    }, [products, searchTerm, category]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-6">
                <button onClick={onBack} className="text-accent hover:underline mb-4">&larr; Back to Customers</button>
                <h2 className="text-2xl font-semibold">Price Consultation</h2>
                <p className="text-gray-400">For: <span className="font-bold text-white">{customer.nombre}</span> ({customer.tipo_cliente})</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-base-100 py-4 z-10">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="bg-neutral border border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-accent md:w-auto w-full"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat} className="capitalize bg-neutral text-white">
                           {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(p => {
                    const finalPrice = p.coste_base * (1 + margin);
                    return (
                        <div key={p.id} className="bg-neutral rounded-lg shadow-md p-4 flex flex-col justify-between transition-transform transform hover:-translate-y-1">
                            <div>
                                <h3 className="font-bold text-lg text-white">{p.nombre}</h3>
                                <p className="text-sm text-gray-400">#{p.codigo}</p>
                                <p className="text-xs text-gray-500 capitalize">{p.categoria.toLowerCase()}</p>
                            </div>
                            <p className="text-2xl font-bold text-accent self-end mt-4">
                                €{finalPrice.toFixed(2)}
                            </p>
                        </div>
                    );
                })}
            </div>
             {filteredProducts.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-400">No products found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

// Admin View
interface AdminViewProps {
    products: Product[];
    priceHistory: PriceHistoryEntry[];
    onUpdateCost: (productId: string, newCost: number) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ products, priceHistory, onUpdateCost }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [newCost, setNewCost] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleUpdateClick = (product: Product) => {
        setSelectedProduct(product);
        setNewCost(product.coste_base.toFixed(2));
    };

    const handleModalClose = () => {
        setSelectedProduct(null);
        setNewCost('');
    };

    const handleCostSave = () => {
        if (selectedProduct && newCost) {
            const costValue = parseFloat(newCost);
            if (!isNaN(costValue) && costValue >= 0) {
                onUpdateCost(selectedProduct.id, costValue);
                handleModalClose();
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo.includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-semibold mb-4">Product Management</h2>
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search products by name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                <div className="bg-neutral rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Code</th>
                                    <th scope="col" className="px-6 py-3">Product</th>
                                    <th scope="col" className="px-6 py-3">Category</th>
                                    <th scope="col" className="px-6 py-3 text-right">Base Cost</th>
                                    <th scope="col" className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-800">
                                        <td className="px-6 py-4">{p.codigo}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{p.nombre}</th>
                                        <td className="px-6 py-4">{p.categoria}</td>
                                        <td className="px-6 py-4 text-right">€{p.coste_base.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleUpdateClick(p)} className="font-medium text-accent hover:underline">
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4">Price Change History</h2>
                <div className="bg-neutral rounded-lg shadow-md p-4 max-h-[60vh] overflow-y-auto">
                    {priceHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No price changes yet.</p>
                    ) : (
                        <ul className="space-y-4">
                            {priceHistory.map(h => (
                                <li key={h.id} className="border-b border-gray-700 pb-3">
                                    <p className="font-semibold text-white">{h.producto_nombre}</p>
                                    <p className="text-sm text-gray-400">
                                        <span className="text-warning">€{h.coste_anterior.toFixed(2)}</span> &rarr; <span className="text-success">€{h.coste_nuevo.toFixed(2)}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{new Date(h.fecha_cambio).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <Modal isOpen={!!selectedProduct} onClose={handleModalClose} title={`Update Cost for ${selectedProduct?.nombre}`}>
                <div>
                    <label htmlFor="newCost" className="block text-sm font-medium text-gray-300 mb-1">New Base Cost (€)</label>
                    <input
                        type="number"
                        id="newCost"
                        value={newCost}
                        onChange={e => setNewCost(e.target.value)}
                        className="w-full bg-neutral border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g., 5.95"
                        min="0"
                        step="0.01"
                    />
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={handleModalClose} className="text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleCostSave} className="bg-accent hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Add Prospect Modal
interface AddProspectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCustomer: (customer: Customer) => void;
}

const AddProspectModal: React.FC<AddProspectModalProps> = ({ isOpen, onClose, onAddCustomer }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !address) {
            setError('Both name and address are required.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const classificationResult = await classifyCustomer(name, address);
            const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                ...classificationResult,
                fecha_registro: new Date(),
            };
            onAddCustomer(newCustomer);
            handleClose();
        } catch (err) {
            console.error(err);
            setError('Failed to classify customer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        if (isLoading) return;
        setName('');
        setAddress('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Prospect">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-neutral border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="e.g., Restaurante China Dragon"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-neutral border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="e.g., Calle Falsa 123, Madrid"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>
                {error && <p className="text-error text-sm mt-4">{error}</p>}
                <div className="mt-6 flex justify-end items-center gap-4">
                    <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white transition-colors disabled:text-gray-600" disabled={isLoading}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-accent hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center min-w-[140px] justify-center"
                    >
                        {isLoading ? <Spinner /> : 'Add & Classify'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


export default App;