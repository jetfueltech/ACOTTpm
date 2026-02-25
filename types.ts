export enum PropertyType {
  HOUSE = 'House',
  APARTMENT = 'Apartment',
  CONDO = 'Condo',
  TOWNHOUSE = 'Townhouse',
  OTHER = 'Other',
}

export interface Property {
  id: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number; // Actual current rent, updated from active lease or manually set if vacant
  description: string;
  imageUrl: string;
  tenantId?: string | null; // ID of the tenant from the current active lease

  // Expanded property profile
  squareFootage?: number;
  initialInvestment?: number; 
  downPayment?: number;
  purchasePrice?: number;
  dateOfPurchase?: string; // YYYY-MM-DD
  
  // Loan Information
  loanAmount?: number;
  loanTermYears?: number;
  interestRate?: number; 
  monthlyMortgage?: number; 
  escrowIncluded?: boolean;
  loanOriginationDate?: string; 
  
  // Financial Projections (Optional)
  projectedMonthlyRent?: number;
  projectedMonthlyMortgage?: number; 
  projectedMonthlyPropertyTaxes?: number;
  projectedMonthlyInsurance?: number;
  projectedMonthlyHoa?: number;
  projectedMonthlyManagementFee?: number;

  notes?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string; // Property tenant is primarily associated with (might be historical if lease ended)
  leaseStartDate: string; // Can be considered secondary; primary is Lease object
  leaseEndDate: string;   // Can be considered secondary; primary is Lease object
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

export interface Transaction {
  id: string;
  propertyId: string; 
  type: TransactionType;
  category: string; 
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  interestComponent?: number;
  principalComponent?: number;
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  leaseStartDate: string; // YYYY-MM-DD
  leaseEndDate: string;   // YYYY-MM-DD
  monthlyRentAmount: number;
  securityDepositAmount?: number; // The agreed-upon deposit amount for the lease
  moveInDate?: string;     // YYYY-MM-DD
  moveOutDate?: string;    // YYYY-MM-DD
  isActive: boolean; // Calculated field
  additionalTerms?: string;
  leaseDocumentUrl?: string; // URL to a scanned document
}

export enum SecurityDepositTransactionType {
  COLLECTED = 'COLLECTED',
  REFUNDED = 'REFUNDED',
  FORFEITED_TO_INCOME = 'FORFEITED_TO_INCOME',
}

export interface SecurityDepositTransaction {
  id: string;
  leaseId: string;
  propertyId: string; // For context, though leaseId is primary link
  tenantId: string;   // For context
  type: SecurityDepositTransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export type TodoPriority = 'low' | 'medium' | 'high';

export interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // Optional ISO date string
  priority?: TodoPriority; // Optional
  propertyId?: string; // Optional, links to a property
  notes?: string; // Optional
}


export interface NavItem {
  name: string;
  path: string;
  icon: string; // Changed from function to string for emoji
}

export interface OptionType {
  value: string;
  label: string;
  disabled?: boolean;
}