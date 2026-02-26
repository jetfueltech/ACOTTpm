import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Property, PropertyType } from '../types';
import { generatePropertyDescription } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { generateId, DEFAULT_IMAGE_URL_BASE } from '../constants';

interface PropertyFormProps {
  onSubmit: (property: Property | Omit<Property, 'id' | 'imageUrl' | 'rentAmount'> & { customImageUrl?: string }) => void;
  properties?: Property[];
}

type TabId = 'basics' | 'purchase' | 'loan' | 'projections' | 'media';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'basics',      label: 'Property',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'purchase',    label: 'Purchase',    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'loan',        label: 'Loan',        icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'projections', label: 'Projections', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { id: 'media',       label: 'Media',       icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const inputCls = "block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors placeholder:text-neutral-400";
const labelCls = "block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5";

interface FieldProps {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const Field: React.FC<FieldProps> = ({ label, id, required, children, hint }) => (
  <div>
    <label htmlFor={id} className={labelCls}>
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
  </div>
);

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, properties }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && properties);
  const [activeTab, setActiveTab] = useState<TabId>('basics');

  const [address, setAddress] = useState('');
  const [type, setType] = useState<PropertyType>(PropertyType.HOUSE);
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1.0);
  const [description, setDescription] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [descriptionFeatures, setDescriptionFeatures] = useState('');

  const [squareFootage, setSquareFootage] = useState<number | ''>('');
  const [parcelId, setParcelId] = useState('');
  const [countyAppraiserUrl, setCountyAppraiserUrl] = useState('');

  const [initialInvestment, setInitialInvestment] = useState<number | ''>('');
  const [downPayment, setDownPayment] = useState<number | ''>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [dateOfPurchase, setDateOfPurchase] = useState<string>(new Date().toISOString().split('T')[0]);

  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [loanTermYears, setLoanTermYears] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [monthlyMortgage, setMonthlyMortgage] = useState<number | ''>('');
  const [escrowIncluded, setEscrowIncluded] = useState<boolean>(false);
  const [loanOriginationDate, setLoanOriginationDate] = useState<string>('');

  const [projectedMonthlyRent, setProjectedMonthlyRent] = useState<number | ''>('');
  const [projectedMonthlyMortgage, setProjectedMonthlyMortgage] = useState<number | ''>('');
  const [projectedMonthlyPropertyTaxes, setProjectedMonthlyPropertyTaxes] = useState<number | ''>('');
  const [projectedMonthlyInsurance, setProjectedMonthlyInsurance] = useState<number | ''>('');
  const [projectedMonthlyHoa, setProjectedMonthlyHoa] = useState<number | ''>('');
  const [projectedMonthlyManagementFee, setProjectedMonthlyManagementFee] = useState<number | ''>('');

  const [notes, setNotes] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseOptionalFloat = (val: string | number) => val === '' ? undefined : parseFloat(val.toString()) || undefined;
  const parseOptionalInt = (val: string | number) => val === '' ? undefined : parseInt(val.toString(), 10) || undefined;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (isEditing && properties) {
      const p = properties.find(p => p.id === id);
      if (p) {
        setAddress(p.address);
        setType(p.type);
        setBedrooms(p.bedrooms);
        setBathrooms(p.bathrooms);
        setDescription(p.description);
        if (p.imageUrl && !p.imageUrl.startsWith(DEFAULT_IMAGE_URL_BASE)) {
          setCustomImageUrl(p.imageUrl);
          setImagePreview(p.imageUrl);
        }
        setSquareFootage(p.squareFootage || '');
        setParcelId(p.parcelId || '');
        setCountyAppraiserUrl(p.countyAppraiserUrl || '');
        setInitialInvestment(p.initialInvestment || '');
        setDownPayment(p.downPayment || '');
        setPurchasePrice(p.purchasePrice || '');
        setDateOfPurchase(p.dateOfPurchase || today);
        setLoanAmount(p.loanAmount || '');
        setLoanTermYears(p.loanTermYears || '');
        setInterestRate(p.interestRate || '');
        setMonthlyMortgage(p.monthlyMortgage || '');
        setEscrowIncluded(p.escrowIncluded || false);
        setLoanOriginationDate(p.loanOriginationDate || p.dateOfPurchase || today);
        setProjectedMonthlyRent(p.projectedMonthlyRent || '');
        setProjectedMonthlyMortgage(p.projectedMonthlyMortgage || '');
        setProjectedMonthlyPropertyTaxes(p.projectedMonthlyPropertyTaxes || '');
        setProjectedMonthlyInsurance(p.projectedMonthlyInsurance || '');
        setProjectedMonthlyHoa(p.projectedMonthlyHoa || '');
        setProjectedMonthlyManagementFee(p.projectedMonthlyManagementFee || '');
        setNotes(p.notes || '');
      } else {
        setError("Property not found.");
      }
    } else {
      setDateOfPurchase(today);
      setLoanOriginationDate(today);
    }
  }, [id, isEditing, properties]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setCustomImageUrl(b64);
        setImagePreview(b64);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomImageUrl('');
      setImagePreview(null);
    }
  };

  const handleGenerateDescription = useCallback(async () => {
    if (!descriptionFeatures.trim()) { alert("Please enter some key features."); return; }
    setIsGeneratingDesc(true);
    setError(null);
    try {
      const generated = await generatePropertyDescription(descriptionFeatures);
      setDescription(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Description generation failed.");
    } finally {
      setIsGeneratingDesc(false);
    }
  }, [descriptionFeatures]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || bedrooms <= 0 || bathrooms <= 0) {
      setError("Address, Bedrooms, and Bathrooms are required. Room counts must be positive.");
      setActiveTab('basics');
      return;
    }
    setError(null);

    const propertyData = {
      address, type, bedrooms, bathrooms,
      description: description || "A nice property.",
      customImageUrl: customImageUrl.trim() || undefined,
      tenantId: isEditing ? (properties?.find(p => p.id === id)?.tenantId) : null,
      squareFootage: parseOptionalFloat(squareFootage),
      parcelId: parcelId.trim() || undefined,
      countyAppraiserUrl: countyAppraiserUrl.trim() || undefined,
      initialInvestment: parseOptionalFloat(initialInvestment),
      downPayment: parseOptionalFloat(downPayment),
      purchasePrice: parseOptionalFloat(purchasePrice),
      dateOfPurchase: dateOfPurchase || undefined,
      loanAmount: parseOptionalFloat(loanAmount),
      loanTermYears: parseOptionalInt(loanTermYears),
      interestRate: parseOptionalFloat(interestRate),
      monthlyMortgage: parseOptionalFloat(monthlyMortgage),
      escrowIncluded,
      loanOriginationDate: loanOriginationDate || dateOfPurchase || undefined,
      projectedMonthlyRent: parseOptionalFloat(projectedMonthlyRent),
      projectedMonthlyMortgage: parseOptionalFloat(projectedMonthlyMortgage),
      projectedMonthlyPropertyTaxes: parseOptionalFloat(projectedMonthlyPropertyTaxes),
      projectedMonthlyInsurance: parseOptionalFloat(projectedMonthlyInsurance),
      projectedMonthlyHoa: parseOptionalFloat(projectedMonthlyHoa),
      projectedMonthlyManagementFee: parseOptionalFloat(projectedMonthlyManagementFee),
      notes: notes.trim() || undefined,
    };

    if (isEditing && id) {
      const existing = properties?.find(p => p.id === id);
      onSubmit({
        ...propertyData,
        id,
        imageUrl: customImageUrl.trim() || existing?.imageUrl || `${DEFAULT_IMAGE_URL_BASE}/${id}/400/300`,
        rentAmount: existing?.rentAmount || 0,
      });
    } else {
      onSubmit(propertyData);
    }
    navigate('/properties');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">
          {isEditing ? 'Edit Property' : 'Add New Property'}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {isEditing ? 'Update the details for this property.' : 'Fill in the details to add a new property to your portfolio.'}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-neutral-200 bg-surface">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus:outline-none
                ${activeTab === tab.id
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-white/60'
                }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {activeTab === 'basics' && (
              <>
                <Field label="Street Address" id="address" required>
                  <input id="address" type="text" className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street, City, State" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Property Type" id="type">
                    <select id="type" className={inputCls} value={type} onChange={e => setType(e.target.value as PropertyType)}>
                      {Object.values(PropertyType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                  </Field>
                  <Field label="Square Footage" id="squareFootage">
                    <input id="squareFootage" type="number" className={inputCls} value={squareFootage} onChange={e => setSquareFootage(parseOptionalInt(e.target.value) ?? '')} min={0} placeholder="e.g., 1,400" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bedrooms" id="bedrooms" required>
                    <input id="bedrooms" type="number" className={inputCls} value={bedrooms} onChange={e => setBedrooms(Math.max(0, parseInt(e.target.value)))} min={0} required />
                  </Field>
                  <Field label="Bathrooms" id="bathrooms" required>
                    <input id="bathrooms" type="number" className={inputCls} value={bathrooms} onChange={e => setBathrooms(Math.max(0, parseFloat(e.target.value)))} min={0} step={0.5} required />
                  </Field>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Public Records</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Parcel ID" id="parcelId">
                      <input id="parcelId" type="text" className={inputCls} value={parcelId} onChange={e => setParcelId(e.target.value)} placeholder="e.g., 12-34-567-890" />
                    </Field>
                    <Field label="County Appraiser URL" id="countyAppraiserUrl">
                      <input id="countyAppraiserUrl" type="url" className={inputCls} value={countyAppraiserUrl} onChange={e => setCountyAppraiserUrl(e.target.value)} placeholder="https://..." />
                    </Field>
                  </div>
                </div>

                <Field label="Internal Notes" id="notes">
                  <textarea id="notes" rows={3} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any private notes about this property..." />
                </Field>
              </>
            )}

            {activeTab === 'purchase' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Purchase Price" id="purchasePrice">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="purchasePrice" type="number" className={`${inputCls} pl-7`} value={purchasePrice} onChange={e => setPurchasePrice(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Date of Purchase" id="dateOfPurchase">
                    <input id="dateOfPurchase" type="date" className={inputCls} value={dateOfPurchase} onChange={e => setDateOfPurchase(e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Down Payment" id="downPayment">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="downPayment" type="number" className={`${inputCls} pl-7`} value={downPayment} onChange={e => setDownPayment(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Total Initial Cash Investment" id="initialInvestment" hint="Down payment + closing costs + any upfront repairs">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="initialInvestment" type="number" className={`${inputCls} pl-7`} value={initialInvestment} onChange={e => setInitialInvestment(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                </div>
              </>
            )}

            {activeTab === 'loan' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Loan Origination Date" id="loanOriginationDate" hint="Defaults to purchase date if left blank">
                    <input id="loanOriginationDate" type="date" className={inputCls} value={loanOriginationDate} onChange={e => setLoanOriginationDate(e.target.value)} />
                  </Field>
                  <Field label="Initial Loan Amount" id="loanAmount">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="loanAmount" type="number" className={`${inputCls} pl-7`} value={loanAmount} onChange={e => setLoanAmount(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Interest Rate" id="interestRate">
                    <div className="relative">
                      <input id="interestRate" type="number" className={`${inputCls} pr-7`} value={interestRate} onChange={e => setInterestRate(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </Field>
                  <Field label="Loan Term" id="loanTermYears">
                    <div className="relative">
                      <input id="loanTermYears" type="number" className={`${inputCls} pr-14`} value={loanTermYears} onChange={e => setLoanTermYears(parseOptionalInt(e.target.value) ?? '')} min={0} placeholder="30" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">yrs</span>
                    </div>
                  </Field>
                  <Field label="Escrow Included?" id="escrowIncluded">
                    <select id="escrowIncluded" className={inputCls} value={escrowIncluded ? 'yes' : 'no'} onChange={e => setEscrowIncluded(e.target.value === 'yes')}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </Field>
                </div>
                <Field label="Monthly P&I Payment" id="monthlyMortgage" hint={escrowIncluded ? "Enter Principal & Interest only. Log full PITI payments as transactions. This figure is used for amortization tracking." : undefined}>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                    <input id="monthlyMortgage" type="number" className={`${inputCls} pl-7`} value={monthlyMortgage} onChange={e => setMonthlyMortgage(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                  </div>
                </Field>
              </>
            )}

            {activeTab === 'projections' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Projected Monthly Rent" id="projectedMonthlyRent">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyRent" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyRent} onChange={e => setProjectedMonthlyRent(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Projected Monthly Mortgage" id="projectedMonthlyMortgage">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyMortgage" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyMortgage} onChange={e => setProjectedMonthlyMortgage(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Projected Property Taxes /mo" id="projectedMonthlyPropertyTaxes">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyPropertyTaxes" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyPropertyTaxes} onChange={e => setProjectedMonthlyPropertyTaxes(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Projected Insurance /mo" id="projectedMonthlyInsurance">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyInsurance" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyInsurance} onChange={e => setProjectedMonthlyInsurance(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Projected HOA Dues /mo" id="projectedMonthlyHoa">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyHoa" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyHoa} onChange={e => setProjectedMonthlyHoa(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Projected Management Fee /mo" id="projectedMonthlyManagementFee">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input id="projectedMonthlyManagementFee" type="number" className={`${inputCls} pl-7`} value={projectedMonthlyManagementFee} onChange={e => setProjectedMonthlyManagementFee(parseOptionalFloat(e.target.value) ?? '')} min={0} step="0.01" placeholder="0.00" />
                    </div>
                  </Field>
                </div>
              </>
            )}

            {activeTab === 'media' && (
              <>
                <Field label="Image URL" id="customImageUrl">
                  <input id="customImageUrl" type="text" className={inputCls} value={customImageUrl.startsWith('data:image') ? '' : customImageUrl} onChange={e => { setCustomImageUrl(e.target.value); setImagePreview(null); }} placeholder="https://example.com/photo.jpg" />
                </Field>

                <Field label="Upload Cover Photo" id="imageFile" hint="Uploaded images are stored as Base64 in your browser's local storage.">
                  <div className="mt-1">
                    <label htmlFor="imageFile" className="flex items-center gap-3 px-4 py-3 border border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group">
                      <svg className="h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-sm text-neutral-500 group-hover:text-neutral-700">Click to choose a photo</span>
                    </label>
                    <input id="imageFile" type="file" accept="image/*" className="sr-only" onChange={handleImageFileChange} />
                  </div>
                </Field>

                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-200 aspect-video">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImagePreview(null); setCustomImageUrl(''); }} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-100">
                  <Field label="Key Features for AI Description" id="descriptionFeatures">
                    <textarea id="descriptionFeatures" rows={3} className={inputCls} value={descriptionFeatures} onChange={e => setDescriptionFeatures(e.target.value)} placeholder="e.g., newly renovated kitchen, spacious backyard, great natural light, pet-friendly" />
                  </Field>
                  <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="mt-2.5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors disabled:opacity-40">
                    {isGeneratingDesc ? <LoadingSpinner size="sm" /> : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                    Generate with AI
                  </button>
                </div>

                <Field label="Property Description" id="description" required>
                  <textarea id="description" rows={5} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this property for listings and internal records..." required />
                </Field>
              </>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-surface border-t border-surface-200">
            <div className="flex gap-1">
              {TABS.map((tab, i) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-primary' : 'bg-neutral-300 hover:bg-neutral-400'}`}
                  aria-label={`Go to ${tab.label}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/properties')} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-surface hover:bg-surface-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-sm">
                {isEditing ? 'Save Changes' : 'Add Property'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;
