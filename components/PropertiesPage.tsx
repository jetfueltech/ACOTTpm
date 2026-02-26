import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Property, Tenant, Lease } from '../types';
import { formatDateForDisplay } from '../constants';
import { CardHoverReveal, CardHoverRevealMain, CardHoverRevealContent } from './ui/reveal-on-hover';
import { PlusIcon, TrashIcon, EditIcon, DollarIcon, BuildingIcon } from './icons';

interface PropertiesPageProps {
  properties: Property[];
  tenants: Tenant[];
  leases: Lease[];
  onDeleteProperty: (id: string) => void;
}

const PropertyCard: React.FC<{
  property: Property;
  activeLease?: Lease;
  tenantName?: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ property, activeLease, tenantName, onDelete, onEdit }) => {
  const isOccupied = !!activeLease;
  const currentRent = activeLease ? activeLease.monthlyRentAmount : property.rentAmount;

  const genericImageUrl = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=75`;
  const displayImageUrl = property.imageUrl && property.imageUrl.includes('picsum.photos')
    ? genericImageUrl
    : (property.imageUrl || genericImageUrl);

  return (
    <CardHoverReveal className="rounded-xl border border-neutral-200/70 overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHoverRevealMain initialScale={1} hoverScale={1.03}>
        <img className="w-full h-full object-cover" src={displayImageUrl} alt={property.address} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 flex flex-col justify-end
                        group-hover:opacity-0 transition-opacity duration-300 ease-in-out">
          <h3 className="text-lg font-semibold text-white mb-0.5 leading-tight">{property.address}</h3>
          <p className="text-sm text-neutral-200">${currentRent.toLocaleString()}/month</p>
        </div>
      </CardHoverRevealMain>

      <CardHoverRevealContent className="bg-neutral-800/90 text-neutral-50 rounded-2xl space-y-2 md:space-y-3 shadow-2xl !p-4 md:!p-5">
        <h3 className="text-base md:text-lg font-semibold leading-tight">{property.address}</h3>

        <div className="flex justify-between items-center text-xs md:text-sm text-neutral-300">
          <span>{property.type}</span>
          <span className="font-semibold text-primary-light">${currentRent.toLocaleString()}/month</span>
        </div>

        <div className="text-xs md:text-sm text-neutral-300 space-y-1 border-t border-neutral-700 pt-2 mt-2">
          <p><strong>Beds:</strong> {property.bedrooms} | <strong>Baths:</strong> {property.bathrooms}</p>
          <p><strong>Status:</strong> <span className={`${isOccupied ? "text-green-400" : "text-orange-400"} font-semibold`}>{isOccupied ? "Occupied" : "Vacant"}</span></p>
          {isOccupied && tenantName && <p className="truncate"><strong>Tenant:</strong> {tenantName}</p>}
          {isOccupied && activeLease && <p><strong>Leased Until:</strong> {formatDateForDisplay(activeLease.leaseEndDate)}</p>}
        </div>

        <p className="text-xs text-neutral-300 max-h-12 md:max-h-14 overflow-y-auto custom-scrollbar-reveal leading-snug">{property.description}</p>

        <div className="flex flex-wrap justify-start items-center gap-2 pt-2 border-t border-neutral-700 mt-2">
          <button
            onClick={() => onEdit(property.id)}
            className="text-xs font-medium text-secondary-light hover:text-secondary flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-700/80 hover:bg-neutral-600/80 rounded-md transition-colors"
            aria-label={`Edit ${property.address}`}
          >
            <EditIcon className="h-3 w-3" /> Edit
          </button>
          <Link
            to={`/properties/${property.id}/finances`}
            className="text-xs font-medium text-green-400 hover:text-green-300 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-700/80 hover:bg-neutral-600/80 rounded-md transition-colors"
            aria-label={`View finances for ${property.address}`}
          >
            <DollarIcon className="h-3 w-3" /> Finances
          </Link>
          <button
            onClick={() => { if(window.confirm(`Are you sure you want to delete ${property.address}? This will also remove associated leases, tenants, and financial records.`)) onDelete(property.id) }}
            className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-700/80 hover:bg-neutral-600/80 rounded-md transition-colors"
            aria-label={`Delete ${property.address}`}
          >
            <TrashIcon className="h-3 w-3" /> Delete
          </button>
        </div>
      </CardHoverRevealContent>
    </CardHoverReveal>
  );
};

const PropertiesPage: React.FC<PropertiesPageProps> = ({ properties, tenants, leases, onDeleteProperty }) => {
  const navigate = useNavigate();

  const findActiveLeaseForProperty = (propertyId: string): Lease | undefined => {
    return leases.find(l => l.propertyId === propertyId && l.isActive);
  };

  const getTenantName = (tenantId?: string | null): string | undefined => {
    if (!tenantId) return undefined;
    return tenants.find(t => t.id === tenantId)?.name;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Properties</h2>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your real estate portfolio</p>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
              <BuildingIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">No properties yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Get started by adding your first property.</p>
            <div className="mt-5">
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add New Property
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map(property => {
            const activeLease = findActiveLeaseForProperty(property.id);
            const tenantName = activeLease ? getTenantName(activeLease.tenantId) : undefined;
            return (
              <PropertyCard
                key={property.id}
                property={property}
                activeLease={activeLease}
                tenantName={tenantName}
                onDelete={onDeleteProperty}
                onEdit={(id) => navigate(`/properties/edit/${id}`)}
              />
            );
          })}
        </div>
      )}
      <style>{`
        .custom-scrollbar-reveal::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-reveal::-webkit-scrollbar-track { background: rgba(75, 85, 99, 0.3); border-radius: 10px; }
        .custom-scrollbar-reveal::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
        .custom-scrollbar-reveal::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.7); }
      `}</style>
    </div>
  );
};

export default PropertiesPage;
