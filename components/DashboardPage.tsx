import React from 'react';
import { Link } from 'react-router-dom';
import { Property, Tenant, Transaction, Lease, TransactionType, SecurityDepositTransaction, SecurityDepositTransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatDateForDisplay } from '../constants';
import { BuildingIcon, DocumentIcon, DollarIcon, ArrowRightIcon, UsersIcon, ChecklistIcon, ShieldIcon } from './icons';

interface DashboardPageProps {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  leases: Lease[];
  securityDepositTransactions: SecurityDepositTransaction[];
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkTo?: string;
  linkText?: string;
  iconBg?: string;
  iconColor?: string;
}> = ({ title, value, icon, linkTo, linkText, iconBg = 'bg-primary/10', iconColor = 'text-primary' }) => (
  <div className="bg-white p-5 rounded-xl border border-neutral-200/80 hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    </div>
    {linkTo && linkText && (
      <Link to={linkTo} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-primary transition-colors">
        {linkText} <ArrowRightIcon className="h-3 w-3" />
      </Link>
    )}
  </div>
);

const RentTrackerCard: React.FC<{ title: string; collected: number; expected: number }> = ({ title, collected, expected }) => {
  const percentage = expected > 0 ? Math.min((collected / expected) * 100, 100) : 0;
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="bg-white p-5 rounded-xl border border-neutral-200/80 hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 tracking-tight">
            {formatCurrency(collected)} <span className="text-base font-normal text-neutral-400">/ {formatCurrency(expected)}</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
          <DollarIcon className="h-5 w-5" />
        </div>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage.toFixed(0)}%` }}
        />
      </div>
      <p className="text-right text-xs font-medium text-emerald-600 mt-1.5">{percentage.toFixed(0)}% collected</p>
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const actualCurrentMonthRentCollected = transactions
    .filter(tx => {
      if (tx.type === TransactionType.INCOME && tx.category === 'RENT') {
        const txDateParts = tx.date.split('-');
        if (txDateParts.length === 3) {
          const txYear = parseInt(txDateParts[0]);
          const txMonth = parseInt(txDateParts[1]) - 1;
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

  const quickActions = [
    { label: 'Add Property', to: '/properties/new', icon: <BuildingIcon className="h-4 w-4" /> },
    { label: 'Add Lease', to: '/leases/new', icon: <DocumentIcon className="h-4 w-4" /> },
    { label: 'Add Tenant', to: '/tenants/new', icon: <UsersIcon className="h-4 w-4" /> },
    { label: 'Log Transaction', to: '/financials', icon: <DollarIcon className="h-4 w-4" /> },
    { label: 'To-Do List', to: '/todos', icon: <ChecklistIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Properties"
          value={totalProperties}
          icon={<BuildingIcon className="h-5 w-5" />}
          linkTo="/properties"
          linkText="Manage"
        />
        <StatCard
          title="Occupied Units"
          value={`${occupiedProperties} / ${totalProperties}`}
          icon={<UsersIcon className="h-5 w-5" />}
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
        />
        <StatCard
          title="Active Leases"
          value={activeLeasesCount}
          icon={<DocumentIcon className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          linkTo="/leases"
          linkText="Manage"
        />
        <RentTrackerCard
          title="Rent (This Month)"
          collected={actualCurrentMonthRentCollected}
          expected={overallMonthlyExpectedRent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <StatCard
          title="Security Deposits Held"
          value={formatCurrency(totalSecurityDepositsHeld)}
          icon={<ShieldIcon className="h-5 w-5" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900">Recent Transactions</h3>
          </div>
          <div className="px-5 py-3">
            {recentTransactions.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {recentTransactions.map(tx => (
                  <li key={tx.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {tx.description || tx.category || 'Transaction'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{formatDateForDisplay(tx.date)}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-400 py-6 text-center">No recent transactions.</p>
            )}
          </div>
          <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50">
            <Link to="/financials" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-primary transition-colors">
              View all transactions <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {quickActions.map(action => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-neutral-200 text-neutral-500">
                  {action.icon}
                </span>
                {action.label}
                <ArrowRightIcon className="h-3 w-3 ml-auto text-neutral-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
