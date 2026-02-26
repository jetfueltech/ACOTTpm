import React from 'react';
import { Transaction, TransactionType, Property } from '../types';
import { formatDateForDisplay } from '../constants';
import { TrashIcon } from './icons';

interface TransactionItemProps {
  transaction: Transaction; // Expects category to be the display label
  properties: Property[];
  onDelete: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, properties, onDelete }) => {
  const property = properties.find(p => p.id === transaction.propertyId);
  const propertyAddress = property ? property.address : 'General';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <li className="py-4 px-2 hover:bg-surface-50 rounded-xl transition-colors duration-150">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center">
        <div className="md:col-span-1 text-sm text-neutral-600">{formatDateForDisplay(transaction.date)}</div>
        <div className="md:col-span-2">
          {/* Display description first if available, otherwise category */}
          <p className="font-medium text-neutral-800">{transaction.description || transaction.category}</p>
          {/* Show property address and category (if description was primary) */}
          <p className="text-xs text-neutral-500">
            {propertyAddress}
            {transaction.description && transaction.category ? ` - ${transaction.category}` : ''}
          </p>
        </div>
        <div className={`md:col-span-1 font-semibold text-right md:text-left ${transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(transaction.amount)}
        </div>
        <div className="col-span-2 md:col-span-1 text-xs text-neutral-500 md:text-left truncate hidden md:block">
            {/* Display category here if description was primary, or description if it wasn't */}
            {transaction.description ? transaction.category : transaction.description }
        </div>
        <div className="md:col-span-1 flex justify-end">
          <button
            onClick={() => { if(window.confirm('Are you sure you want to delete this transaction?')) onDelete(transaction.id) }}
            className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            aria-label="Delete transaction"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default TransactionItem;
