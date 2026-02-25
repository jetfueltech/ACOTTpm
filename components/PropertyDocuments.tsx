import React, { useState, useEffect, useCallback } from 'react';
import { supabase, PropertyDocument, DOCUMENT_CATEGORIES } from '../lib/supabase';

interface PropertyDocumentsProps {
  propertyId: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('zip')) return '🗜️';
  return '📎';
};

const getCategoryLabel = (value: string): string => {
  return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label ?? value;
};

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ propertyId }) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('uploaded_at', { ascending: false });

    if (fetchError) {
      setError('Failed to load documents.');
    } else {
      setDocuments(data ?? []);
    }
    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
    if (file && !uploadName) {
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (!uploadName.trim()) {
      setError('Please provide a document name.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const fileExt = uploadFile.name.split('.').pop();
    const filePath = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-documents')
      .upload(filePath, uploadFile);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('property-documents')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('property_documents')
      .insert({
        property_id: propertyId,
        name: uploadName.trim(),
        category: uploadCategory,
        file_url: urlData.publicUrl,
        file_name: uploadFile.name,
        file_size: uploadFile.size,
        file_type: uploadFile.type,
        notes: uploadNotes.trim(),
      });

    if (dbError) {
      setError(`Failed to save document record: ${dbError.message}`);
    } else {
      setUploadName('');
      setUploadCategory('other');
      setUploadNotes('');
      setUploadFile(null);
      setShowUploadForm(false);
      await fetchDocuments();
    }

    setIsUploading(false);
  };

  const handleDelete = async (doc: PropertyDocument) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;

    const filePath = doc.file_url.split('/property-documents/')[1];
    if (filePath) {
      await supabase.storage.from('property-documents').remove([filePath]);
    }

    const { error: dbError } = await supabase
      .from('property_documents')
      .delete()
      .eq('id', doc.id);

    if (dbError) {
      setError(`Failed to delete document: ${dbError.message}`);
    } else {
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800">Documents</h3>
        <button
          onClick={() => { setShowUploadForm(v => !v); setError(null); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
        >
          <span className="text-base" role="img" aria-label="Upload">📎</span>
          {showUploadForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{error}</p>
      )}

      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-neutral-700">Upload New Document</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Document Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass}
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="e.g., Property Deed 2024"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select
                className={inputClass}
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
              >
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>File <span className="text-red-500">*</span></label>
            <input
              type="file"
              className={inputClass}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">Max 50 MB. Accepted: PDF, Word, Excel, images, ZIP, text files.</p>
          </div>
          <div>
            <label className={labelClass}>Notes (Optional)</label>
            <textarea
              className={inputClass}
              rows={2}
              value={uploadNotes}
              onChange={e => setUploadNotes(e.target.value)}
              placeholder="Any notes about this document..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowUploadForm(false); setError(null); }}
              className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors disabled:bg-neutral-400"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-neutral-500 text-sm">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-neutral-300 rounded-lg">
          <p className="text-sm text-neutral-500">No documents uploaded yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Upload deeds, contracts, permits, and other property documents.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-neutral-50 transition-colors">
              <span className="text-2xl flex-shrink-0" role="img" aria-label="file">{getFileIcon(doc.file_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-primary-dark hover:underline truncate"
                  >
                    {doc.name}
                  </a>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    {getCategoryLabel(doc.category)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-neutral-500 truncate">{doc.file_name}</span>
                  {doc.file_size > 0 && (
                    <span className="text-xs text-neutral-400">{formatFileSize(doc.file_size)}</span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                {doc.notes && (
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{doc.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-neutral-400 hover:text-primary rounded transition-colors"
                  title="Open document"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded transition-colors"
                  title="Delete document"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyDocuments;
