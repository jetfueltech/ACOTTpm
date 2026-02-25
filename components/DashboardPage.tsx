import React from 'react';
import { Link } from 'react-router-dom';
import { Property, Tenant, Transaction, Lease, TransactionType, SecurityDepositTransaction, SecurityDepositTransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatDateForDisplay } from '../constants';

interface DashboardPageProps {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  leases: Lease[];
  securityDepositTransactions: SecurityDepositTransaction[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; linkTo?: string; linkText?: string, className?: string }> = 
    ({ title, value, icon, linkTo, linkText, className }) => (
  <div className={`bg-white p-6 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors duration-200 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-500 uppercase">{title}</p>
        <p className="text-3xl font-bold text-neutral-800">{value}</p>
      </div>
      <div className="p-3 bg-primary-light rounded-full text-primary-dark text-2xl">
        <span role="img" aria-label={title}>{icon}</span>
      </div>
    </div>
    {linkTo && linkText && (
      <Link to={linkTo} className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark">
        {linkText} <span aria-hidden="true" className="ml-1">&rarr;</span>
      </Link>
    )}
  </div>
);

const RentTrackerCard: React.FC<{ title: string; collected: number; expected: number; icon: string }> = 
    ({ title, collected, expected, icon }) => {
    const percentage = expected > 0 ? Math.min((collected / expected) * 100, 100) : 0;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-sm font-medium text-neutral-500 uppercase">{title}</p>
                    <p className="text-2xl font-bold text-neutral-800">
                        {formatCurrency(collected)} / <span className="text-lg text-neutral-600">{formatCurrency(expected)}</span>
                    </p>
                </div>
                 <div className="p-3 bg-green-100 rounded-full text-green-600 text-2xl">
                    <span role="img" aria-label={title}>{icon}</span>
                </div>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3 mb-1 overflow-hidden">
                <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${percentage.toFixed(0)}%` }}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
            <p className="text-right text-sm font-medium text-green-600">{percentage.toFixed(0)}% Collected</p>
        </div>
    );
};


const DashboardPage: React.FC<DashboardPageProps> = ({ properties, tenants, transactions, leases, securityDepositTransactions }) => {
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.tenantId).length; 
  const activeLeasesCount = leases.filter(l => l.isActive).length;
  
  const overallMonthlyExpectedRent = leases
    .filter(l => l.isActive)
    .reduce((sum, l) => sum + l.monthlyRentAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentYear = today.getFullYear();

  const actualCurrentMonthRentCollected = transactions
    .filter(tx => {
        if (tx.type === TransactionType.INCOME && tx.category === 'RENT') { 
            const txDateParts = tx.date.split('-');
            if (txDateParts.length === 3) {
                const txYear = parseInt(txDateParts[0]);
                const txMonth = parseInt(txDateParts[1]) - 1; // 0-indexed month
                return txMonth === currentMonth && txYear === currentYear;
            }
        }
        return false;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSecurityDepositsHeld = securityDepositTransactions.reduce((acc, sdt) => {
    if (sdt.type === SecurityDepositTransactionType.COLLECTED) return acc + sdt.amount;
    if (sdt.type === SecurityDepositTransactionType.REFUNDED || sdt.type === SecurityDepositTransactionType.FORFEITED_TO_INCOME) return acc - sdt.amount;
    return acc;
  }, 0);


  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-neutral-800 mb-2">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Properties" value={totalProperties} icon="🏢" linkTo="/properties" linkText="Manage Properties"/>
        <StatCard title="Occupied Units" value={`${occupiedProperties} / ${totalProperties}`} icon="🏠" />
        <StatCard title="Active Leases" value={activeLeasesCount} icon="📄" linkTo="/leases" linkText="Manage Leases"/>
        <RentTrackerCard 
            title="Rent Collection (This Month)" 
            collected={actualCurrentMonthRentCollected} 
            expected={overallMonthlyExpectedRent} 
            icon="💵"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="Total Security Deposits Held" value={formatCurrency(totalSecurityDepositsHeld)} icon="💰" className="md:col-span-2 lg:col-span-1"/>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-neutral-200">
          <h3 className="text-xl font-semibold text-neutral-700 mb-4">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <ul className="divide-y divide-neutral-200">
              {recentTransactions.map(tx => (
                <li key={tx.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-neutral-700">{tx.description || (Object.values(INCOME_CATEGORIES).includes(tx.category as any) ? tx.category : Object.values(EXPENSE_CATEGORIES).includes(tx.category as any) ? tx.category : tx.category) || 'Transaction'}</p>
                    <p className="text-sm text-neutral-500">{formatDateForDisplay(tx.date)}</p>
                  </div>
                  <p className={`font-semibold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 py-4">No recent transactions.</p>
          )}
           <Link to="/financials" className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark">
            View All Transactions <span aria-hidden="true" className="ml-1">&rarr;</span>
          </Link>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200">
          <h3 className="text-xl font-semibold text-neutral-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/properties/new" className="flex items-center justify-center w-full text-left p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
              <span className="mr-2" role="img" aria-label="Add">➕</span> Add New Property
            </Link>
             <Link to="/leases/new" className="flex items-center justify-center w-full text-left p-3 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors text-sm font-medium">
              <span className="mr-2" role="img" aria-label="Add">➕</span> Add New Lease
            </Link>
            <Link to="/tenants/new" className="flex items-center justify-center w-full text-left p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium">
              <span className="mr-2" role="img" aria-label="Add">➕</span> Add New Tenant
            </Link>
            <Link to="/financials" className="flex items-center justify-center w-full text-left p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
              <span className="mr-2" role="img" aria-label="Add">➕</span> Log Income/Expense
            </Link>
            <Link to="/todos" className="flex items-center justify-center w-full text-left p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium">
              <span className="mr-2" role="img" aria-label="To-Do">✅</span> Manage To-Do List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;