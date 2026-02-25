import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, PropertyDocument, DOCUMENT_CATEGORIES } from '../lib/supabase';

interface PropertyDocumentsProps {
  propertyId: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FILE_TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pdf:         { bg: 'bg-red-50',    text: 'text-red-600',    label: 'PDF'  },
  image:       { bg: 'bg-sky-50',    text: 'text-sky-600',    label: 'IMG'  },
  word:        { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'DOC'  },
  excel:       { bg: 'bg-green-50',  text: 'text-green-600',  label: 'XLS'  },
  zip:         { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'ZIP'  },
  default:     { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'FILE' },
};

const getFileConfig = (fileType: string) => {
  if (fileType.includes('pdf')) return FILE_TYPE_CONFIG.pdf;
  if (fileType.includes('image')) return FILE_TYPE_CONFIG.image;
  if (fileType.includes('word') || fileType.includes('document')) return FILE_TYPE_CONFIG.word;
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return FILE_TYPE_CONFIG.excel;
  if (fileType.includes('zip')) return FILE_TYPE_CONFIG.zip;
  return FILE_TYPE_CONFIG.default;
};

const FileTypeBadge: React.FC<{ fileType: string }> = ({ fileType }) => {
  const cfg = getFileConfig(fileType);
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

const CATEGORY_COLORS: Record<string, string> = {
  deed:       'bg-amber-50 text-amber-700 ring-amber-200/60',
  contract:   'bg-blue-50 text-blue-700 ring-blue-200/60',
  permit:     'bg-green-50 text-green-700 ring-green-200/60',
  lease:      'bg-sky-50 text-sky-700 ring-sky-200/60',
  insurance:  'bg-purple-50 text-purple-700 ring-purple-200/60',
  inspection: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  tax:        'bg-red-50 text-red-700 ring-red-200/60',
  hoa:        'bg-teal-50 text-teal-700 ring-teal-200/60',
  other:      'bg-neutral-100 text-neutral-600 ring-neutral-200/60',
};

const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
const getCategoryLabel = (val: string) => DOCUMENT_CATEGORIES.find(c => c.value === val)?.label ?? val;

const inputCls = "block w-full px-3.5 py-2.5 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors placeholder:text-neutral-400";
const labelCls = "block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5";

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ propertyId }) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('uploaded_at', { ascending: false });

    if (fetchError) setError('Failed to load documents.');
    else setDocuments(data ?? []);
    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const applyFile = (file: File) => {
    setUploadFile(file);
    if (!uploadName) setUploadName(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) applyFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { applyFile(file); setShowUploadPanel(true); }
  };

  const resetForm = () => {
    setUploadName('');
    setUploadCategory('other');
    setUploadNotes('');
    setUploadFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) { setError('Please select a file.'); return; }
    if (!uploadName.trim()) { setError('Please provide a document name.'); return; }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    const fileExt = uploadFile.name.split('.').pop();
    const filePath = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-documents')
      .upload(filePath, uploadFile);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(80);

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
      setUploadProgress(100);
      resetForm();
      setShowUploadPanel(false);
      await fetchDocuments();
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDelete = async (doc: PropertyDocument) => {
    if (!window.confirm(`Remove "${doc.name}" permanently?`)) return;
    const filePath = doc.file_url.split('/property-documents/')[1];
    if (filePath) await supabase.storage.from('property-documents').remove([filePath]);
    const { error: dbError } = await supabase.from('property_documents').delete().eq('id', doc.id);
    if (dbError) setError(`Failed to delete: ${dbError.message}`);
    else setDocuments(prev => prev.filter(d => d.id !== doc.id));
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`transition-colors rounded-xl ${isDragging ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Documents</h3>
          {documents.length > 0 && (
            <p className="text-xs text-neutral-400 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => { setShowUploadPanel(v => !v); setError(null); }}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${showUploadPanel ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-primary text-white hover:bg-primary-dark shadow-sm'}`}
        >
          {showUploadPanel ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {showUploadPanel && (
        <form onSubmit={handleUpload} className="mb-5 bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-neutral-700">Upload Document</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors
              ${uploadFile ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:border-primary hover:bg-primary/5'}`}
          >
            {uploadFile ? (
              <>
                <FileTypeBadge fileType={uploadFile.type} />
                <p className="text-sm font-medium text-neutral-800">{uploadFile.name}</p>
                <p className="text-xs text-neutral-400">{formatFileSize(uploadFile.size)}</p>
                <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white border border-neutral-200 hover:bg-red-50 hover:border-red-200 text-neutral-400 hover:text-red-500 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-sm text-neutral-500"><span className="font-medium text-primary">Click to browse</span> or drag &amp; drop</p>
                <p className="text-xs text-neutral-400">PDF, Word, Excel, images, ZIP — up to 50 MB</p>
              </>
            )}
            <input ref={fileInputRef} type="file" className="sr-only" onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Document Name <span className="text-red-400">*</span></label>
              <input type="text" className={inputCls} value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g., Property Deed 2024" required />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                {DOCUMENT_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes <span className="text-neutral-300">(Optional)</span></label>
            <textarea className={inputCls} rows={2} value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="Any relevant notes..." />
          </div>

          {isUploading && (
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" onClick={() => { setShowUploadPanel(false); resetForm(); setError(null); }}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isUploading || !uploadFile}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-sm text-neutral-400 gap-2">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading documents...
        </div>
      ) : documents.length === 0 && !showUploadPanel ? (
        <div
          onClick={() => setShowUploadPanel(true)}
          className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <svg className="h-9 w-9 text-neutral-300 group-hover:text-primary/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-500 group-hover:text-neutral-700">No documents yet</p>
            <p className="text-xs text-neutral-400 mt-0.5">Click to upload a deed, contract, permit, or other file</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="group flex items-center gap-3.5 px-4 py-3.5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-card-hover transition-all">
              <FileTypeBadge fileType={doc.file_type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold text-neutral-800 hover:text-primary transition-colors truncate">
                    {doc.name}
                  </a>
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${getCategoryColor(doc.category)}`}>
                    {getCategoryLabel(doc.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-neutral-400 truncate max-w-[200px]">{doc.file_name}</span>
                  {doc.file_size > 0 && <span className="text-xs text-neutral-400">{formatFileSize(doc.file_size)}</span>}
                  <span className="text-xs text-neutral-400">{new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {doc.notes && <p className="text-xs text-neutral-500 mt-1 italic truncate">{doc.notes}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Open">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onClick={() => handleDelete(doc)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl border-2 border-primary px-10 py-8 text-center shadow-2xl">
            <svg className="h-12 w-12 text-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-lg font-semibold text-neutral-900">Drop to upload</p>
            <p className="text-sm text-neutral-500 mt-1">Release to add this document</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDocuments;
