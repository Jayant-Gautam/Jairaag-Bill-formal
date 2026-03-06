import { useState, useEffect } from 'react';
import { Plus, Trash2, FileDown } from 'lucide-react';
import { supabase, Product, Invoice, InvoiceItem, CustomerAddress } from '../lib/supabase';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export default function InvoiceForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [boxes, setBoxes] = useState('');
  const [taxType, setTaxType] = useState<'IGST' | 'SGST_CGST'>('SGST_CGST');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCustomerAddress, setSelectedCustomerAddress] = useState('');

  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>>([{ productId: '', quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    loadProducts();
    loadCustomerAddresses();
  }, []);

  const loadCustomerAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_address')
        .select('*')
        .order('customer_name');

      if (error) throw error;
      // We can use this data to implement a dropdown for existing customers in the future
      setCustomerAddresses(data || []);
    } catch (error) {
      console.error('Error loading customer addresses:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = product.default_price;
      }
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    let subTotal = 0;
    const invoiceItems: InvoiceItem[] = [];

    items.forEach(item => {
      if (item.productId && item.quantity > 0) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const netValue = item.quantity * item.unitPrice;
          const taxAmount = netValue * 0.05;

          subTotal += netValue;
          invoiceItems.push({
            product_id: item.productId,
            product_name: product.name,
            hsn: product.hsn,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            net_value: netValue,
            tax_amount: taxAmount
          });
        }
      }
    });

    const totalTax = subTotal * 0.05;
    const grandTotal = subTotal + totalTax;

    return { subTotal, totalTax, grandTotal, invoiceItems };
  };

  const generateInvoiceNumber = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.invoice_number) {
      const lastNumber = parseInt(data.invoice_number);
      return (lastNumber + 1).toString();
    }
    return '147';
  };

  const handleGeneratePDF = async () => {
    if (!customerName || !customerAddress || !customerPhone) {
      alert('Please fill in all customer details');
      return;
    }

    if (items.filter(item => item.productId).length === 0) {
      alert('Please add at least one product');
      return;
    }

    try {
      const { subTotal, totalTax, grandTotal, invoiceItems } = calculateTotals();
      const invoiceNumber = await generateInvoiceNumber();

      const invoiceData: Invoice = {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_phone: customerPhone,
        customer_gstin: customerGstin,
        boxes: boxes,
        invoice_date: invoiceDate,
        tax_type: taxType,
        sub_total: subTotal,
        total_tax: totalTax,
        grand_total: grandTotal,
        items: invoiceItems
      };

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: customerName,
          customer_address: customerAddress,
          customer_phone: customerPhone,
          customer_gstin: customerGstin,
          boxes: boxes,
          invoice_date: invoiceDate,
          tax_type: taxType,
          sub_total: subTotal,
          total_tax: totalTax,
          grand_total: grandTotal
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      generateInvoicePDF(invoiceData);

      const q = await supabase
        .from('customer_address')
        .select('customer_name')
        .eq('customer_name', customerName)
        .maybeSingle();

      if (!q.data) {
        const { error: addError } = await supabase
          .from('customer_address')
          .insert({
            customer_name: customerName,
            customer_address: customerAddress,
            customer_phone: customerPhone,
            customer_gstin: customerGstin ? customerGstin : null
          });

        if (addError) throw addError;
      }


      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCustomerGstin('');
      setBoxes('');
      // setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  const { subTotal, totalTax, grandTotal } = calculateTotals();

  const handleAddress = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedCustomerAddress(selectedId);

    const address = customerAddresses.find(addr => addr.id === selectedId);
    if (address) {
      setCustomerName(address.customer_name);
      setCustomerAddress(address.customer_address);
      setCustomerPhone(address.customer_phone);
      setCustomerGstin(address.customer_gstin || '');
    } else {
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCustomerGstin('');
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

      <div className="max-w-4xl mx-auto mb-6 p-4 bg-white rounded-lg shadow">
        <label className=''>Choose Address</label>
        <select value={selectedCustomerAddress} onChange={handleAddress} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4'>
          <option value="">Select an address</option>
          {customerAddresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.customer_name}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8 text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">A.D. TRADERS</h1>
            <p className="text-sm text-gray-600 mt-1">Invoice Generator</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Dr. Kaushal Rao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="9888730624"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Address *
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="03XXXXX1234X1XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boxes
                </label>
                <input
                  type="text"
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="034+2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type *
                </label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as 'IGST' | 'SGST_CGST')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="SGST_CGST">SGST + CGST (2.5% + 2.5%)</option>
                  <option value="IGST">IGST (5%)</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>

              <div className="space-y-4">
                {items.map((item, index) => (
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
                        min="1"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />

                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Unit Price"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />

                      <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700 flex items-center">
                        ₹ {(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      disabled={items.length === 1}
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

            <div className="border-t pt-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sub Total:</span>
                  <span className="font-medium">₹ {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax ({taxType === 'IGST' ? 'IGST 5%' : 'SGST 2.5% + CGST 2.5%'}):
                  </span>
                  <span className="font-medium">₹ {totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span className="text-green-700">₹ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePDF}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <FileDown size={20} />
              Generate PDF Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
