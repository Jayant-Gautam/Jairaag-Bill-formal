import InvoiceForm from './components/InvoiceForm';
import {Routes, Route} from 'react-router-dom';
import UpdateStock from './components/updateStock'; 
import {Link} from 'react-router-dom';
import { useState } from 'react';


function App() {
  const [title, setTitle] = useState<string>('M/s A.D. TRADERS');
  const [gstin, setGstin] = useState<string>('06ACAFA3701G1Z2');
  const [bankingDetails, setBankingDetails] = useState<{ bankName: string; accountNumber: string; ifsc: string; bankAddress: string }>({ bankName: 'State Bank of India', accountNumber: '00000041687809184', ifsc: 'SBIN0061721', bankAddress: 'Omaxe City, Sonepat' });
  const [fssai, setFssai] = useState<string>('20823020000311');
  return (
    <Routes>
      <Route path="/" element={<Home Title={setTitle} Gstin={setGstin} BankingDetails={setBankingDetails} Fssai={setFssai} />} />
      <Route path="/invoice" element={<InvoiceForm title={title} gstin={gstin} bankingDetails={bankingDetails} fssai={fssai} />} />
      <Route path="/update-stock" element={<UpdateStock title={title} />} />
    </Routes>
  )
}

interface HomePropsType {
  Title: React.Dispatch<React.SetStateAction<string>>,
  Gstin: React.Dispatch<React.SetStateAction<string>>, 
  BankingDetails: React.Dispatch<React.SetStateAction<{ bankName: string; accountNumber: string; ifsc: string; bankAddress: string }>>, 
  Fssai: React.Dispatch<React.SetStateAction<string>>
}

function Home(HomeProps: HomePropsType) {
  const [titleOptions, setTitleOptions] = useState<number>(0); // 0 and 1 for now, can be extended later

  function applySettings(option: number) {
    if (option === 0) {
      HomeProps.Title('M/s A.D. TRADERS');
      HomeProps.Gstin('06ACAFA3701G1Z2');
      HomeProps.BankingDetails({ bankName: 'State Bank of India', accountNumber: '00000041687809184', ifsc: 'SBIN0061721', bankAddress: 'Omaxe City, Sonepat' });
      HomeProps.Fssai('20823020000311');
    } else if (option === 1) {
      HomeProps.Title('JAIRAAG HERBALS');
      HomeProps.Gstin('06ALPPK6857M1Z9');
      HomeProps.BankingDetails({ bankName: 'State Bank of India', accountNumber: '00000044008726414', ifsc: 'SBIN0061721', bankAddress: 'Omaxe City, Sonepat' });
      HomeProps.Fssai('20825020000490');
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = parseInt(e.target.value);
    setTitleOptions(val);
    applySettings(val);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-8 text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">A.D. TRADERS</h1>
          <p className="text-sm text-gray-600 mt-1">Configure Application</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Title Format:
            </label>
            <select
              value={titleOptions}
              onChange={(e) => handleTitleChange(e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value={0}>Jairaag Traders</option>
              <option value={1}>Jairaag Traders - GSTIN: 27AAQFJ5678K1ZP</option>
            </select>
          </div>

          <div className="text-center">
            <Link
              to="/invoice"
              className="inline-block w-full md:w-auto mb-2 md:mb-0 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Create Invoice
            </Link>
            <Link
              to="/update-stock"
              className="inline-block w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Update Stock
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
