import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tenant, Property, Lease } from '../types';
import { formatDateForDisplay } from '../constants';

interface TenantsPageProps {
  tenants: Tenant[];
  properties: Property[];
  leases: Lease[]; 
  onDeleteTenant: (id: string) => void;
}

const TenantCard: React.FC<{ 
    tenant: Tenant; 
    activeLease?: Lease;
    propertyAddress?: string; 
    onDelete: (id: string) => void; 
    onEdit: (id: string) => void; 
}> = ({ tenant, activeLease, propertyAddress, onDelete, onEdit }) => {
    const displayPropertyAddress = activeLease ? propertyAddress : 'N/A (No active lease)';
    const displayLeaseEndDate = activeLease ? formatDateForDisplay(activeLease.leaseEndDate) : 'N/A';
    const displayLeaseStartDate = activeLease ? formatDateForDisplay(activeLease.leaseStartDate) : tenant.leaseStartDate ? formatDateForDisplay(tenant.leaseStartDate) : 'N/A';


    return (
      <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">{tenant.name}</h3>
        <div className="text-sm text-neutral-600 space-y-1 mb-4">
          <p><strong>Email:</strong> {tenant.email}</p>
          <p><strong>Phone:</strong> {tenant.phone || 'N/A'}</p>
          <p><strong>Property:</strong> {displayPropertyAddress}</p>
          {activeLease ? (
            <p><strong>Active Lease:</strong> {displayLeaseStartDate} - {displayLeaseEndDate}</p>
          ) : (
            <p><strong>Lease Term (historical/on record):</strong> {displayLeaseStartDate} - {formatDateForDisplay(tenant.leaseEndDate)}</p>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-neutral-200 flex justify-between items-center">
          <button
            onClick={() => onEdit(tenant.id)}
            className="text-sm font-medium text-secondary hover:text-secondary-dark"
          >
            Edit
          </button>
          <button
            onClick={() => { if(window.confirm(`Are you sure you want to delete tenant ${tenant.name}? This will also remove associated leases.`)) onDelete(tenant.id) }}
            className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center"
          >
            <span className="mr-1" role="img" aria-label="Delete">🗑️</span> Delete
          </button>
        </div>
      </div>
    );
};

const TenantsPage: React.FC<TenantsPageProps> = ({ tenants, properties, leases, onDeleteTenant }) => {
  const navigate = useNavigate();

  const findActiveLeaseForTenant = (tenantId: string): Lease | undefined => {
    return leases.find(l => l.tenantId === tenantId && l.isActive);
  };

  const getPropertyAddress = (propertyId: string): string | undefined => {
    return properties.find(p => p.id === propertyId)?.address;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-neutral-800">Tenants</h2>
        <Link
          to="/tenants/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
        >
          <span className="mr-2" role="img" aria-label="Add">➕</span>
          Add Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
         <div className="text-center py-12">
            <span className="text-5xl" role="img" aria-label="Users">👥</span>
            <h3 className="mt-2 text-lg font-medium text-neutral-900">No tenants yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Get started by adding your first tenant.</p>
            <div className="mt-6">
                <Link
                to="/tenants/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                <span className="mr-2" role="img" aria-label="Add">➕</span>
                Add New Tenant
                </Link>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map(tenant => {
            const activeLease = findActiveLeaseForTenant(tenant.id);
            const propertyAddress = activeLease ? getPropertyAddress(activeLease.propertyId) : getPropertyAddress(tenant.propertyId); 
            return (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  activeLease={activeLease}
                  propertyAddress={propertyAddress}
                  onDelete={onDeleteTenant}
                  onEdit={(id) => navigate(`/tenants/edit/${id}`)}
                />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TenantsPage;