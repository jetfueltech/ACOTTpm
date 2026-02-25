
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tenant, Property, OptionType } from '../types';

interface TenantFormProps {
  onSubmit: (tenant: Tenant | Omit<Tenant, 'id'>) => void;
  properties: Property[];
  tenants?: Tenant[]; // For editing
}

interface CustomInputFieldProps {
  label: string;
  id: string;
  type?: string;
  value?: string | number; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; 
  required?: boolean;
  children?: React.ReactNode;
}

const InputField: React.FC<CustomInputFieldProps> = 
    ({label, id, type="text", value, onChange, required=false, children}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
      {children ? children : (
        <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />
      )}
    </div>
  );


const TenantForm: React.FC<TenantFormProps> = ({ onSubmit, properties, tenants }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && tenants);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableProperties: OptionType[] = properties
    .filter(p => !p.tenantId || (isEditing && tenants?.find(t => t.id === id)?.propertyId === p.id)) 
    .map(p => ({ value: p.id, label: p.address }));


  useEffect(() => {
    if (isEditing && tenants) {
      const tenantToEdit = tenants.find(t => t.id === id);
      if (tenantToEdit) {
        setName(tenantToEdit.name);
        setEmail(tenantToEdit.email);
        setPhone(tenantToEdit.phone);
        setPropertyId(tenantToEdit.propertyId);
        setLeaseStartDate(tenantToEdit.leaseStartDate);
        setLeaseEndDate(tenantToEdit.leaseEndDate);
      } else {
        setError("Tenant not found.");
      }
    } else if (availableProperties.length > 0 && !propertyId) { 
        setPropertyId(availableProperties[0].value); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, tenants, properties]); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !propertyId || !leaseStartDate || !leaseEndDate) {
        setError("Please fill in all required fields: Name, Email, Property, Lease Start & End Dates.");
        return;
    }
    if (new Date(leaseStartDate) >= new Date(leaseEndDate)) {
        setError("Lease start date must be before lease end date.");
        return;
    }
    setError(null);
    
    const tenantData = {
      name,
      email,
      phone,
      propertyId,
      leaseStartDate,
      leaseEndDate,
    };

    if (isEditing && id) {
      onSubmit({ ...tenantData, id });
    } else {
      onSubmit(tenantData);
    }
    navigate('/tenants');
  };
  

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-300 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">{isEditing ? 'Edit Tenant' : 'Add New Tenant'}</h2>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField label="Full Name" id="name" value={name} onChange={e => setName((e.target as HTMLInputElement).value)} required />
        <InputField label="Email Address" id="email" type="email" value={email} onChange={e => setEmail((e.target as HTMLInputElement).value)} required />
        <InputField label="Phone Number (Optional)" id="phone" type="tel" value={phone} onChange={e => setPhone((e.target as HTMLInputElement).value)} />
        
        <InputField label="Assign to Property" id="propertyId" required value={propertyId} onChange={e => setPropertyId((e.target as HTMLSelectElement).value)}>
            <select id="propertyId" name="propertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" disabled={availableProperties.length === 0 && !isEditing}>
                { availableProperties.length > 0 ? (
                    availableProperties.map(propOpt => <option key={propOpt.value} value={propOpt.value}>{propOpt.label}</option>)
                ) : (
                   isEditing && tenants?.find(t => t.id ===id)?.propertyId ? 
                   <option value={tenants?.find(t => t.id ===id)?.propertyId}>{properties.find(p=>p.id === tenants?.find(t => t.id ===id)?.propertyId)?.address}</option> :
                   <option value="" disabled>No properties available</option>
                )}
                {isEditing && tenants && !availableProperties.find(p => p.value === tenants.find(t=>t.id===id)?.propertyId) && properties.find(p => p.id === tenants.find(t=>t.id===id)?.propertyId) &&
                    <option key={tenants.find(t=>t.id===id)?.propertyId} value={tenants.find(t=>t.id===id)?.propertyId}>
                        {properties.find(p => p.id === tenants.find(t=>t.id===id)?.propertyId)?.address} (Current)
                    </option>
                }
            </select>
        </InputField>
        {!isEditing && properties.find(p => p.id === propertyId)?.tenantId && (
            <p className="text-xs text-orange-600">This property is already marked as occupied. Assigning a new tenant will update its status.</p>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Lease Start Date" id="leaseStartDate" type="date" value={leaseStartDate} onChange={e => setLeaseStartDate((e.target as HTMLInputElement).value)} required />
            <InputField label="Lease End Date" id="leaseEndDate" type="date" value={leaseEndDate} onChange={e => setLeaseEndDate((e.target as HTMLInputElement).value)} required />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
          >
            {isEditing ? 'Save Changes' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantForm;