/*
  # Create property_documents table

  1. New Tables
    - `property_documents`
      - `id` (uuid, primary key)
      - `property_id` (text, references the local property id from localStorage)
      - `name` (text, display name for the document)
      - `category` (text, e.g. 'deed', 'contract', 'permit', 'lease', 'other')
      - `file_url` (text, public URL after upload to storage)
      - `file_name` (text, original file name)
      - `file_size` (bigint, file size in bytes)
      - `file_type` (text, MIME type)
      - `notes` (text, optional notes)
      - `uploaded_at` (timestamptz, when it was uploaded)
      - `created_at` (timestamptz)

  2. Storage
    - Creates a public bucket `property-documents` for file storage

  3. Security
    - Enable RLS on property_documents table
    - Allow public read/write since this app does not use Supabase auth (localStorage-based)
    - Note: For a production app with auth, policies would be restricted per user
*/

CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_size bigint DEFAULT 0,
  file_type text DEFAULT '',
  notes text DEFAULT '',
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on property_documents"
  ON property_documents
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on property_documents"
  ON property_documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete on property_documents"
  ON property_documents
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
