import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Property, Transaction, Lease, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatDateForDisplay } from '../constants';
import PropertyDocuments from './PropertyDocuments';
import { BuildingIcon, ChevronDownIcon } from './icons';

interface PropertyFinancePageProps {
  properties: Property[];
  transactions: Transaction[];
  leases: Lease[]; 
}

const StatCard: React.FC<{ title: string; value: string | number; subValue?: string; small?: boolean; className?: string }> =
  ({ title, value, subValue, small, className }) => (
  <div className={`bg-white p-3 md:p-4 rounded-xl border border-neutral-200/80 ${className || ''}`}>
    <p className={`text-xs font-medium text-neutral-500 uppercase tracking-wider ${small ? 'mb-0.5' : 'mb-1'}`}>{title}</p>
    <p className={`font-bold text-neutral-900 ${small ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>{value}</p>
    {subValue && <p className="text-xs text-neutral-400 break-words mt-0.5">{subValue}</p>}
  </div>
);

const ProjectedActualItem: React.FC<{label: string, projected?: number, actual?: number, isCurrency?: boolean}> = ({label, projected, actual, isCurrency = true}) => {
    const format = isCurrency ? (val: number | undefined) => formatCurrency(val, 'N/A') : (val: number | undefined) => val?.toString() ?? 'N/A';
    const actualExists = typeof actual === 'number';
    const projectedExists = typeof projected === 'number';
    let varianceText = 'N/A';
    let varianceDisplayColor = 'text-neutral-700';

    if (actualExists && projectedExists) {
        if (projected !== 0) {
            const diff = actual - projected;
            varianceText = `${formatCurrency(diff)} (${((diff / projected) * 100).toFixed(0)}%)`;
            if (label.toLowerCase().includes('income') || label.toLowerCase().includes('rent')) { 
                varianceDisplayColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
            } else { 
                 varianceDisplayColor = diff <= 0 ? 'text-green-600' : 'text-red-600';
            }
        } else if (actual !== 0) { 
            varianceText = `${format(actual)} (vs N/A)`;
            varianceDisplayColor = label.toLowerCase().includes('income') || label.toLowerCase().includes('rent') ? 'text-green-600' : 'text-red-700';
        } else { 
            varianceText = `${format(0)} (0%)`;
        }
    } else if (actualExists) {
        varianceText = `${format(actual)} (vs N/A)`;
        varianceDisplayColor = label.toLowerCase().includes('income') || label.toLowerCase().includes('rent') ? 'text-green-600' : 'text-red-700';
    } else if (projectedExists) {
        varianceText = `N/A (vs ${format(projected)})`;
    }

    return (
        <div className="py-2 border-b border-neutral-100 last:border-b-0">
            <p className="text-sm font-medium text-neutral-700">{label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs mt-1">
                <p className="text-neutral-800"><span className="font-semibold text-neutral-700">Actual:</span> {format(actual)}</p>
                <p className="text-neutral-800"><span className="font-semibold text-neutral-700">Projected:</span> {format(projected)}</p>
                <p className={varianceDisplayColor}><span className="font-semibold text-neutral-800">Variance:</span> {varianceText}</p>
            </div>
        </div>
    );
};

const formatCurrency = (amount: number | undefined | null, defaultValue: string = 'N/A'): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return defaultValue;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PropertyFinancePage: React.FC<PropertyFinancePageProps> = ({ properties, transactions, leases }) => {
  const { id: propertyId } = useParams<{ id: string }>();
  const [isProjectionsOpen, setIsProjectionsOpen] = useState(true);

  const currentProperty = useMemo(() => {
    return properties.find(p => p.id === propertyId);
  }, [properties, propertyId]);

  const activeLeaseForProperty = useMemo(() => {
    return leases.find(l => l.propertyId === propertyId && l.isActive);
  }, [leases, propertyId]);

  const propertyTransactions = useMemo(() => {
    return transactions.filter(tx => tx.propertyId === propertyId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, propertyId]);

  const financialCalculations = useMemo(() => {
    if (!currentProperty) return null;

    const currentYear = new Date().getFullYear();
    const currentMonthDate = new Date();
    const currentMonth = currentMonthDate.getMonth(); 
    const monthsPassedYTD = currentMonth + 1;

    let ytdActualIncome = 0;
    let currentMonthActualIncome = 0;
    let ytdActualExpenses = 0;
    let currentMonthActualExpenses = 0;
    let ytdActualOperatingExpenses = 0;
    let ytdActualCapitalExpenses = 0;
    const monthlyRentCollected: { [month: number]: number } = {};
    for (let i = 0; i < 12; i++) monthlyRentCollected[i] = 0;

    const categorizedExpensesItems: { categoryKey: keyof typeof EXPENSE_CATEGORIES; categoryLabel: string; items: Transaction[]; total: number }[] = 
      (Object.keys(EXPENSE_CATEGORIES) as Array<keyof typeof EXPENSE_CATEGORIES>).map(key => ({
        categoryKey: key, categoryLabel: EXPENSE_CATEGORIES[key], items: [], total: 0,
      }));

    let ytdActualMortgage = 0;
    let ytdActualPropertyTaxes = 0;
    let ytdActualInsurance = 0;
    let ytdActualHoa = 0;
    let ytdActualManagementFee = 0;

    propertyTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      // Ensure date comparison is consistent (e.g. use UTC to avoid timezone issues if dates are stored as UTC)
      const txYear = txDate.getFullYear(); // Using local year/month for simplicity assuming dates are local
      const txMonth = txDate.getMonth();

      if (tx.type === TransactionType.INCOME) {
        if (txYear === currentYear) {
          ytdActualIncome += tx.amount;
          if (tx.category === 'RENT') { 
             monthlyRentCollected[txMonth] = (monthlyRentCollected[txMonth] || 0) + tx.amount;
          }
        }
        if (txYear === currentYear && txMonth === currentMonth) {
          currentMonthActualIncome += tx.amount;
        }
      } else { 
        if (txYear === currentYear) {
          ytdActualExpenses += tx.amount;
          if (tx.category !== 'CAPITAL_EXPENSE') { 
            ytdActualOperatingExpenses += tx.amount;
          } else {
            ytdActualCapitalExpenses += tx.amount;
          }

          if (tx.category === 'MORTGAGE') ytdActualMortgage += tx.amount;
          if (tx.category === 'PROPERTY_TAX') ytdActualPropertyTaxes += tx.amount;
          if (tx.category === 'INSURANCE') ytdActualInsurance += tx.amount;
          if (tx.category === 'HOA_FEE') ytdActualHoa += tx.amount;
          if (tx.category === 'MANAGEMENT_FEE') ytdActualManagementFee += tx.amount;
        }
        if (txYear === currentYear && txMonth === currentMonth) {
          currentMonthActualExpenses += tx.amount;
        }
        
        const expenseCategoryGroup = categorizedExpensesItems.find(ce => ce.categoryKey === tx.category);
        if (expenseCategoryGroup && txYear === currentYear) {
            expenseCategoryGroup.items.push(tx);
            expenseCategoryGroup.total += tx.amount;
        }
      }
    });

    const ytdActualCashFlow = ytdActualIncome - ytdActualExpenses;
    const currentMonthActualCashFlow = currentMonthActualIncome - currentMonthActualExpenses;
    const annualizedActualNOI = ytdActualOperatingExpenses === 0 && ytdActualIncome === 0 ? 0 : ((ytdActualIncome - ytdActualOperatingExpenses) / monthsPassedYTD) * 12;
    
    const capRate = currentProperty.purchasePrice && currentProperty.purchasePrice > 0 && !isNaN(annualizedActualNOI)
      ? (annualizedActualNOI / currentProperty.purchasePrice) * 100 : null;

    const initialCashInvestment = currentProperty.initialInvestment || currentProperty.downPayment;
    const annualizedActualCashFlow = ytdActualCashFlow === 0 ? 0 : (ytdActualCashFlow / monthsPassedYTD) * 12; 
    
    const roiOnCashInvestment = initialCashInvestment && initialCashInvestment > 0 && !isNaN(annualizedActualCashFlow)
      ? (annualizedActualCashFlow / initialCashInvestment) * 100 : null;

    let ytdInterestPaid = 0;
    let ytdPrincipalPaid = 0;
    let totalPrincipalPaidEver = 0;
    let currentLoanBalance = currentProperty.loanAmount || 0;
    const loanOriginationDate = currentProperty.loanOriginationDate ? new Date(currentProperty.loanOriginationDate) : (currentProperty.dateOfPurchase ? new Date(currentProperty.dateOfPurchase) : null);

    if (currentProperty.loanAmount && currentProperty.interestRate && currentProperty.monthlyMortgage && loanOriginationDate) {
        let tempLoanBalance = currentProperty.loanAmount;
        const monthlyInterestRate = (currentProperty.interestRate / 100) / 12;
        const mortgagePayments = propertyTransactions.filter(tx => tx.category === 'MORTGAGE' && tx.type === TransactionType.EXPENSE);
        
        for (const payment of mortgagePayments) {
            const paymentDate = new Date(payment.date);
            if (paymentDate < loanOriginationDate) continue;
            const interestComponent = tempLoanBalance * monthlyInterestRate;
            const principalAndInterestPayment = currentProperty.monthlyMortgage || payment.amount;
            let principalComponent = principalAndInterestPayment - interestComponent;
             if (principalComponent < 0) principalComponent = 0;
             if (principalComponent > tempLoanBalance) principalComponent = tempLoanBalance;
            tempLoanBalance -= principalComponent;
            totalPrincipalPaidEver += principalComponent;
             if (paymentDate.getFullYear() === currentYear) {
                ytdInterestPaid += interestComponent;
                ytdPrincipalPaid += principalComponent;
            }
        }
        currentLoanBalance = tempLoanBalance > 0 ? tempLoanBalance : 0; 
    }
    
    const monthlyRentForProjection = activeLeaseForProperty?.monthlyRentAmount ?? currentProperty.projectedMonthlyRent ?? 0;
    const projectedYtdRent = monthlyRentForProjection * monthsPassedYTD;

    const projectedYtdMortgage = (currentProperty.projectedMonthlyMortgage || 0) * monthsPassedYTD;
    const projectedYtdPropertyTaxes = (currentProperty.projectedMonthlyPropertyTaxes || 0) * monthsPassedYTD;
    const projectedYtdInsurance = (currentProperty.projectedMonthlyInsurance || 0) * monthsPassedYTD;
    const projectedYtdHoa = (currentProperty.projectedMonthlyHoa || 0) * monthsPassedYTD;
    const projectedYtdManagementFee = (currentProperty.projectedMonthlyManagementFee || 0) * monthsPassedYTD;


    return {
      monthlyRentCollected,
      categorizedExpenses: categorizedExpensesItems.filter(cg => cg.total > 0).sort((a,b) => b.total - a.total),
      ytdActualIncome, currentMonthActualIncome, ytdActualExpenses, currentMonthActualExpenses,
      ytdActualCashFlow, currentMonthActualCashFlow, annualizedActualNOI, capRate, roiOnCashInvestment,
      ytdInterestPaid, ytdPrincipalPaid, totalPrincipalPaidEver, currentLoanBalance,
      initialCashInvestment,
      totalAllInPurchaseCapExYTD: (currentProperty.purchasePrice || 0) + ytdActualCapitalExpenses,
      projectedYtdRent, ytdActualRent: monthlyRentCollected ? Object.values(monthlyRentCollected).reduce((s,a) => s+a, 0) : 0,
      projectedYtdMortgage, ytdActualMortgage,
      projectedYtdPropertyTaxes, ytdActualPropertyTaxes,
      projectedYtdInsurance, ytdActualInsurance,
      projectedYtdHoa, ytdActualHoa,
      projectedYtdManagementFee, ytdActualManagementFee,
    };
  }, [currentProperty, propertyTransactions, activeLeaseForProperty]);

  if (!currentProperty) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
          <BuildingIcon className="h-6 w-6 text-neutral-400" />
        </div>
        <h3 className="text-xl font-medium text-neutral-700">Property not found</h3>
        <p className="mt-1 text-sm text-neutral-500">The property you are looking for does not exist or has been removed.</p>
        <Link to="/properties" className="mt-6 inline-block text-primary hover:text-primary-dark">&larr; Back to Properties</Link>
      </div>
    );
  }

  if (!financialCalculations) {
    return <div className="text-center py-10">Loading financial data...</div>;
  }

  const {
    monthlyRentCollected, categorizedExpenses,
    ytdActualIncome, currentMonthActualIncome, ytdActualExpenses, currentMonthActualExpenses,
    ytdActualCashFlow, currentMonthActualCashFlow, annualizedActualNOI, capRate, roiOnCashInvestment,
    ytdInterestPaid, ytdPrincipalPaid, totalPrincipalPaidEver, currentLoanBalance,
    initialCashInvestment, totalAllInPurchaseCapExYTD,
    projectedYtdRent, ytdActualRent,
    projectedYtdMortgage, ytdActualMortgage,
    projectedYtdPropertyTaxes, ytdActualPropertyTaxes,
    projectedYtdInsurance, ytdActualInsurance,
    projectedYtdHoa, ytdActualHoa,
    projectedYtdManagementFee, ytdActualManagementFee,
  } = financialCalculations;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-800 break-words">
          Property Finances: <span className="text-primary">{currentProperty.address}</span>
        </h2>
        <Link to="/properties" className="text-sm text-primary hover:text-primary-dark self-start sm:self-center whitespace-nowrap">&larr; All Properties</Link>
      </div>

      {(currentProperty.parcelId || currentProperty.countyAppraiserUrl) && (
        <div className="bg-white rounded-xl border border-neutral-200 px-5 py-3.5 flex flex-wrap gap-x-8 gap-y-3">
          {currentProperty.parcelId && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100">
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Parcel ID</p>
                <p className="text-sm font-semibold text-neutral-800 font-mono">{currentProperty.parcelId}</p>
              </div>
            </div>
          )}
          {currentProperty.countyAppraiserUrl && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100">
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">County Appraiser</p>
                <a
                  href={currentProperty.countyAppraiserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  View Property Record →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard title="YTD Actual Income" value={formatCurrency(ytdActualIncome)} subValue={`Current Month: ${formatCurrency(currentMonthActualIncome)}`} />
        <StatCard title="YTD Actual Expenses" value={formatCurrency(ytdActualExpenses)} subValue={`Current Month: ${formatCurrency(currentMonthActualExpenses)}`} />
        <StatCard title="YTD Actual Cash Flow" value={formatCurrency(ytdActualCashFlow)} subValue={`Current Month: ${formatCurrency(currentMonthActualCashFlow)}`} />
        <StatCard title="Annualized NOI (Actual)" value={formatCurrency(annualizedActualNOI)} small/>
        <StatCard title="Cap Rate (Actual)" value={capRate !== null ? `${capRate.toFixed(1)}%` : 'N/A'} subValue={currentProperty.purchasePrice ? `PP: ${formatCurrency(currentProperty.purchasePrice)}` : 'PP N/A'} small/>
        <StatCard title="ROI on Cash (Actual)" value={roiOnCashInvestment !== null ? `${roiOnCashInvestment.toFixed(1)}%` : 'N/A'} subValue={initialCashInvestment ? `Cash Invest: ${formatCurrency(initialCashInvestment)}` : 'Cash N/A'} small/>
      </div>

       <div className="bg-white p-3 md:p-6 rounded-lg border border-neutral-200">
        <h3 className="text-md md:text-lg font-semibold text-neutral-700 mb-3">Investment & Loan Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <StatCard title="Initial Cash Investment" value={formatCurrency(initialCashInvestment)} small />
            <StatCard title="Total Principal Paid (Equity from Mortgage)" value={formatCurrency(totalPrincipalPaidEver)} small />
            <StatCard title="Current Loan Balance" value={formatCurrency(currentLoanBalance, (currentProperty.loanAmount ? formatCurrency(currentProperty.loanAmount) : 'N/A'))} subValue={currentProperty.loanAmount ? `Orig: ${formatCurrency(currentProperty.loanAmount)}` : 'Orig: N/A'} small />
            <StatCard title="YTD Interest Paid" value={formatCurrency(ytdInterestPaid)} small />
            <StatCard title="YTD Principal Paid" value={formatCurrency(ytdPrincipalPaid)} small />
            <StatCard title="Total All-In (Purchase + YTD CapEx)" value={formatCurrency(totalAllInPurchaseCapExYTD)} small />
        </div>
      </div>

      <div className="bg-white p-3 md:p-6 rounded-lg border border-neutral-200">
        <button 
            onClick={() => setIsProjectionsOpen(!isProjectionsOpen)}
            className="w-full flex justify-between items-center text-left text-md md:text-lg font-semibold text-neutral-700 mb-3 focus:outline-none"
            aria-expanded={isProjectionsOpen}
            aria-controls="projections-content"
        >
          <span>YTD Projections vs Actuals ({new Date().getFullYear()})</span>
          <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transform transition-transform duration-200 ${isProjectionsOpen ? 'rotate-180' : ''}`} />
        </button>
        {isProjectionsOpen && (
            <div id="projections-content" className="space-y-1">
                <ProjectedActualItem label="Rent Income" actual={ytdActualRent} projected={projectedYtdRent} />
                <ProjectedActualItem label="Mortgage (P&I)" actual={ytdActualMortgage} projected={projectedYtdMortgage} />
                <ProjectedActualItem label="Property Taxes" actual={ytdActualPropertyTaxes} projected={projectedYtdPropertyTaxes} />
                <ProjectedActualItem label="Insurance" actual={ytdActualInsurance} projected={projectedYtdInsurance} />
                <ProjectedActualItem label="HOA Dues" actual={ytdActualHoa} projected={projectedYtdHoa} />
                <ProjectedActualItem label="Management Fee" actual={ytdActualManagementFee} projected={projectedYtdManagementFee} />
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-lg border border-neutral-200">
           <h3 className="text-md md:text-lg font-semibold text-neutral-700 mb-3">Actual Rent Collected ({new Date().getFullYear()})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
            {monthNames.map((monthName, index) => (
              <div key={monthName} className="p-2 md:p-3 bg-neutral-100 rounded text-center">
                <p className="text-xs font-medium text-neutral-500">{monthName}</p>
                <p className="text-sm md:text-md font-semibold text-neutral-700">{formatCurrency(monthlyRentCollected[index])}</p>
              </div>
            ))}
          </div>
        </div>
      
        <div className="bg-white p-3 md:p-6 rounded-lg border border-neutral-200">
          <h3 className="text-md md:text-lg font-semibold text-neutral-700 mb-3">Actual Expenses YTD ({new Date().getFullYear()})</h3>
          {categorizedExpenses.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {categorizedExpenses.map(({ categoryLabel, items, total }) => (
                items.length > 0 && (
                <div key={categoryLabel}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm md:text-md font-medium text-primary-dark">{categoryLabel}</h4>
                    {items.length > 1 && (
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(total)}</span>
                    )}
                  </div>
                  <ul className="divide-y divide-neutral-100 border-l-2 border-neutral-100 pl-2">
                    {items.map(item => (
                      <li key={item.id} className="py-1.5 text-xs md:text-sm flex justify-between items-center">
                        <div>
                          <span className="text-neutral-600">{formatDateForDisplay(item.date, {month:'short', day:'numeric'})}</span>
                          {item.description && <span className="text-neutral-500 italic ml-2">- {item.description}</span>}
                        </div>
                        <span className="font-medium text-red-500">{formatCurrency(item.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No expenses recorded for this property this year.</p>
          )}
        </div>
      </div>
      <div className="bg-white p-5 md:p-6 rounded-xl border border-neutral-200">
        <PropertyDocuments propertyId={currentProperty.id} />
      </div>

       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; /* neutral-50 */ border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; /* neutral-300 */ border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; /* neutral-400 */ }
      `}</style>
    </div>
  );
};

export default PropertyFinancePage;