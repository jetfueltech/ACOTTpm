
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Property, Tenant, Transaction, Lease, NavItem, PropertyType, TransactionType, SecurityDepositTransaction, SecurityDepositTransactionType, TodoItem } from './types';
import { DEFAULT_IMAGE_URL_BASE, generateId, INCOME_CATEGORIES } from './constants'; 
import DashboardPage from './components/DashboardPage';
import PropertiesPage from './components/PropertiesPage';
import PropertyForm from './components/PropertyForm';
import TenantsPage from './components/TenantsPage';
import TenantForm from './components/TenantForm';
import FinancialsPage from './components/FinancialsPage';
import PropertyFinancePage from './components/PropertyFinancePage';
import LeasesPage from './components/LeasesPage';
import LeaseForm from './components/LeaseForm';
import TodoPage from './components/TodoPage'; 

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [securityDepositTransactions, setSecurityDepositTransactions] = useState<SecurityDepositTransaction[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // --- Utility Functions ---
  const determineLeaseIsActive = useCallback((lease: Lease | Omit<Lease, 'id' | 'isActive'>): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const startDate = new Date(lease.leaseStartDate);
    const endDate = new Date(lease.leaseEndDate);
    return startDate <= today && today <= endDate;
  }, []);

  const updatePropertyFromLeases = useCallback((propertyId: string, currentLeases: Lease[], currentProperties: Property[]) => {
    setProperties(prevProps => prevProps.map(p => {
      if (p.id === propertyId) {
        const propertyLeases = currentLeases.filter(l => l.propertyId === propertyId);
        let activeLeaseForProperty: Lease | null = null;
        if (propertyLeases.length > 0) {
            const activeLeases = propertyLeases.filter(determineLeaseIsActive);
            if (activeLeases.length > 0) {
                activeLeaseForProperty = activeLeases.sort((a, b) => new Date(b.leaseStartDate).getTime() - new Date(a.leaseStartDate).getTime())[0];
            }
        }
        if (activeLeaseForProperty) {
          return { ...p, tenantId: activeLeaseForProperty.tenantId, rentAmount: activeLeaseForProperty.monthlyRentAmount };
        } else {
          return { ...p, tenantId: null, rentAmount: p.rentAmount === undefined ? 0 : p.rentAmount }; // Ensure rentAmount is 0 if undefined, otherwise keep existing (e.g. asking rent)
        }
      }
      return p;
    }));
  }, [setProperties, determineLeaseIsActive]);


  // Load data from localStorage or set initial hardcoded data
  useEffect(() => {
    let initialPropertiesSetup: Property[] = [];
    const storedPropertiesString = localStorage.getItem('properties');

    if (storedPropertiesString) {
        initialPropertiesSetup = JSON.parse(storedPropertiesString);
    } else {
        const bootsLanePropertyData = {
            address: "6850 Boots Lane, Milton, FL", type: PropertyType.HOUSE, bedrooms: 3, bathrooms: 2, rentAmount: 0,
            description: "Newly constructed single-family home in a desirable Milton neighborhood. Features modern amenities and a spacious layout.",
            squareFootage: 1276, initialInvestment: 60000, purchasePrice: 247500, dateOfPurchase: "2025-05-01",
            loanAmount: 187500, loanTermYears: 30, interestRate: 8.5, monthlyMortgage: 1441.71, escrowIncluded: true, loanOriginationDate: "2025-05-01",
            projectedMonthlyRent: 2200, projectedMonthlyPropertyTaxes: 200, projectedMonthlyInsurance: 98.29,  projectedMonthlyMortgage: 1441.71, projectedMonthlyManagementFee: 176,
            notes: "Initial hardcoded property. New construction purchase.", tenantId: null,
            // Optional fields not in original bootsLanePropertyData that Property type includes:
            downPayment: undefined, // Or a value if it makes sense, e.g., 60000 if initialInvestment is purely downpayment
            projectedMonthlyHoa: undefined,
        };
        const newProperty: Property = {
            id: generateId(),
            imageUrl: `${DEFAULT_IMAGE_URL_BASE}/${generateId()}/400/300`, // Default image
            address: bootsLanePropertyData.address,
            type: bootsLanePropertyData.type,
            bedrooms: bootsLanePropertyData.bedrooms,
            bathrooms: bootsLanePropertyData.bathrooms,
            rentAmount: bootsLanePropertyData.rentAmount, // Initially 0
            description: bootsLanePropertyData.description,
            tenantId: bootsLanePropertyData.tenantId,
            squareFootage: bootsLanePropertyData.squareFootage,
            initialInvestment: bootsLanePropertyData.initialInvestment,
            downPayment: bootsLanePropertyData.downPayment,
            purchasePrice: bootsLanePropertyData.purchasePrice,
            dateOfPurchase: bootsLanePropertyData.dateOfPurchase,
            loanAmount: bootsLanePropertyData.loanAmount,
            loanTermYears: bootsLanePropertyData.loanTermYears,
            interestRate: bootsLanePropertyData.interestRate,
            monthlyMortgage: bootsLanePropertyData.monthlyMortgage,
            escrowIncluded: bootsLanePropertyData.escrowIncluded,
            loanOriginationDate: bootsLanePropertyData.loanOriginationDate,
            projectedMonthlyRent: bootsLanePropertyData.projectedMonthlyRent,
            projectedMonthlyPropertyTaxes: bootsLanePropertyData.projectedMonthlyPropertyTaxes,
            projectedMonthlyInsurance: bootsLanePropertyData.projectedMonthlyInsurance,
            projectedMonthlyHoa: bootsLanePropertyData.projectedMonthlyHoa,
            projectedMonthlyManagementFee: bootsLanePropertyData.projectedMonthlyManagementFee,
            notes: bootsLanePropertyData.notes,
        };
        initialPropertiesSetup = [newProperty];
    }

    let initialLeasesSetup: Lease[] = [];
    const storedLeasesString = localStorage.getItem('leases');
    if (storedLeasesString) {
        const parsedLeases: Lease[] = JSON.parse(storedLeasesString);
        initialLeasesSetup = parsedLeases.map(l => ({ ...l, isActive: determineLeaseIsActive(l) }));
    }

    // Update properties based on these initial leases before setting state
    const propertiesUpdatedWithInitialLeases = initialPropertiesSetup.map(p => {
        const propertyLeases = initialLeasesSetup.filter(l => l.propertyId === p.id);
        let activeLeaseForProperty: Lease | null = null;
        if (propertyLeases.length > 0) {
            const activeLeases = propertyLeases.filter(determineLeaseIsActive);
            if (activeLeases.length > 0) {
                activeLeaseForProperty = activeLeases.sort((a, b) => new Date(b.leaseStartDate).getTime() - new Date(a.leaseStartDate).getTime())[0];
            }
        }
        if (activeLeaseForProperty) {
            return { ...p, tenantId: activeLeaseForProperty.tenantId, rentAmount: activeLeaseForProperty.monthlyRentAmount };
        } else {
            // If no active lease, ensure tenantId is null. Rent amount can be default or last known.
            // For a truly vacant property just added or loaded without an active lease, rentAmount might be 0 or an 'asking rent'.
            // The initial property (Boots Lane) has rentAmount: 0. If loading from localStorage, it keeps its stored rentAmount.
            return { ...p, tenantId: null, rentAmount: p.rentAmount === undefined ? 0 : p.rentAmount };
        }
    });

    setProperties(propertiesUpdatedWithInitialLeases);
    setLeases(initialLeasesSetup);

    const storedTenants = localStorage.getItem('tenants');
    if (storedTenants) setTenants(JSON.parse(storedTenants));
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    const storedSecurityDeposits = localStorage.getItem('securityDepositTransactions');
    if (storedSecurityDeposits) setSecurityDepositTransactions(JSON.parse(storedSecurityDeposits));
    const storedTodoItems = localStorage.getItem('todoItems');
    if (storedTodoItems) setTodoItems(JSON.parse(storedTodoItems));
    
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsSidebarCollapsed(sidebarCollapsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount. determineLeaseIsActive is stable due to useCallback.

  // Save data to localStorage
  useEffect(() => { localStorage.setItem('properties', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('leases', JSON.stringify(leases)); }, [leases]);
  useEffect(() => { localStorage.setItem('securityDepositTransactions', JSON.stringify(securityDepositTransactions)); }, [securityDepositTransactions]);
  useEffect(() => { localStorage.setItem('todoItems', JSON.stringify(todoItems)); }, [todoItems]);
  useEffect(() => { localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());}, [isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  const addPropertyInternal = useCallback((propertyInput: Omit<Property, 'id' | 'imageUrl'> & { customImageUrl?: string, initialRentAmount?: number }) => {
    const { customImageUrl, initialRentAmount, ...propertyData } = propertyInput;
    const newProperty: Property = {
      id: generateId(),
      imageUrl: customImageUrl || `${DEFAULT_IMAGE_URL_BASE}/${generateId()}/400/300`,
      description: propertyData.description || "A lovely property.",
      rentAmount: initialRentAmount || 0,
      ...propertyData,
      squareFootage: propertyData.squareFootage || undefined,
      initialInvestment: propertyData.initialInvestment || undefined,
      downPayment: propertyData.downPayment || undefined,
      purchasePrice: propertyData.purchasePrice || undefined,
      dateOfPurchase: propertyData.dateOfPurchase || undefined,
      loanAmount: propertyData.loanAmount || undefined,
      loanTermYears: propertyData.loanTermYears || undefined,
      interestRate: propertyData.interestRate || undefined,
      monthlyMortgage: propertyData.monthlyMortgage || undefined,
      escrowIncluded: typeof propertyData.escrowIncluded === 'boolean' ? propertyData.escrowIncluded : false,
      loanOriginationDate: propertyData.loanOriginationDate || propertyData.dateOfPurchase || undefined,
      projectedMonthlyRent: propertyData.projectedMonthlyRent || undefined,
      projectedMonthlyMortgage: propertyData.projectedMonthlyMortgage || undefined,
      projectedMonthlyPropertyTaxes: propertyData.projectedMonthlyPropertyTaxes || undefined,
      projectedMonthlyInsurance: propertyData.projectedMonthlyInsurance || undefined,
      projectedMonthlyHoa: propertyData.projectedMonthlyHoa || undefined,
      projectedMonthlyManagementFee: propertyData.projectedMonthlyManagementFee || undefined,
      notes: propertyData.notes || undefined,
    };
    setProperties(prev => [...prev, newProperty]);
    return newProperty;
  }, []);


  const addProperty = useCallback((propertyInput: Omit<Property, 'id' | 'imageUrl' | 'rentAmount'> & { customImageUrl?: string }) => {
    addPropertyInternal({ ...propertyInput, rentAmount: 0, initialRentAmount: 0 });
  }, [addPropertyInternal]);


  const updateProperty = useCallback((updatedProperty: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? {
      ...p, 
      ...updatedProperty,
      loanOriginationDate: updatedProperty.loanOriginationDate || updatedProperty.dateOfPurchase || p.loanOriginationDate || p.dateOfPurchase,
    } : p));
    // It's important that `leases` and `properties` here are the current state values.
    updatePropertyFromLeases(updatedProperty.id, leases, properties); 
  }, [leases, properties, updatePropertyFromLeases]);
  
  const deleteProperty = useCallback((propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    setTenants(prev => prev.filter(t => t.propertyId !== propertyId)); 
    setTransactions(prev => prev.filter(tx => tx.propertyId !== propertyId));
    const leasesToDelete = leases.filter(l => l.propertyId === propertyId);
    setLeases(prev => prev.filter(l => l.propertyId !== propertyId));
    leasesToDelete.forEach(ltd => {
      setSecurityDepositTransactions(prevSdt => prevSdt.filter(sdt => sdt.leaseId !== ltd.id));
    });
    setTodoItems(prevTodos => prevTodos.map(todo => 
      todo.propertyId === propertyId ? { ...todo, propertyId: undefined } : todo
    ));
  }, [leases]);

  // Tenant CRUD
 const addTenant = useCallback((tenant: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = { ...tenant, id: generateId() };
    setTenants(prev => [...prev, newTenant]);
  }, []);
  
  const updateTenant = useCallback((updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  }, []);

  const deleteTenant = useCallback((tenantId: string) => {
    const leasesOfTenant = leases.filter(l => l.tenantId === tenantId);
    const updatedLeases = leases.filter(l => l.tenantId !== tenantId);
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setLeases(updatedLeases); 
    leasesOfTenant.forEach(lease => {
        updatePropertyFromLeases(lease.propertyId, updatedLeases, properties);
        setSecurityDepositTransactions(prevSdt => prevSdt.filter(sdt => sdt.leaseId !== lease.id));
    });
  }, [leases, properties, updatePropertyFromLeases]);

  // Transaction CRUD
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: generateId() };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  }, []);

  // Lease CRUD
  const addLease = useCallback((leaseInput: Omit<Lease, 'id' | 'isActive'>) => {
    const newLease: Lease = { 
        ...leaseInput, 
        id: generateId(), 
        isActive: determineLeaseIsActive(leaseInput as Lease) 
    };
    setLeases(prev => {
        const updated = [...prev, newLease].sort((a,b) => new Date(b.leaseEndDate).getTime() - new Date(a.leaseEndDate).getTime());
        updatePropertyFromLeases(newLease.propertyId, updated, properties);
        return updated;
    });
  }, [properties, updatePropertyFromLeases, determineLeaseIsActive]);

  const updateLease = useCallback((updatedLeaseInput: Lease) => {
     const fullyUpdatedLease = {...updatedLeaseInput, isActive: determineLeaseIsActive(updatedLeaseInput)};
    setLeases(prev => {
        const updated = prev.map(l => l.id === fullyUpdatedLease.id ? fullyUpdatedLease : l).sort((a,b) => new Date(b.leaseEndDate).getTime() - new Date(a.leaseEndDate).getTime());
        const oldLease = prev.find(l => l.id === fullyUpdatedLease.id);
        if (oldLease && oldLease.propertyId !== fullyUpdatedLease.propertyId) {
            updatePropertyFromLeases(oldLease.propertyId, updated, properties); 
        }
        updatePropertyFromLeases(fullyUpdatedLease.propertyId, updated, properties);
        return updated;
    });
  }, [properties, updatePropertyFromLeases, determineLeaseIsActive]);

  const deleteLease = useCallback((leaseId: string) => {
    const leaseToDelete = leases.find(l => l.id === leaseId);
    if (!leaseToDelete) return;
    
    setLeases(prev => {
        const updated = prev.filter(l => l.id !== leaseId);
        updatePropertyFromLeases(leaseToDelete.propertyId, updated, properties);
        return updated;
    });
    setSecurityDepositTransactions(prevSdt => prevSdt.filter(sdt => sdt.leaseId !== leaseId));
  }, [leases, properties, updatePropertyFromLeases]);

  // Security Deposit Transaction CRUD
  const addSecurityDepositTransaction = useCallback((sdtInput: Omit<SecurityDepositTransaction, 'id'>) => {
    const newSdt: SecurityDepositTransaction = { ...sdtInput, id: generateId() };
    setSecurityDepositTransactions(prev => [...prev, newSdt].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    if (newSdt.type === SecurityDepositTransactionType.FORFEITED_TO_INCOME) {
      const tenantName = tenants.find(t => t.id === newSdt.tenantId)?.name || 'Unknown Tenant';
      const propertyAddress = properties.find(p => p.id === newSdt.propertyId)?.address || 'Unknown Property';
      
      addTransaction({
        propertyId: newSdt.propertyId,
        type: TransactionType.INCOME,
        category: 'OTHER_INCOME', 
        amount: newSdt.amount,
        date: newSdt.date,
        description: `Forfeited Security Deposit: ${tenantName} - ${propertyAddress}`,
      });
    }
  }, [tenants, properties, addTransaction]);

  const deleteSecurityDepositTransaction = useCallback((sdtId: string) => {
    setSecurityDepositTransactions(prev => prev.filter(sdt => sdt.id !== sdtId));
  }, []);

  // To-Do Item CRUD
  const addTodoItem = useCallback((todoInput: Omit<TodoItem, 'id' | 'isCompleted' | 'createdAt'>) => {
    const newTodo: TodoItem = {
      ...todoInput,
      id: generateId(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setTodoItems(prev => [newTodo, ...prev]);
  }, []);

  const updateTodoItem = useCallback((updatedTodo: TodoItem) => {
    setTodoItems(prev => prev.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo));
  }, []);

  const deleteTodoItem = useCallback((todoId: string) => {
    setTodoItems(prev => prev.filter(todo => todo.id !== todoId));
  }, []);


  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: '🏠' },
    { name: 'Properties', path: '/properties', icon: '🏢' },
    { name: 'Tenants', path: '/tenants', icon: '👥' },
    { name: 'Leases', path: '/leases', icon: '📄' },
    { name: 'Financials', path: '/financials', icon: '💵' },
    { name: 'To-Do List', path: '/todos', icon: '✅' },
  ];

  const SidebarContent: React.FC<{onLinkClick?: () => void, collapsed: boolean}> = ({ onLinkClick, collapsed }) => {
    const location = useLocation();
    return (
      <div className="flex flex-col h-full">
        <h1 className={`font-bold text-white p-6 text-center ${collapsed ? 'text-xl py-4' : 'text-3xl'}`}>
          {collapsed ? <span role="img" aria-label="Building Icon" className="text-2xl">🏢</span> : <>Zenith<span className="text-primary-light">Estate</span></>}
        </h1>
        <nav className={`mt-2 flex-grow ${collapsed ? 'space-y-1' : 'space-y-0'}`}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={onLinkClick}
              title={collapsed ? item.name : undefined}
              className={`flex items-center py-3 transition-colors duration-200
                          ${collapsed ? 'px-3 justify-center' : 'px-6'}
                          ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) 
                            ? 'bg-primary-dark text-white font-semibold border-l-4 border-primary-light' 
                            : 'text-neutral-200 hover:bg-primary-dark hover:text-white'
                          }
                          ${collapsed && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) ? 'border-l-4 border-primary-light' : collapsed ? 'border-l-4 border-transparent' : ''}
                        `}
            >
              <span className={`inline-flex items-center justify-center text-xl ${!collapsed ? 'mr-4 w-6 h-6' : 'w-6 h-6'}`} role="img" aria-label={item.name}>{item.icon}</span>
              {!collapsed && item.name}
            </Link>
          ))}
        </nav>
        <div className={`p-4 mt-auto ${collapsed ? 'border-t border-neutral-700' : ''}`}>
          <button 
            onClick={toggleSidebarCollapse} 
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="w-full flex items-center justify-center p-2 text-neutral-300 hover:bg-primary-dark hover:text-white rounded-md transition-colors"
          >
            <span className="text-xl" role="img" aria-label={isSidebarCollapsed ? "Expand" : "Collapse"}>{isSidebarCollapsed ? '⏩' : '⏪'}</span>
             {!collapsed && <span className="ml-2 text-sm">{isSidebarCollapsed ? "Expand" : "Collapse"}</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-neutral-100">
        <aside className={`hidden md:flex flex-col bg-neutral-800 text-white fixed h-full shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <SidebarContent collapsed={isSidebarCollapsed} />
        </aside>
        
        <div className="md:hidden fixed top-4 left-4 z-20">
          <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="p-2 bg-primary text-white rounded-md text-2xl">
            <span role="img" aria-label="Menu">☰</span>
          </button>
        </div>
        
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <aside className="w-64 flex-col bg-neutral-800 text-white h-full shadow-lg">
               <SidebarContent collapsed={false} onLinkClick={() => setIsMobileSidebarOpen(false)} />
            </aside>
            <div className="flex-1 bg-black opacity-50" onClick={() => setIsMobileSidebarOpen(false)}></div>
          </div>
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage properties={properties} tenants={tenants} transactions={transactions} leases={leases} securityDepositTransactions={securityDepositTransactions} />} />
              <Route path="/properties" element={<PropertiesPage properties={properties} tenants={tenants} leases={leases} onDeleteProperty={deleteProperty} />} />
              <Route path="/properties/new" element={<PropertyForm onSubmit={addProperty} />} />
              <Route path="/properties/edit/:id" element={<PropertyForm onSubmit={updateProperty} properties={properties} />} />
              <Route path="/properties/:id/finances" element={<PropertyFinancePage properties={properties} transactions={transactions} leases={leases} />} /> 
              <Route path="/tenants" element={<TenantsPage tenants={tenants} properties={properties} leases={leases} onDeleteTenant={deleteTenant} />} />
              <Route path="/tenants/new" element={<TenantForm onSubmit={addTenant} properties={properties} />} />
              <Route path="/tenants/edit/:id" element={<TenantForm onSubmit={updateTenant} tenants={tenants} properties={properties} />} />
              <Route path="/leases" element={
                <LeasesPage 
                  leases={leases} 
                  properties={properties} 
                  tenants={tenants} 
                  onDeleteLease={deleteLease}
                  securityDepositTransactions={securityDepositTransactions}
                  addSecurityDepositTransaction={addSecurityDepositTransaction}
                  deleteSecurityDepositTransaction={deleteSecurityDepositTransaction}
                />} 
              />
              <Route path="/leases/new" element={<LeaseForm onSubmit={addLease} properties={properties} tenants={tenants} leases={leases} />} />
              <Route path="/leases/edit/:id" element={<LeaseForm onSubmit={updateLease} leases={leases} properties={properties} tenants={tenants} />} />
              <Route path="/financials" element={<FinancialsPage transactions={transactions} properties={properties} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} />} />
              <Route path="/todos" element={ <TodoPage todoItems={todoItems} properties={properties} onAddTodo={addTodoItem} onUpdateTodo={updateTodoItem} onDeleteTodo={deleteTodoItem} /> } />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;