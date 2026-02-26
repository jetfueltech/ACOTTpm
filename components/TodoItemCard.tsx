import React from 'react';
import { TodoItem, Property, TodoPriority } from '../types';
import { formatDateForDisplay } from '../constants';
import { TrashIcon, EditIcon, BuildingIcon } from './icons';

interface TodoItemCardProps {
  todoItem: TodoItem;
  properties: Property[];
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const getPriorityStyles = (priority?: TodoPriority): {textColor: string, bgColor: string, borderColor: string, label: string } => {
    switch (priority) {
        case 'high': return { textColor: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-500', label: 'High' };
        case 'medium': return { textColor: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-500', label: 'Medium' };
        case 'low': return { textColor: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-500', label: 'Low' };
        default: return { textColor: 'text-neutral-700', bgColor: 'bg-neutral-100', borderColor: 'border-neutral-400', label: 'Medium' }; // Default to neutral border
    }
};

const TodoItemCard: React.FC<TodoItemCardProps> = ({ todoItem, properties, onToggleComplete, onEdit, onDelete }) => {
  const linkedProperty = todoItem.propertyId ? properties.find(p => p.id === todoItem.propertyId) : null;
  const priorityStyles = getPriorityStyles(todoItem.priority);


  return (
    <div className={`p-4 rounded-2xl shadow-card flex items-start space-x-3 transition-all duration-300
                    ${todoItem.isCompleted ? 'bg-neutral-50 opacity-70' : 'bg-white'}
                    border-l-4 ${priorityStyles.borderColor}`}>
      <input
        type="checkbox"
        checked={todoItem.isCompleted}
        onChange={() => onToggleComplete(todoItem.id)}
        className="mt-1 form-checkbox h-5 w-5 text-primary rounded border-neutral-300 focus:ring-primary-dark cursor-pointer flex-shrink-0"
        aria-label={`Mark task ${todoItem.text} as ${todoItem.isCompleted ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-neutral-800 ${todoItem.isCompleted ? 'line-through text-neutral-500' : ''}`}>
          {todoItem.text}
        </p>
        <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
          {todoItem.dueDate && (
            <p><strong>Due:</strong> {formatDateForDisplay(todoItem.dueDate)}</p>
          )}
          <p>
            <strong>Priority:</strong> <span className={`${priorityStyles.textColor} font-semibold`}>{priorityStyles.label}</span>
          </p>
          {linkedProperty && (
            <p className="flex items-center">
              <BuildingIcon className="h-3.5 w-3.5 mr-1" />
              <span>{linkedProperty.address}</span>
            </p>
          )}
          {todoItem.notes && (
            <p className="pt-1 whitespace-pre-wrap"><strong>Notes:</strong> {todoItem.notes}</p>
          )}
           <p><strong>Created:</strong> {formatDateForDisplay(todoItem.createdAt)}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 shrink-0">
        <button
          onClick={() => onEdit(todoItem.id)}
          className="px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-primary rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
          aria-label={`Edit task ${todoItem.text}`}
        >
          <EditIcon className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => { if(window.confirm(`Are you sure you want to delete task: "${todoItem.text}"?`)) onDelete(todoItem.id)}}
          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          aria-label={`Delete task ${todoItem.text}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TodoItemCard;
