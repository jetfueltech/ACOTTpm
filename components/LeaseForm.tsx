
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lease, Property, Tenant, OptionType } from '../types';
import { generateId } from '../constants';

interface LeaseFormProps {
  onSubmit: (lease: Lease | Omit<Lease, 'id' | 'isActive'>) => void;
  properties: Property[];
  tenants: Tenant[];
  leases?: Lease[]; // For editing
}

interface CustomInputFieldProps {
  label: string;
  id: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  min?: number | string;
  step?: string;
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

const InputField: React.FC<CustomInputFieldProps> =
    ({label, id, type="text", value, onChange, required=false, min, step, children, placeholder, disabled = false}) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
      {children ? children : (
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
            disabled: disabled,
            className: `mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors ${disabled ? 'bg-neutral-50 cursor-not-allowed opacity-60' : ''}`
        })
      )}
    </div>
);

const LeaseForm: React.FC<LeaseFormProps> = ({ onSubmit, properties, tenants, leases }) => {
  const navigate = useNavigate();
  const { id: leaseIdToEdit } = useParams<{ id: string }>();
  const isEditing = Boolean(leaseIdToEdit && leases);

  const [propertyId, setPropertyId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [leaseStartDate, setLeaseStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaseEndDate, setLeaseEndDate] = useState<string>('');
  const [monthlyRentAmount, setMonthlyRentAmount] = useState<number | ''>('');
  const [securityDepositAmount, setSecurityDepositAmount] = useState<number | ''>('');
  const [moveInDate, setMoveInDate] = useState<string>('');
  const [moveOutDate, setMoveOutDate] = useState<string>('');
  const [additionalTerms, setAdditionalTerms] = useState<string>('');
  const [leaseDocumentUrl, setLeaseDocumentUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const availablePropertiesForLease: OptionType[] = useMemo(() => {
    return properties.map(p => {
        const hasActiveLease = leases?.some(l => l.propertyId === p.id && l.isActive && l.id !== leaseIdToEdit);
        return {
            value: p.id,
            label: `${p.address}${hasActiveLease ? ' (Actively Leased)' : ''}`,
            disabled: hasActiveLease && !(isEditing && leases?.find(l=>l.id === leaseIdToEdit)?.propertyId === p.id)
        };
    }).sort((a,b) => a.label.localeCompare(b.label));
  }, [properties, leases, leaseIdToEdit, isEditing]);

  const availableTenantsForLease: OptionType[] = useMemo(() => {
     return tenants.map(t => {
        const hasActiveLease = leases?.some(l => l.tenantId === t.id && l.isActive && l.id !== leaseIdToEdit);
        return {
            value: t.id,
            label: `${t.name}${hasActiveLease ? ' (Active Lease)' : ''}`,
            disabled: hasActiveLease && !(isEditing && leases?.find(l=>l.id === leaseIdToEdit)?.tenantId === t.id)
        };
    }).sort((a,b) => a.label.localeCompare(b.label));
  }, [tenants, leases, leaseIdToEdit, isEditing]);


  useEffect(() => {
    if (isEditing && leases) {
      const leaseToEdit = leases.find(l => l.id === leaseIdToEdit);
      if (leaseToEdit) {
        setPropertyId(leaseToEdit.propertyId);
        setTenantId(leaseToEdit.tenantId);
        setLeaseStartDate(leaseToEdit.leaseStartDate);
        setLeaseEndDate(leaseToEdit.leaseEndDate);
        setMonthlyRentAmount(leaseToEdit.monthlyRentAmount);
        setSecurityDepositAmount(leaseToEdit.securityDepositAmount || '');
        setMoveInDate(leaseToEdit.moveInDate || '');
        setMoveOutDate(leaseToEdit.moveOutDate || '');
        setAdditionalTerms(leaseToEdit.additionalTerms || '');
        setLeaseDocumentUrl(leaseToEdit.leaseDocumentUrl || '');
      } else {
        setError("Lease not found.");
      }
    } else {
        if (availablePropertiesForLease.length > 0 && !propertyId) {
            const firstAvailableProp = availablePropertiesForLease.find(p => !p.disabled);
            if(firstAvailableProp) setPropertyId(firstAvailableProp.value);
        }
        if (availableTenantsForLease.length > 0 && !tenantId) {
            const firstAvailableTenant = availableTenantsForLease.find(t => !t.disabled);
            if(firstAvailableTenant) setTenantId(firstAvailableTenant.value);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaseIdToEdit, isEditing, leases]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!propertyId || !tenantId || !leaseStartDate || !leaseEndDate || monthlyRentAmount === '' || monthlyRentAmount <=0) {
      setError("Property, Tenant, Lease Dates, and a positive Monthly Rent are required.");
      return;
    }
    if (new Date(leaseStartDate) >= new Date(leaseEndDate)) {
      setError("Lease start date must be before lease end date.");
      return;
    }
    if (moveInDate && moveOutDate && new Date(moveInDate) > new Date(moveOutDate)) {
      setError("Move-in date cannot be after move-out date.");
      return;
    }

    const leaseData = {
      propertyId,
      tenantId,
      leaseStartDate,
      leaseEndDate,
      monthlyRentAmount: Number(monthlyRentAmount),
      securityDepositAmount: securityDepositAmount === '' ? undefined : Number(securityDepositAmount),
      moveInDate: moveInDate || undefined,
      moveOutDate: moveOutDate || undefined,
      additionalTerms: additionalTerms.trim() || undefined,
      leaseDocumentUrl: leaseDocumentUrl.trim() || undefined,
    };

    if (isEditing && leaseIdToEdit) {
      onSubmit({ ...leaseData, id: leaseIdToEdit, isActive: leases?.find(l=>l.id===leaseIdToEdit)?.isActive || false });
    } else {
      onSubmit(leaseData);
    }
    navigate('/leases');
  };

  const parseOptionalFloat = (val: string | number) => val === '' ? '' : parseFloat(val.toString()) || '';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-card max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-neutral-900 mb-6">{isEditing ? 'Edit Lease' : 'Add New Lease'}</h2>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Property" id="propertyId" required value={propertyId} onChange={e => setPropertyId((e.target as HTMLSelectElement).value)}>
            <select id="propertyId" name="propertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors">
              <option value="" disabled>Select a property</option>
              {availablePropertiesForLease.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
            </select>
          </InputField>
          <InputField label="Tenant" id="tenantId" required value={tenantId} onChange={e => setTenantId((e.target as HTMLSelectElement).value)}>
            <select id="tenantId" name="tenantId" value={tenantId} onChange={e => setTenantId(e.target.value)} className="mt-1 block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors">
              <option value="" disabled>Select a tenant</option>
              {availableTenantsForLease.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
            </select>
          </InputField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Lease Start Date" id="leaseStartDate" type="date" value={leaseStartDate} onChange={e => setLeaseStartDate((e.target as HTMLInputElement).value)} required />
          <InputField label="Lease End Date" id="leaseEndDate" type="date" value={leaseEndDate} onChange={e => setLeaseEndDate((e.target as HTMLInputElement).value)} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Monthly Rent Amount (USD)" id="monthlyRentAmount" type="number" value={monthlyRentAmount} onChange={e => setMonthlyRentAmount(parseOptionalFloat((e.target as HTMLInputElement).value))} required min={0.01} step="0.01" placeholder="e.g., 1500" />
            <InputField label="Security Deposit (USD, Optional)" id="securityDepositAmount" type="number" value={securityDepositAmount} onChange={e => setSecurityDepositAmount(parseOptionalFloat((e.target as HTMLInputElement).value))} min={0} step="0.01" placeholder="e.g., 1500"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Move-In Date (Optional)" id="moveInDate" type="date" value={moveInDate} onChange={e => setMoveInDate((e.target as HTMLInputElement).value)} />
            <InputField label="Move-Out Date (Optional)" id="moveOutDate" type="date" value={moveOutDate} onChange={e => setMoveOutDate((e.target as HTMLInputElement).value)} />
        </div>

        <InputField label="Lease Document URL (Optional)" id="leaseDocumentUrl" type="url" value={leaseDocumentUrl} onChange={e => setLeaseDocumentUrl((e.target as HTMLInputElement).value)} placeholder="https://example.com/lease.pdf" />
        <InputField label="Additional Terms (Optional)" id="additionalTerms" type="textarea" value={additionalTerms} onChange={e => setAdditionalTerms((e.target as HTMLTextAreaElement).value)} placeholder="e.g., Pet policy, late fee details..." />

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button type="button" onClick={() => navigate('/leases')}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
            {isEditing ? 'Save Changes' : 'Add Lease'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaseForm;
