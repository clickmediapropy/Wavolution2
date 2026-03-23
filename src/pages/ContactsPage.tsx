import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, Plus, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { ContactTable } from "@/components/ContactTable";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

export function ContactsPage() {
  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Queries
  const paginatedContacts = usePaginatedQuery(
    api.contacts.list,
    {},
    { initialNumItems: 20 },
  );
  const searchResults = useQuery(
    api.contacts.search,
    debouncedSearch ? { term: debouncedSearch } : "skip",
  );

  // Mutations
  const addContact = useMutation(api.contacts.add);
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);
  const removeMultiple = useMutation(api.contacts.removeMultiple);

  // Dialog state — unified for add/edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [dialogError, setDialogError] = useState("");
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine which contacts to show
  const isSearching = debouncedSearch.length > 0;
  const displayContacts = isSearching
    ? searchResults ?? []
    : paginatedContacts.results;

  // Handlers
  const handleFormSubmit = useCallback(
    async (data: { id?: string; phone: string; name: string }) => {
      setDialogError("");
      setDialogSubmitting(true);
      try {
        if (data.id) {
          await updateContact({
            id: data.id as any,
            phone: data.phone,
            name: data.name || undefined,
          });
          toast.success("Contact updated");
        } else {
          await addContact({
            phone: data.phone,
            name: data.name || undefined,
          });
          toast.success("Contact added");
        }
        setDialogOpen(false);
        setEditingContact(null);
      } catch (err) {
        setDialogError(
          err instanceof Error ? err.message : "Failed to save contact",
        );
      } finally {
        setDialogSubmitting(false);
      }
    },
    [addContact, updateContact],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingIds([id]);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleDeleteSelected = useCallback((ids: string[]) => {
    setDeletingIds(ids);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (deletingIds.length === 1) {
        await removeContact({ id: deletingIds[0] as any });
      } else {
        await removeMultiple({ ids: deletingIds as any });
      }
      toast.success(
        `Deleted ${deletingIds.length} contact${deletingIds.length > 1 ? "s" : ""}`,
      );
      setDeleteDialogOpen(false);
      setDeletingIds([]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete contacts",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deletingIds, removeContact, removeMultiple]);

  const openEdit = useCallback((contact: any) => {
    setEditingContact(contact);
    setDialogError("");
    setDialogOpen(true);
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Contacts</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/contacts/upload"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            aria-label="Upload CSV"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Link>
          <button
            onClick={() => {
              setEditingContact(null);
              setDialogError("");
              setDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
            aria-label="Add Contact"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search contacts by name..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Table */}
      <ContactTable
        contacts={displayContacts as any}
        canLoadMore={!isSearching && paginatedContacts.status === "CanLoadMore"}
        isLoadingMore={paginatedContacts.isLoading}
        onLoadMore={() => paginatedContacts.loadMore(20)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Dialogs */}
      <ContactFormDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingContact(null);
        }}
        onSubmit={handleFormSubmit}
        error={dialogError}
        isSubmitting={dialogSubmitting}
        contact={editingContact}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        count={deletingIds.length}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingIds([]);
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
