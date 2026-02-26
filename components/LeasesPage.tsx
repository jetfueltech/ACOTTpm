import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lease, Property, Tenant, SecurityDepositTransaction } from '../types';
import { formatDateForDisplay } from '../constants';
import SecurityDepositModal from './SecurityDepositModal';
import { PlusIcon, TrashIcon, EditIcon, DocumentIcon, ShieldIcon } from './icons';

interface LeasesPageProps {
  leases: Lease[];
  properties: Property[];
  tenants: Tenant[];
  onDeleteLease: (id: string) => void;
  securityDepositTransactions: SecurityDepositTransaction[];
  addSecurityDepositTransaction: (sdt: Omit<SecurityDepositTransaction, 'id'>) => void;
  deleteSecurityDepositTransaction: (id: string) => void;
}

const LeaseCard: React.FC<{
    lease: Lease;
    propertyAddress?: string;
    tenantName?: string;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onManageDeposits: (leaseId: string) => void;
}> = ({ lease, propertyAddress, tenantName, onDelete, onEdit, onManageDeposits }) => {
  const getStatus = (l: Lease): { text: string, color: string } => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date(l.leaseStartDate);
    const endDate = new Date(l.leaseEndDate);

    if (l.isActive) return { text: 'Active', color: 'text-green-600' };
    if (endDate < today) return { text: 'Expired', color: 'text-red-600' };
    if (startDate > today) return { text: 'Future', color: 'text-blue-500' };
    return { text: 'Inactive', color: 'text-neutral-500' };
  };

  const status = getStatus(lease);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col">
      <div className="mb-3">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-neutral-800">{propertyAddress || 'Unknown Property'}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')} ${status.color}`}>
                {status.text}
            </span>
        </div>
        <p className="text-sm text-neutral-500">Tenant: {tenantName || 'Unknown Tenant'}</p>
      </div>

      <div className="text-sm text-neutral-600 space-y-1 mb-4 flex-grow">
        <p><strong>Term:</strong> {formatDateForDisplay(lease.leaseStartDate)} - {formatDateForDisplay(lease.leaseEndDate)}</p>
        <p><strong>Rent:</strong> ${lease.monthlyRentAmount.toLocaleString()}/month</p>
        {lease.securityDepositAmount && <p><strong>Agreed Deposit:</strong> ${lease.securityDepositAmount.toLocaleString()}</p>}
        {lease.moveInDate && <p><strong>Move-In:</strong> {formatDateForDisplay(lease.moveInDate)}</p>}
      </div>

      <div className="mt-auto pt-3 border-t border-neutral-200 flex flex-wrap justify-between items-center gap-2">
        <button onClick={() => onEdit(lease.id)} className="text-sm font-medium text-secondary hover:text-secondary-dark px-2 py-1">
          Edit Lease
        </button>
        <button onClick={() => onManageDeposits(lease.id)} className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1.5 px-2 py-1">
            <ShieldIcon className="h-3.5 w-3.5" /> Manage Deposits
        </button>
        <button onClick={() => { if(window.confirm(`Are you sure you want to delete this lease for ${propertyAddress}? This will also remove associated security deposit records.`)) onDelete(lease.id) }}
          className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1.5 px-2 py-1">
          <TrashIcon className="h-4 w-4" /> Delete
        </button>
      </div>
    </div>
  );
};

const LeasesPage: React.FC<LeasesPageProps> = ({
    leases, properties, tenants, onDeleteLease,
    securityDepositTransactions, addSecurityDepositTransaction, deleteSecurityDepositTransaction
}) => {
  const navigate = useNavigate();
  const [selectedLeaseForDeposit, setSelectedLeaseForDeposit] = useState<Lease | null>(null);

  const getPropertyAddress = (propertyId: string): string | undefined => {
    return properties.find(p => p.id === propertyId)?.address;
  };

  const getTenantName = (tenantId: string): string | undefined => {
    return tenants.find(t => t.id === tenantId)?.name;
  };

  const sortedLeases = [...leases].sort((a,b) => {
    const statusOrder = (l: Lease) => l.isActive ? 0 : (new Date(l.leaseStartDate) > new Date() ? 1 : 2);
    if(statusOrder(a) !== statusOrder(b)) return statusOrder(a) - statusOrder(b);
    return new Date(b.leaseEndDate).getTime() - new Date(a.leaseEndDate).getTime();
  });

  const handleManageDeposits = (leaseId: string) => {
    const lease = leases.find(l => l.id === leaseId);
    if (lease) setSelectedLeaseForDeposit(lease);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">Lease Agreements</h2>
        <Link
          to="/leases/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add New Lease
        </Link>
      </div>

      {leases.length === 0 ? (
         <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
              <DocumentIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-neutral-900">No leases yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Get started by adding your first lease agreement.</p>
            <div className="mt-6">
                <Link
                to="/leases/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors"
                >
                <PlusIcon className="h-4 w-4" />
                Add New Lease
                </Link>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLeases.map(lease => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              propertyAddress={getPropertyAddress(lease.propertyId)}
              tenantName={getTenantName(lease.tenantId)}
              onDelete={onDeleteLease}
              onEdit={(id) => navigate(`/leases/edit/${id}`)}
              onManageDeposits={handleManageDeposits}
            />
          ))}
        </div>
      )}
      {selectedLeaseForDeposit && (
        <SecurityDepositModal
            isOpen={!!selectedLeaseForDeposit}
            onClose={() => setSelectedLeaseForDeposit(null)}
            lease={selectedLeaseForDeposit}
            properties={properties}
            tenants={tenants}
            securityDepositTransactions={securityDepositTransactions.filter(sdt => sdt.leaseId === selectedLeaseForDeposit.id)}
            addSecurityDepositTransaction={addSecurityDepositTransaction}
            deleteSecurityDepositTransaction={deleteSecurityDepositTransaction}
        />
      )}
    </div>
  );
};

export default LeasesPage;
