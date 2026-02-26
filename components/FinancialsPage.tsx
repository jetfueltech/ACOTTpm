
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Property, TransactionType, OptionType } from '../types';
import TransactionItem from './TransactionItem';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { PlusIcon, DollarIcon, ChevronDownIcon } from './icons';

interface FinancialsPageProps {
  transactions: Transaction[];
  properties: Property[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

interface TransactionInputFieldProps {
  label: string;
  id: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  min?: number;
  step?: string;
  children?: React.ReactNode;
  placeholder?: string;
}

// Moved formatCurrency to module scope
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const TransactionFormInputField: React.FC<TransactionInputFieldProps> =
    ({label, id, type="text", value, onChange, required=false, min, step, children, placeholder}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
      {children ? (children) : (
        React.createElement(type === 'textarea' ? 'textarea' : 'input', {
            type: type === 'textarea' ? undefined : type,
            id: id,
            name: id,
            value: value,
            onChange: onChange,
            min: min,
            step: step,
            required: required,
            placeholder: placeholder,
            rows: type === 'textarea' ? 3 : undefined,
            className:"mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
        })
      )}
    </div>
  );


const TransactionForm: React.FC<{
    properties: Property[];
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onClose: () => void;
}> = ({ properties, onAddTransaction, onClose }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [propertyId, setPropertyId] = useState<string>('');

  const currentCategorySet = useMemo(() => type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES, [type]);
  const [category, setCategory] = useState<string>(Object.keys(currentCategorySet)[0]);

  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategory(Object.keys(currentCategorySet)[0]);
  }, [type, currentCategorySet]);

   useEffect(() => { // Pre-fill mortgage amount suggestion
    if (type === TransactionType.EXPENSE && category === 'MORTGAGE' && propertyId) {
      const selectedProperty = properties.find(p => p.id === propertyId);
      if (selectedProperty && selectedProperty.monthlyMortgage) {
        setAmount(selectedProperty.monthlyMortgage);
      }
    }
  }, [type, category, propertyId, properties]);


  const propertyOptions: OptionType[] = [
    { value: '', label: 'General (No Specific Property)'},
    ...properties.map(p => ({ value: p.id, label: p.address }))
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.toString());
    if (!category.trim() || !(parsedAmount > 0) || !date) {
        setError("Category, a positive amount, and date are required.");
        return;
    }
    setError(null);
    onAddTransaction({ type, propertyId: propertyId || '', category, amount: parsedAmount, date, description });
    onClose();
  };


  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl shadow-card space-y-6 mb-8">
      <h3 className="text-xl font-semibold text-neutral-700">Add New Transaction</h3>
       {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionFormInputField label="Type" id="type" required value={type} onChange={e => setType((e.target as HTMLSelectElement).value as TransactionType)}>
            <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors">
                <option value={TransactionType.INCOME}>Income</option>
                <option value={TransactionType.EXPENSE}>Expense</option>
            </select>
        </TransactionFormInputField>
        <TransactionFormInputField label="Property (Optional)" id="propertyId" value={propertyId} onChange={e => setPropertyId((e.target as HTMLSelectElement).value)}>
            <select id="propertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors">
                {propertyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </TransactionFormInputField>
      </div>
      <TransactionFormInputField label="Category" id="category" required value={category} onChange={e => setCategory((e.target as HTMLSelectElement).value)}>
         <select
            id="category"
            name="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
          >
            {Object.entries(currentCategorySet).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
      </TransactionFormInputField>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionFormInputField label="Amount (USD)" id="amount" type="number" value={amount} onChange={e => setAmount(parseFloat((e.target as HTMLInputElement).value) || '')} required min={0.01} step="0.01" placeholder="e.g. 100.00" />
        <TransactionFormInputField label="Date" id="date" type="date" value={date} onChange={e => setDate((e.target as HTMLInputElement).value)} required />
      </div>
       {type === TransactionType.EXPENSE && category === 'MORTGAGE' && propertyId && properties.find(p=>p.id === propertyId)?.monthlyMortgage && (
        <p className="text-xs text-neutral-500 -mt-5">Suggested amount: {formatCurrency(properties.find(p=>p.id === propertyId)?.monthlyMortgage || 0)}. You can adjust if needed.</p>
      )}
      <TransactionFormInputField label="Description (Optional)" id="description" type="textarea" value={description} onChange={e => setDescription((e.target as HTMLTextAreaElement).value)} placeholder="e.g., Monthly rent for Unit 5, Kitchen faucet repair"/>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="px-4 py-2.5 bg-surface text-neutral-600 hover:bg-surface-200 rounded-xl text-sm font-medium transition-colors">Cancel</button>
        <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">Add Transaction</button>
      </div>
    </form>
  );
};


const FinancialsPage: React.FC<FinancialsPageProps> = ({ transactions, properties, onAddTransaction, onDeleteTransaction }) => {
  const [showForm, setShowForm] = useState(false);

  const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
    const income = transactions
      .filter(tx => tx.type === TransactionType.INCOME)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions
      .filter(tx => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, netProfit: income - expenses };
  }, [transactions]);

  const getCategoryLabel = (categoryKey: string, type: TransactionType): string => {
    const source = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return source[categoryKey as keyof typeof source] || categoryKey;
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Financials</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {showForm ? 'Close Form' : 'Add Transaction'}
          <ChevronDownIcon className={`h-4 w-4 transform transition-transform ${showForm ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showForm && <TransactionForm properties={properties} onAddTransaction={onAddTransaction} onClose={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-card border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-emerald-700">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-red-700">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border-l-4 border-l-primary">
          <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-primary' : 'text-primary'}`}>Net Profit/Loss</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-primary'}`}>{formatCurrency(netProfit)}</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-card">
        <h3 className="text-xl font-semibold text-neutral-700 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
           <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
              <DollarIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-neutral-900">No transactions yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Log your income and expenses to see them here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
             <li className="py-2 px-2 hidden md:grid grid-cols-6 gap-4 font-semibold text-sm text-neutral-500">
                <div className="md:col-span-1">Date</div>
                <div className="md:col-span-2">Details</div>
                <div className="md:col-span-1">Amount</div>
                <div className="md:col-span-1">Description</div>
                <div className="md:col-span-1 text-right">Actions</div>
            </li>
            {transactions.map(tx => (
              <TransactionItem
                key={tx.id}
                transaction={{...tx, category: getCategoryLabel(tx.category, tx.type)}}
                properties={properties}
                onDelete={onDeleteTransaction}
               />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FinancialsPage;
