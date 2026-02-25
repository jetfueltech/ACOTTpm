import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Property, PropertyType } from '../types';
import { generatePropertyDescription } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { generateId, DEFAULT_IMAGE_URL_BASE } from '../constants';

interface PropertyFormProps {
  onSubmit: (property: Property | Omit<Property, 'id' | 'imageUrl' | 'rentAmount'> & { customImageUrl?: string }) => void;
  properties?: Property[]; // For editing
}

interface CustomInputFieldProps {
  label: string;
  id: string;
  type?: string;
  value?: string | number | boolean; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; 
  required?: boolean;
  min?: number;
  step?: number | string; 
  children?: React.ReactNode;
  placeholder?: string;
  className?: string; 
  accept?: string; // For file input
}

const InputField: React.FC<CustomInputFieldProps> = 
    ({label, id, type="text", value, onChange, required=false, min, step, children, placeholder, className="", accept}) => (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
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
            rows: type === 'textarea' ? 4 : undefined,
            accept: accept, // For file input
            className:"mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        })
      )}
    </div>
  );

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, properties }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && properties);

  const [address, setAddress] = useState('');
  const [type, setType] = useState<PropertyType>(PropertyType.HOUSE);
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1.0);
  // rentAmount state removed
  const [description, setDescription] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState(''); // Stores URL or Base64 data
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [descriptionFeatures, setDescriptionFeatures] = useState('');
  
  const [squareFootage, setSquareFootage] = useState<number | ''>('');
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

  const [parcelId, setParcelId] = useState('');
  const [countyAppraiserUrl, setCountyAppraiserUrl] = useState('');

  const [notes, setNotes] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (isEditing && properties) {
      const propertyToEdit = properties.find(p => p.id === id);
      if (propertyToEdit) {
        setAddress(propertyToEdit.address);
        setType(propertyToEdit.type);
        setBedrooms(propertyToEdit.bedrooms);
        setBathrooms(propertyToEdit.bathrooms);
        // propertyToEdit.rentAmount is not set here, it's derived from lease
        setDescription(propertyToEdit.description);
        if(propertyToEdit.imageUrl && !propertyToEdit.imageUrl.startsWith(DEFAULT_IMAGE_URL_BASE)) {
          setCustomImageUrl(propertyToEdit.imageUrl);
          setImagePreview(propertyToEdit.imageUrl); // Show existing image
        }
        
        setSquareFootage(propertyToEdit.squareFootage || '');
        setInitialInvestment(propertyToEdit.initialInvestment || '');
        setDownPayment(propertyToEdit.downPayment || '');
        setPurchasePrice(propertyToEdit.purchasePrice || '');
        setDateOfPurchase(propertyToEdit.dateOfPurchase || today);
        
        setLoanAmount(propertyToEdit.loanAmount || '');
        setLoanTermYears(propertyToEdit.loanTermYears || '');
        setInterestRate(propertyToEdit.interestRate || '');
        setMonthlyMortgage(propertyToEdit.monthlyMortgage || '');
        setEscrowIncluded(propertyToEdit.escrowIncluded || false);
        setLoanOriginationDate(propertyToEdit.loanOriginationDate || propertyToEdit.dateOfPurchase || today);

        setProjectedMonthlyRent(propertyToEdit.projectedMonthlyRent || '');
        setProjectedMonthlyMortgage(propertyToEdit.projectedMonthlyMortgage || '');
        setProjectedMonthlyPropertyTaxes(propertyToEdit.projectedMonthlyPropertyTaxes || '');
        setProjectedMonthlyInsurance(propertyToEdit.projectedMonthlyInsurance || '');
        setProjectedMonthlyHoa(propertyToEdit.projectedMonthlyHoa || '');
        setProjectedMonthlyManagementFee(propertyToEdit.projectedMonthlyManagementFee || '');
        
        setParcelId(propertyToEdit.parcelId || '');
        setCountyAppraiserUrl(propertyToEdit.countyAppraiserUrl || '');

        setNotes(propertyToEdit.notes || '');

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
        const base64String = reader.result as string;
        setCustomImageUrl(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomImageUrl(''); // Clear if no file selected
      setImagePreview(null);
    }
  };

  const handleGenerateDescription = useCallback(async () => {
    if (!descriptionFeatures.trim()) {
      alert("Please enter some key features for the description.");
      return;
    }
    setIsGeneratingDesc(true);
    setError(null);
    try {
      const generatedDesc = await generatePropertyDescription(descriptionFeatures);
      setDescription(generatedDesc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during description generation.");
    } finally {
      setIsGeneratingDesc(false);
    }
  }, [descriptionFeatures]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || bedrooms <=0 || bathrooms <=0) { // RentAmount removed from validation
        setError("Please fill in all required fields (Address, Bedrooms, Bathrooms). Room counts must be positive.");
        return;
    }
    setError(null);

    const propertyData = {
      address, type, bedrooms, bathrooms, 
      // rentAmount is not part of form data anymore
      description: description || "A nice property.",
      customImageUrl: customImageUrl.trim() || undefined,
      tenantId: isEditing ? (properties?.find(p=>p.id === id)?.tenantId) : null,

      squareFootage: parseOptionalFloat(squareFootage),
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
      
      parcelId: parcelId.trim() || undefined,
      countyAppraiserUrl: countyAppraiserUrl.trim() || undefined,

      notes: notes.trim() || undefined,
    };

    if (isEditing && id) {
        const existingProperty = properties?.find(p=>p.id === id);
        onSubmit({
            ...propertyData,
            id,
            imageUrl: customImageUrl.trim() || existingProperty?.imageUrl || `${DEFAULT_IMAGE_URL_BASE}/${id}/400/300`,
            rentAmount: existingProperty?.rentAmount || 0,
        });
    } else {
      onSubmit(propertyData);
    }
    navigate('/properties');
  };
  
  const parseOptionalFloat = (val: string | number) => val === '' ? undefined : parseFloat(val.toString()) || undefined;
  const parseOptionalInt = (val: string | number) => val === '' ? undefined : parseInt(val.toString(), 10) || undefined;


  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-300 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">{isEditing ? 'Edit Property' : 'Add New Property'}</h2>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">

        <fieldset className="space-y-6 border border-neutral-200 p-4 rounded-md">
            <legend className="text-lg font-medium text-neutral-700 px-2">Basic Property Details</legend>
            <InputField label="Address" id="address" value={address} onChange={e => setAddress((e.target as HTMLInputElement).value)} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Property Type" id="type" required value={type} onChange={e => setType((e.target as HTMLSelectElement).value as PropertyType)}>
                    <select id="type" name="type" value={type} onChange={e => setType(e.target.value as PropertyType)} className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        {Object.values(PropertyType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                </InputField>
                 <InputField label="Square Footage (Optional)" id="squareFootage" type="number" value={squareFootage} onChange={e => setSquareFootage(parseOptionalInt((e.target as HTMLInputElement).value) ?? '')} min={0} step="1" placeholder="e.g., 1200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Rent amount field removed, adjusted grid */}
                <InputField label="Bedrooms" id="bedrooms" type="number" value={bedrooms} onChange={e => setBedrooms(Math.max(0, parseInt((e.target as HTMLInputElement).value)))} required min={0} />
                <InputField label="Bathrooms" id="bathrooms" type="number" value={bathrooms} onChange={e => setBathrooms(Math.max(0, parseFloat((e.target as HTMLInputElement).value)))} required min={0} step={0.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Parcel ID (Optional)" id="parcelId" value={parcelId} onChange={e => setParcelId((e.target as HTMLInputElement).value)} placeholder="e.g., 12-34-567-890" />
                <InputField label="County Property Appraiser Link (Optional)" id="countyAppraiserUrl" value={countyAppraiserUrl} onChange={e => setCountyAppraiserUrl((e.target as HTMLInputElement).value)} placeholder="https://..." />
            </div>
        </fieldset>

        <fieldset className="space-y-6 border border-neutral-200 p-4 rounded-md">
            <legend className="text-lg font-medium text-neutral-700 px-2">Purchase & Investment (Optional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Purchase Price" id="purchasePrice" type="number" value={purchasePrice} onChange={e => setPurchasePrice(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 250000"/>
                <InputField label="Date of Purchase" id="dateOfPurchase" type="date" value={dateOfPurchase} onChange={e => setDateOfPurchase((e.target as HTMLInputElement).value)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Initial Cash Investment" id="initialInvestment" type="number" value={initialInvestment} onChange={e => setInitialInvestment(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="Down payment + closing costs"/>
                <InputField label="Down Payment" id="downPayment" type="number" value={downPayment} onChange={e => setDownPayment(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 25000"/>
            </div>
        </fieldset>
        
        <fieldset className="space-y-6 border border-neutral-200 p-4 rounded-md">
            <legend className="text-lg font-medium text-neutral-700 px-2">Loan Details (Optional)</legend>
            <InputField label="Loan Origination Date" id="loanOriginationDate" type="date" value={loanOriginationDate} onChange={e => setLoanOriginationDate((e.target as HTMLInputElement).value)} />
             <p className="text-xs text-neutral-500 -mt-5">Defaults to Purchase Date if empty. Important for amortization.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Initial Loan Amount" id="loanAmount" type="number" value={loanAmount} onChange={e => setLoanAmount(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 200000"/>
                <InputField label="Loan Term (Years)" id="loanTermYears" type="number" value={loanTermYears} onChange={e => setLoanTermYears(parseOptionalInt((e.target as HTMLInputElement).value) ?? '')} min={0} step="1" placeholder="e.g., 30"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <InputField label="Interest Rate (%)" id="interestRate" type="number" value={interestRate} onChange={e => setInterestRate(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 3.5"/>
                <div>
                  <InputField label="Actual Monthly P&I Payment" id="monthlyMortgage" type="number" value={monthlyMortgage} onChange={e => setMonthlyMortgage(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 1200"/>
                  {escrowIncluded && (
                    <p className="text-xs text-neutral-500 mt-1">This is for Principal & Interest (P&I) only. When logging transactions, enter the full PITI payment (including escrow) as the 'Mortgage Payment' amount. P&I entered here is used for amortization. Projections for taxes & insurance are for reference.</p>
                  )}
                </div>
                 <InputField label="Escrow Included in Total Pmt?" id="escrowIncluded" value={escrowIncluded ? 'yes' : 'no'} onChange={e => setEscrowIncluded((e.target as HTMLSelectElement).value === 'yes')}>
                    <select id="escrowIncluded" name="escrowIncluded" value={escrowIncluded ? 'yes' : 'no'} onChange={e => setEscrowIncluded((e.target as HTMLSelectElement).value === 'yes')} className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </InputField>
            </div>
        </fieldset>

         <fieldset className="space-y-6 border border-neutral-200 p-4 rounded-md">
            <legend className="text-lg font-medium text-neutral-700 px-2">Financial Projections (Optional)</legend>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Projected Monthly Rent" id="projectedMonthlyRent" type="number" value={projectedMonthlyRent} onChange={e => setProjectedMonthlyRent(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 2000"/>
                <InputField label="Projected Monthly Mortgage (P&I)" id="projectedMonthlyMortgage" type="number" value={projectedMonthlyMortgage} onChange={e => setProjectedMonthlyMortgage(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 1150"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputField label="Projected Monthly Property Taxes" id="projectedMonthlyPropertyTaxes" type="number" value={projectedMonthlyPropertyTaxes} onChange={e => setProjectedMonthlyPropertyTaxes(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 250"/>
                 <InputField label="Projected Monthly Insurance" id="projectedMonthlyInsurance" type="number" value={projectedMonthlyInsurance} onChange={e => setProjectedMonthlyInsurance(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 80"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputField label="Projected Monthly HOA Dues" id="projectedMonthlyHoa" type="number" value={projectedMonthlyHoa} onChange={e => setProjectedMonthlyHoa(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 50"/>
                 <InputField label="Projected Monthly Management Fee" id="projectedMonthlyManagementFee" type="number" value={projectedMonthlyManagementFee} onChange={e => setProjectedMonthlyManagementFee(parseOptionalFloat((e.target as HTMLInputElement).value) ?? '')} min={0} step="0.01" placeholder="e.g., 200 (if 10% of rent)"/>
            </div>
        </fieldset>

        <fieldset className="space-y-6 border border-neutral-200 p-4 rounded-md">
            <legend className="text-lg font-medium text-neutral-700 px-2">Media & Description</legend>
            <InputField label="Custom Image URL (Optional)" id="customImageUrl" value={customImageUrl.startsWith('data:image') ? '' : customImageUrl} onChange={e => {setCustomImageUrl((e.target as HTMLInputElement).value); setImagePreview(null);}} placeholder="https://example.com/image.jpg" />
            {/* This input allows uploading an image which will become the property's cover image. */}
            <InputField label="Upload New Cover Image (Optional)" id="imageFile" type="file" accept="image/*" onChange={handleImageFileChange} />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-md max-h-40 object-contain" />}
            <p className="text-xs text-neutral-500 -mt-5">URL or Upload. Uploaded images are stored as Base64, be mindful of localStorage limits (typically 5-10MB total).</p>

            <div>
              <label htmlFor="descriptionFeatures" className="block text-sm font-medium text-neutral-700 mb-1">Key Features for AI Description (Optional)</label>
              <textarea
                id="descriptionFeatures"
                name="descriptionFeatures"
                rows={3}
                value={descriptionFeatures}
                onChange={e => setDescriptionFeatures(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., newly renovated kitchen, spacious backyard, great natural light, pet-friendly"
              />
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-dark disabled:bg-neutral-300"
              >
                {isGeneratingDesc ? <LoadingSpinner size="sm" /> : <span className="mr-2" role="img" aria-label="Sparkles">✨</span>}
                Generate Description with AI
              </button>
            </div>

            <InputField label="Property Description" id="description" type="textarea" value={description} onChange={e => setDescription((e.target as HTMLTextAreaElement).value)} required placeholder="Detailed description of the property."/>
             <InputField label="Notes (Optional)" id="notes" type="textarea" value={notes} onChange={e => setNotes((e.target as HTMLTextAreaElement).value)} placeholder="Any internal notes about the property..." />
        </fieldset>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
          >
            {isEditing ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;