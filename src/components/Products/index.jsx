import { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TableData } from '../ui/table';
import ProductService from '../../services/ProductService';
import Form from './form';
import { AuthContext } from '../../services/Auth/AuthContext';
import { DeleteIcon, EditIcon, MenuIcon, PlusIcon, SearchIcon } from '../ui/icons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '../ui/input';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]); // Para la lista filtrada
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(0); // Estado para la página actual
    const [pageSize] = useState(10); // Tamaño de página
    const [totalElements, setTotalElements] = useState(0); // Estado para el total de elementos
    const [searchQuery, setSearchQuery] = useState(''); // Estado para la búsqueda
    const { user } = useContext(AuthContext);

    const fetchProducts = async (page) => {
        try {
            const response = await ProductService.getAllProducts({ page, size: pageSize });
            setProducts(response.content); // Asumiendo que la respuesta tiene un campo 'content' con los productos
            setFilteredProducts(response.content); // Inicialmente mostrar todos los productos
            setTotalElements(response.totalElements); // Asumiendo que la respuesta tiene un campo 'totalElements'
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage); // Llamada a la función de carga de productos
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage); // Actualizar la página actual
    };

    const handleProductCreate = async (newProduct) => {
        try {
            const createdProduct = await ProductService.save(newProduct);
            setProducts([...products, createdProduct]);
            setFilteredProducts([...products, createdProduct]); // Actualizar lista filtrada
            setSelectedProduct(null);
        } catch (error) {
            console.error('Error creating product:', error);
        }
    };

    const handleProductUpdate = async (updatedProduct) => {
        try {
            const product = await ProductService.update(updatedProduct.id, updatedProduct);
            const updatedProducts = products.map((p) => 
                p.id === updatedProduct.id ? product : p
            );
            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts); // Actualizar lista filtrada
            setSelectedProduct(null);
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const handleProductDelete = async (productId) => {
        try {
            await ProductService.delete(productId);
            const updatedProducts = products.filter((p) => p.id !== productId);
            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts); // Actualizar lista filtrada
            setSelectedProduct(null);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const openConfirmModal = (product) => {
        setProductToDelete(product);
        setIsModalOpen(true);
    };
    
    const confirmDeleteProduct = () => {
        if (productToDelete) {
            handleProductDelete(productToDelete.id);
        }
        setIsModalOpen(false);
    };

    const getActions = () => {
        const actions = [];
        if (user?.authorities.includes('Product.update')) {
            actions.push({
                label: "Editar",
                icon: <EditIcon className="h-4 w-4"/>,
                onClick: (product) => setSelectedProduct(product),
            });
        }
        if (user?.authorities.includes('Product.delete')) {
            actions.push({
                label: "Eliminar",
                icon: <DeleteIcon className="h-4 w-4"/>,
                onClick: (product) => openConfirmModal(product),
            });
        }
        return actions;
    };

    const columns = [
        { name: "id", label: "ID" },
        { name: "code", label: "Código" },
        { name: "name", label: "Nombre" },
        { name: "price", label: "Precio",  callback: (total) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'PYG' }).format(total).replace('PYG', '₲'), align: 'right' },
        { name: "stock", label: "Stock", align: 'right'},
        { name: "category.name", label: "Categoría" },
    ];

    // Función para manejar la búsqueda
    const handleSearch = (event) => {
        const searchQuery = event.target.value;
        setSearchQuery(searchQuery);

        // Filtrar productos por el nombre o código (agregando validación)
        const filtered = products.filter((product) => 
            (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredProducts(filtered);
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {selectedProduct ? (
                <Form
                    selectedProduct={selectedProduct}
                    handleProductUpdate={handleProductUpdate}
                    handleProductCreate={handleProductCreate}
                    setProduct={setSelectedProduct}
                />
            ) : (
                <div className="grid gap-4 md:gap-8">
                    <div className="flex justify-between items-center">
                        <div className="relative w-80">
                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Búsqueda"
                                value={searchQuery}
                                onChange={handleSearch} // Escuchar cambios en el input
                                className="w-full bg-background shadow-none appearance-none pl-8 md:w-2/3 lg:w-3/3"
                            />
                        </div>      
                        <div className="flex gap-2">
                            {user?.authorities.includes('Product.read') && (
                                <Button key={1} variant="primary"  >
                                    <MenuIcon className="h-4 w-4 mr-1" />Reporte
                                </Button>
                            )}
                            {user?.authorities.includes('Product.create') && (
                                <Button key={2} variant="primary" onClick={() => setSelectedProduct({})}>
                                    <PlusIcon className="h-4 w-4 mr-1" /> Crear Producto
                                </Button>
                            )}
                            
                        </div>                      

                    </div>
                    <Card>
                        <CardContent>
                            <TableData 
                                data={filteredProducts} // Mostrar solo productos filtrados
                                columns={columns} 
                                actions={getActions()} 
                                totalElements={totalElements}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmDeleteProduct}
                title="Confirmar eliminación"
                message="¿Estás seguro de que deseas eliminar este producto?"
            />
        </main>
    );
}
