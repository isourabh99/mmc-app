"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  FileImage,
  FolderOpen,
} from "lucide-react";
import {
  fetchDocumentTypes,
  fetchMyDocuments,
  uploadCustomerDocument,
  deleteCustomerDocument,
  CustomerDocumentItem,
  CustomerDocumentTypeItem,
} from "@/lib/service/customer-vehicle-document.api";
import { useToast } from "@/components/ToastProvider";

export const DocumentsTab: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<CustomerDocumentItem[]>([]);
  const [docTypes, setDocTypes] = useState<CustomerDocumentTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("1");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Deleting document ID
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, types] = await Promise.all([
        fetchMyDocuments().catch(() => []),
        fetchDocumentTypes().catch(() => []),
      ]);
      setDocuments(docs || []);
      setDocTypes(types || []);
      if (types && types.length > 0) {
        setSelectedTypeId(String(types[0].id));
      }
    } catch (err) {
      console.error("Could not load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUploadModal = (typeId?: string | number) => {
    if (typeId) {
      setSelectedTypeId(String(typeId));
    } else if (docTypes.length > 0) {
      setSelectedTypeId(String(docTypes[0].id));
    }
    setCustomTitle("");
    setSelectedFile(null);
    setFilePreview(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Please choose a file to upload", "error");
      return;
    }

    try {
      setUploading(true);
      await uploadCustomerDocument(selectedTypeId, selectedFile, customTitle);
      showToast("Document uploaded successfully!", "success");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to upload document";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string | number) => {
    try {
      setDeletingId(docId);
      await deleteCustomerDocument(docId);
      showToast("Document deleted successfully", "success");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete document", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getFileUrl = (doc: CustomerDocumentItem): string => {
    if (doc.file_full_path && doc.file_full_path.startsWith("http")) {
      return doc.file_full_path;
    }
    if (doc.file) {
      if (doc.file.startsWith("http")) return doc.file;
      return `https://mmcclub.co.uk/backend/storage/app/public/customer/document/${doc.file}`;
    }
    return "#";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14100c] border border-[#33271d] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8AF66]/15 border border-[#E8AF66]/30 flex items-center justify-center text-[#E8AF66] shrink-0 shadow-[0_0_20px_rgba(232,175,102,0.15)]">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                My Documents Vault
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8AF66]/20 text-[#E8AF66] border border-[#E8AF66]/30">
                {documents.length} {documents.length === 1 ? "File" : "Files"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Securely store MOT certificates, vehicle insurance, logbook (V5C), and driving license
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenUploadModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-[#FFF0D4] via-[#FAD293] to-[#CEA46B] shadow-lg shadow-[#FAD293]/15 hover:shadow-[#FAD293]/35 hover:scale-102 active:scale-98 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Recommended Document Categories Quick-Upload Bar */}
      {docTypes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {docTypes.map((type) => {
            const hasUploaded = documents.some(
              (d) => String(d.document_type_id) === String(type.id)
            );
            return (
              <div
                key={type.id}
                onClick={() => handleOpenUploadModal(type.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  hasUploaded
                    ? "bg-[#141518] border-emerald-500/30 hover:border-emerald-500"
                    : "bg-[#14100c] border-[#33271d] hover:border-[#E8AF66]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-[#E8AF66]">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  {hasUploaded ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#E8AF66] hover:underline">
                      + Add
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white truncate">
                  {type.name || type.title || "Document"}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {type.description || "Secure PDF or Image"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Document List Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#14100c] border border-[#33271d] rounded-3xl">
          <Loader2 className="w-8 h-8 text-[#E8AF66] animate-spin" />
          <p className="text-xs text-zinc-400">Loading your document vault...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#14100c] border border-[#33271d] rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
            <FolderOpen className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No documents uploaded yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Keep your essential driving license, MOT certificates, and vehicle insurance handy in one encrypted place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenUploadModal()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-black bg-[#FAD293] hover:bg-[#ffe0a8] shadow-lg transition cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Your First Document</span>
          </button>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => {
            const isDeleting = deletingId === doc.id;
            const fileUrl = getFileUrl(doc);
            const matchedType = docTypes.find(
              (t) => String(t.id) === String(doc.document_type_id)
            );
            const typeLabel =
              matchedType?.name || matchedType?.title || doc.type_name || "Document";

            const isPdf =
              (doc.file && doc.file.toLowerCase().endsWith(".pdf")) ||
              (doc.file_full_path && doc.file_full_path.toLowerCase().endsWith(".pdf"));

            return (
              <div
                key={doc.id || idx}
                className="group relative flex flex-col justify-between p-4 sm:p-5 bg-[#16120e] border border-[#33271d] hover:border-[#E8AF66]/40 rounded-2xl shadow-lg transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#E8AF66] shrink-0">
                        {isPdf ? <FileText className="w-5 h-5 text-red-400" /> : <FileImage className="w-5 h-5 text-[#E8AF66]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8AF66]/15 text-[#E8AF66] mb-0.5">
                          {typeLabel}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {doc.title || doc.file?.split("/").pop() || "Uploaded File"}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      title="Delete document"
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {doc.created_at && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* View / Download Action */}
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Protected</span>
                  </span>

                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E8AF66] hover:underline"
                  >
                    <span>View File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#14100c] border border-[#33271d] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8AF66]/15 border border-[#E8AF66]/30 flex items-center justify-center text-[#E8AF66]">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Upload Document</h3>
                  <p className="text-[11px] text-zinc-400">
                    Add MOT, Insurance or Driving License
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Document Type Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Document Type <span className="text-[#E8AF66]">*</span>
                </label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition cursor-pointer"
                >
                  {docTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.name || type.title || `Document Type #${type.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Custom Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Reference Title (Optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. 2026 MOT Certificate or Policy 9928"
                  className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                />
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Select File <span className="text-[#E8AF66]">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-[#E8AF66]/60 rounded-2xl p-5 text-center cursor-pointer transition bg-[#1b1510]/50 space-y-1.5"
                >
                  <Upload className="w-5 h-5 text-[#E8AF66] mx-auto" />
                  <p className="text-xs font-medium text-white">
                    {selectedFile ? selectedFile.name : "Click to select PDF or Image file"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    PDF, PNG, JPG, JPEG up to 15MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {filePreview && (
                  <div className="relative aspect-[16/9] max-h-36 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 mx-auto">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-[#FFF0D4] via-[#FAD293] to-[#CEA46B] shadow-lg shadow-[#FAD293]/15 transition cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload File</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
