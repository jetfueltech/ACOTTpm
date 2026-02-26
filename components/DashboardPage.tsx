import React from 'react';
import { Link } from 'react-router-dom';
import { Property, Tenant, Transaction, Lease, TransactionType, SecurityDepositTransaction, SecurityDepositTransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatDateForDisplay } from '../constants';
import { BuildingIcon, DocumentIcon, DollarIcon, ArrowRightIcon, UsersIcon, ChecklistIcon, ShieldIcon, TrendingUpIcon } from './icons';

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
  change?: string;
  changePositive?: boolean;
  linkTo?: string;
}> = ({ title, value, icon, change, changePositive = true, linkTo }) => (
  <div className="bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-neutral-500">
        {icon}
      </div>
      <p className="text-sm font-medium text-neutral-500">{title}</p>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-extrabold text-neutral-900 tracking-tight">{value}</p>
      {change && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${changePositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {change}
        </span>
      )}
      {linkTo && !change && (
        <Link to={linkTo} className="text-xs font-medium text-neutral-400 hover:text-primary transition-colors flex items-center gap-1">
          View <ArrowRightIcon className="h-3 w-3" />
        </Link>
      )}
    </div>
  </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ properties, tenants, transactions, leases, securityDepositTransactions }) => {
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.tenantId).length;
  const activeLeasesCount = leases.filter(l => l.isActive).length;
  const vacantProperties = totalProperties - occupiedProperties;

  const overallMonthlyExpectedRent = leases
    .filter(l => l.isActive)
    .reduce((sum, l) => sum + l.monthlyRentAmount, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

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

  const recentTransactions = transactions.slice(0, 6);

  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;
  const rentPercentage = overallMonthlyExpectedRent > 0 ? Math.min(Math.round((actualCurrentMonthRentCollected / overallMonthlyExpectedRent) * 100), 100) : 0;

  const quickActions = [
    { label: 'Add Property', to: '/properties/new', icon: <BuildingIcon className="h-4 w-4" /> },
    { label: 'New Lease', to: '/leases/new', icon: <DocumentIcon className="h-4 w-4" /> },
    { label: 'Add Tenant', to: '/tenants/new', icon: <UsersIcon className="h-4 w-4" /> },
    { label: 'Log Transaction', to: '/financials', icon: <DollarIcon className="h-4 w-4" /> },
    { label: 'To-Do List', to: '/todos', icon: <ChecklistIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
        <p className="text-sm text-neutral-400 mt-0.5">Overview of your portfolio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total properties"
          value={totalProperties}
          icon={<BuildingIcon className="h-5 w-5" />}
          linkTo="/properties"
        />
        <StatCard
          title="Occupied units"
          value={occupiedProperties}
          icon={<UsersIcon className="h-5 w-5" />}
          change={`${occupancyRate}% rate`}
          changePositive={occupancyRate >= 50}
        />
        <StatCard
          title="Vacant units"
          value={vacantProperties}
          icon={<BuildingIcon className="h-5 w-5" />}
          change={vacantProperties === 0 ? 'Fully leased' : `${vacantProperties} available`}
          changePositive={vacantProperties === 0}
        />
        <StatCard
          title="Active leases"
          value={activeLeasesCount}
          icon={<DocumentIcon className="h-5 w-5" />}
          linkTo="/leases"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <TrendingUpIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-neutral-500">Rent collected</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${rentPercentage >= 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {rentPercentage}%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">{formatCurrency(actualCurrentMonthRentCollected)}</p>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${rentPercentage}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">of {formatCurrency(overallMonthlyExpectedRent)} expected this month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Security deposits held</p>
          </div>
          <p className="text-3xl font-extrabold text-neutral-900 tracking-tight">{formatCurrency(totalSecurityDepositsHeld)}</p>
          <p className="text-xs text-neutral-400 mt-2">Across {activeLeasesCount} active lease{activeLeasesCount !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card">
          <p className="text-sm font-semibold text-neutral-700 mb-3">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.slice(0, 4).map(action => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-neutral-600 bg-surface hover:bg-surface-200 transition-colors"
              >
                <span className="text-neutral-400">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
          <Link
            to="/todos"
            className="flex items-center gap-2 mt-2 p-2.5 rounded-xl text-xs font-medium text-neutral-600 bg-surface hover:bg-surface-200 transition-colors"
          >
            <span className="text-neutral-400"><ChecklistIcon className="h-4 w-4" /></span>
            To-Do List
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-sm font-semibold text-neutral-800">Recent transactions</h3>
          <Link to="/financials" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            View all <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-t border-surface-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-3.5 text-sm text-neutral-500 whitespace-nowrap">{formatDateForDisplay(tx.date)}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-neutral-800">{tx.description || tx.category || 'Transaction'}</p>
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-semibold text-right tabular-nums ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-neutral-400">No recent transactions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
