import React, { useState, useEffect } from 'react';
import { Lease, Property, Tenant, SecurityDepositTransaction, SecurityDepositTransactionType, OptionType } from '../types';
import { formatDateForDisplay } from '../constants';
import { PlusIcon, TrashIcon, XMarkIcon } from './icons';

interface SecurityDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: Lease;
  properties: Property[];
  tenants: Tenant[];
  securityDepositTransactions: SecurityDepositTransaction[];
  addSecurityDepositTransaction: (sdt: Omit<SecurityDepositTransaction, 'id'>) => void;
  deleteSecurityDepositTransaction: (sdtId: string) => void;
}

const InputField: React.FC<{
  label: string; id: string; type?: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean; placeholder?: string; min?: number | string; step?: string; children?: React.ReactNode;
}> = ({ label, id, type = "text", value, onChange, required = false, placeholder, min, step, children }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    {children || (
      React.createElement(type === 'textarea' ? 'textarea' : 'input', {
        type: type === 'textarea' ? undefined : type,
        id: id, name: id, value: value, onChange: onChange, required: required,
        placeholder: placeholder, min: min, step: step,
        rows: type === 'textarea' ? 3 : undefined,
        className: "mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
      })
    )}
  </div>
);

const SecurityDepositModal: React.FC<SecurityDepositModalProps> = ({
  isOpen, onClose, lease, properties, tenants,
  securityDepositTransactions, addSecurityDepositTransaction, deleteSecurityDepositTransaction
}) => {
  const [type, setType] = useState<SecurityDepositTransactionType>(SecurityDepositTransactionType.COLLECTED);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const property = properties.find(p => p.id === lease.propertyId);
  const tenant = tenants.find(t => t.id === lease.tenantId);

  useEffect(() => {
    if (lease && type === SecurityDepositTransactionType.COLLECTED) {
      // Default amount to lease's deposit amount if not already collected
      const alreadyCollected = securityDepositTransactions.some(sdt => sdt.type === SecurityDepositTransactionType.COLLECTED);
      if (!alreadyCollected && lease.securityDepositAmount && amount === '') {
        setAmount(lease.securityDepositAmount);
      } else if (amount === '') {
        setAmount(''); // keep it blank if already collected or no default
      }
    } else if (amount === '') {
         setAmount(''); // Reset if type changes and amount was from default
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lease, type, securityDepositTransactions]); // Removed amount from deps to avoid loop on initial set

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount.toString());
    if (!(parsedAmount > 0) || !date) {
      setError("A positive amount and date are required.");
      return;
    }

    addSecurityDepositTransaction({
      leaseId: lease.id,
      propertyId: lease.propertyId,
      tenantId: lease.tenantId,
      type,
      amount: parsedAmount,
      date,
      notes: notes.trim() || undefined,
    });
    // Reset form
    setType(SecurityDepositTransactionType.COLLECTED);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    // Optionally close modal on successful add, or keep open to add more
    // onClose();
  };

  const formatCurrency = (num: number | undefined) => num ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num) : 'N/A';


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Manage Security Deposits</h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-neutral-50 rounded-md border border-neutral-200 text-sm">
            <p><strong>Lease:</strong> {property?.address || 'N/A'} - {tenant?.name || 'N/A'}</p>
            <p><strong>Agreed Deposit:</strong> {formatCurrency(lease.securityDepositAmount)}</p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {/* Form to Add New Security Deposit Transaction */}
            <form onSubmit={handleSubmit} className="p-4 border border-neutral-200 rounded-xl bg-primary-light/10">
                <h3 className="text-md font-semibold text-neutral-700 mb-3">Log New Deposit Transaction</h3>
                {error && <p className="mb-2 text-xs text-red-600 bg-red-100 p-2 rounded">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Transaction Type" id="sdt-type" value={type} onChange={e => setType(e.target.value as SecurityDepositTransactionType)} required>
                        <select id="sdt-type" value={type} onChange={e => setType(e.target.value as SecurityDepositTransactionType)} className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors">
                        {Object.values(SecurityDepositTransactionType).map(tVal => (
                            <option key={tVal} value={tVal}>{tVal.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                        </select>
                    </InputField>
                    <InputField label="Amount (USD)" id="sdt-amount" type="number" value={amount} onChange={e => setAmount(parseFloat((e.target as HTMLInputElement).value) || '')} required placeholder="e.g., 500.00" min="0.01" step="0.01" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Date" id="sdt-date" type="date" value={date} onChange={e => setDate((e.target as HTMLInputElement).value)} required />
                     <InputField label="Notes (Optional)" id="sdt-notes" type="text" value={notes} onChange={e => setNotes((e.target as HTMLInputElement).value)} placeholder="e.g., Initial collection, Partial refund" />
                </div>
                <button type="submit" className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors">
                    <PlusIcon className="h-4 w-4" /> Log Transaction
                </button>
            </form>

            {/* List of Existing Transactions */}
            <div className="mt-3">
                <h3 className="text-md font-semibold text-neutral-700 mb-2">Logged Deposit Transactions</h3>
                {securityDepositTransactions.length === 0 ? (
                <p className="text-sm text-neutral-500">No deposit transactions logged for this lease yet.</p>
                ) : (
                <ul className="divide-y divide-neutral-200">
                    {securityDepositTransactions.map(sdt => (
                    <li key={sdt.id} className="py-2.5 flex justify-between items-center text-sm">
                        <div>
                        <p className="font-medium text-neutral-700">
                            {sdt.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}: <span className={sdt.type === SecurityDepositTransactionType.COLLECTED ? 'text-green-600' : (sdt.type === SecurityDepositTransactionType.REFUNDED ? 'text-orange-600' : 'text-primary')}>{formatCurrency(sdt.amount)}</span>
                        </p>
                        <p className="text-xs text-neutral-500">Date: {formatDateForDisplay(sdt.date)}</p>
                        {sdt.notes && <p className="text-xs text-neutral-500 italic">Notes: {sdt.notes}</p>}
                        </div>
                        <button
                        onClick={() => { if(window.confirm('Are you sure you want to delete this deposit transaction?')) deleteSecurityDepositTransaction(sdt.id) }}
                        className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Delete deposit transaction"
                        >
                        <TrashIcon className="h-4 w-4" />
                        </button>
                    </li>
                    ))}
                </ul>
                )}
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Close
          </button>
        </div>
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        `}</style>
      </div>
    </div>
  );
};

export default SecurityDepositModal;
