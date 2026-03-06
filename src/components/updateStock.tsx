import { useEffect, useState } from "react";
import { Product, supabase } from "../lib/supabase";
import { Plus, Trash2, FileDown } from "lucide-react";


export default function UpdateStock({title}: {title: string}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: string; quantity: number }>>([{productId: '', quantity: 0}]); // product_id -> quantity

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newSelectedProducts = [...selectedProducts];
        newSelectedProducts[index] = { ...newSelectedProducts[index], [field]: value };

        setSelectedProducts(newSelectedProducts);
    };
    const removeItem = (index: number) => {
    if (selectedProducts.length > 1) {
      setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    }
  };
  const addItem = () => {
    setSelectedProducts([...selectedProducts, { productId: '', quantity: 1 }]);
  };

  const handleUpdateStock = async () => {
    if (selectedProducts.filter(item => item.productId && item.quantity > 0).length === 0) {
      alert('Please select at least one product with quantity');
      return;
    }

    try {
      for (const item of selectedProducts) {
        if (item.productId && item.quantity > 0) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const newStock = (product.stock_available || 0) + item.quantity;
            const { error } = await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.productId);

            if (error) throw error;
          }
        }
      }

      alert('Stock updated successfully!');
      setSelectedProducts([{ productId: '', quantity: 0 }]);
      // Reload products to reflect updated stock
      loadProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock. Please try again.');
    }
  };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-8 text-center border-b pb-4">
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-600 mt-1">Update Stock</p>
                    </div>

                    <div className="space-y-6">
                        <div className="border-t pt-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>

                            <div className="space-y-4">
                                {selectedProducts.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <select
                                                value={item.productId}
                                                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                            >
                                                <option value="">Select Product</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                placeholder="Qty"
                                                min="0"
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                            />
                                        </div>

                                        <button
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            disabled={selectedProducts.length === 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addItem}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                            >
                                <Plus size={18} />
                                Add Product
                            </button>
                        </div>

                        <button
                            onClick={handleUpdateStock}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            <FileDown size={20} />
                            Update Stock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}