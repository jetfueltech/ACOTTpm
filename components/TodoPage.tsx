
import React, { useState, useMemo, useEffect } from 'react';
import { TodoItem, TodoPriority, Property, OptionType } from '../types';
import TodoItemCard from './TodoItemCard';
// import { ClipboardCheckIcon, PlusCircleIcon } from '../constants'; // No longer needed

interface TodoPageProps {
  todoItems: TodoItem[];
  properties: Property[];
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'isCompleted' | 'createdAt'>) => void;
  onUpdateTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
}

const InputField: React.FC<{
  label: string; id: string; type?: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean; placeholder?: string; children?: React.ReactNode; className?: string;
}> = ({ label, id, type = "text", value, onChange, required = false, placeholder, children, className }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    {children || (
      React.createElement(type === 'textarea' ? 'textarea' : 'input', {
        type: type === 'textarea' ? undefined : type,
        id: id, name: id, value: value, onChange: onChange, required: required,
        placeholder: placeholder,
        rows: type === 'textarea' ? 3 : undefined,
        className: "mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      })
    )}
  </div>
);

type FilterStatus = 'all' | 'active' | 'completed';

const TodoPage: React.FC<TodoPageProps> = ({ todoItems, properties, onAddTodo, onUpdateTodo, onDeleteTodo }) => {
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [propertyId, setPropertyId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');

  useEffect(() => {
    if (editingTodo) {
      setText(editingTodo.text);
      setDueDate(editingTodo.dueDate || '');
      setPriority(editingTodo.priority || 'medium');
      setPropertyId(editingTodo.propertyId || '');
      setNotes(editingTodo.notes || '');
      setShowForm(true); 
    } else {
      setText('');
      setDueDate('');
      setPriority('medium');
      setPropertyId('');
      setNotes('');
    }
  }, [editingTodo]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Task description cannot be empty.");
      return;
    }
    setError(null);

    const todoData = {
      text,
      dueDate: dueDate || undefined,
      priority,
      propertyId: propertyId || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingTodo) {
      onUpdateTodo({ ...editingTodo, ...todoData });
    } else {
      onAddTodo(todoData);
    }
    
    setEditingTodo(null);
    setShowForm(false);
  };

  const handleStartEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setShowForm(false); 
  };
  
  const toggleTodoCompletion = (todo: TodoItem) => {
    onUpdateTodo({ ...todo, isCompleted: !todo.isCompleted });
  };


  const propertyOptions: OptionType[] = [
    { value: '', label: 'None (General Task)' },
    ...properties.map(p => ({ value: p.id, label: p.address }))
  ];
  
  const priorityOptions: OptionType[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todoItems;
    if (filterStatus === 'active') {
      filtered = todoItems.filter(todo => !todo.isCompleted);
    } else if (filterStatus === 'completed') {
      filtered = todoItems.filter(todo => todo.isCompleted);
    }

    return filtered.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (!a.isCompleted) {
        if (a.dueDate && b.dueDate) {
          if (a.dueDate !== b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (a.dueDate) {
          return -1; 
        } else if (b.dueDate) {
          return 1;  
        }
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todoItems, filterStatus]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold text-neutral-800">To-Do List</h2>
        <button
          onClick={() => { setEditingTodo(null); setShowForm(!showForm); }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
        >
          <span className="mr-2" role="img" aria-label="Add">➕</span>
          {showForm && !editingTodo ? 'Close Form' : (editingTodo ? 'Cancel Edit' : 'Add New Task')}
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-white rounded-xl border border-neutral-200 space-y-6 mb-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-neutral-700">{editingTodo ? 'Edit Task' : 'Add New Task'}</h3>
          {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <InputField label="Task Description" id="todo-text" value={text} onChange={e => setText((e.target as HTMLInputElement).value)} required placeholder="What needs to be done?" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Due Date (Optional)" id="todo-dueDate" type="date" value={dueDate} onChange={e => setDueDate((e.target as HTMLInputElement).value)} />
              <InputField label="Priority" id="todo-priority" value={priority} onChange={e => setPriority((e.target as HTMLSelectElement).value as TodoPriority)}>
                <select id="todo-priority" value={priority} onChange={e => setPriority(e.target.value as TodoPriority)} className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                  {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </InputField>
            </div>
            <InputField label="Link to Property (Optional)" id="todo-propertyId" value={propertyId} onChange={e => setPropertyId((e.target as HTMLSelectElement).value)}>
              <select id="todo-propertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                {propertyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </InputField>
            <InputField label="Notes (Optional)" id="todo-notes" type="textarea" value={notes} onChange={e => setNotes((e.target as HTMLTextAreaElement).value)} placeholder="Additional details..." />
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark">
                {editingTodo ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="mb-6 flex justify-center space-x-2">
        {(['all', 'active', 'completed'] as FilterStatus[]).map(status => (
            <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                        ${filterStatus === status 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'}`}
            >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
        ))}
     </div>


      {filteredAndSortedTodos.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl" role="img" aria-label="Clipboard with checkmark">📋</span>
          <h3 className="mt-2 text-lg font-medium text-neutral-900">
            {filterStatus === 'all' && todoItems.length === 0 ? 'No tasks yet' : `No ${filterStatus} tasks`}
          </h3>
          {filterStatus === 'all' && todoItems.length === 0 && <p className="mt-1 text-sm text-neutral-500">Get started by adding your first task.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTodos.map(todo => (
            <TodoItemCard
              key={todo.id}
              todoItem={todo}
              properties={properties}
              onToggleComplete={() => toggleTodoCompletion(todo)}
              onEdit={() => handleStartEdit(todo)}
              onDelete={onDeleteTodo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoPage;