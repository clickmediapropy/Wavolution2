import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, Plus, Upload, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { ContactTable } from "@/components/ContactTable";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

const statusFilters = ["all", "pending", "sent", "failed"] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusConfig: Record<string, { bg: string; text: string; activeBg: string }> = {
  pending: { bg: "border-amber-500/30 text-amber-400", text: "text-amber-400", activeBg: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
  sent: { bg: "border-emerald-500/30 text-emerald-400", text: "text-emerald-400", activeBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" },
  failed: { bg: "border-red-500/30 text-red-400", text: "text-red-400", activeBg: "bg-red-500/20 border-red-500/50 text-red-400" },
};

export function ContactsPage() {
  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Queries
  const allContacts = useQuery(api.contacts.exportAll);
  const totalCount = useQuery(api.contacts.count);
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

  // Determine which contacts to show, with optional status filter
  const isSearching = debouncedSearch.length > 0;
  const displayContacts = isSearching
    ? searchResults ?? []
    : paginatedContacts.results;
  const filteredContacts = useMemo(
    () =>
      statusFilter === "all"
        ? displayContacts
        : displayContacts.filter((c: any) => c.status === statusFilter),
    [displayContacts, statusFilter],
  );

  // Handlers
  const handleFormSubmit = useCallback(
    async (data: { id?: string; phone: string; firstName: string; lastName: string }) => {
      setDialogError("");
      setDialogSubmitting(true);
      try {
        if (data.id) {
          await updateContact({
            id: data.id as any,
            phone: data.phone,
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
          });
          toast.success("Contact updated");
        } else {
          await addContact({
            phone: data.phone,
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
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

  const handleExport = useCallback(() => {
    if (!allContacts || allContacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }
    const header = "name,last_name,phone,status";
    const rows = allContacts.map((c) => {
      const first = c.firstName || "";
      const last = c.lastName || "";
      return `"${first.replace(/"/g, '""')}","${last.replace(/"/g, '""')}","${c.phone}","${c.status}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${allContacts.length} contacts`);
  }, [allContacts]);

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
          <span className="px-2.5 py-0.5 text-sm font-medium bg-emerald-500/10 text-emerald-400 rounded-full">
            {totalCount ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={!allContacts || allContacts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
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

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4" role="group" aria-label="Filter by status">
        {statusFilters.map((filter) => {
          const isActive = statusFilter === filter;
          const isAll = filter === "all";
          const chipClass = isActive
            ? isAll
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
              : statusConfig[filter]?.activeBg ?? ""
            : "bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800";
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${chipClass}`}
              aria-pressed={isActive}
            >
              {filter}
            </button>
          );
        })}
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
        contacts={filteredContacts as any}
        canLoadMore={!isSearching && paginatedContacts.status === "CanLoadMore"}
        isLoadingMore={paginatedContacts.isLoading}
        onLoadMore={() => paginatedContacts.loadMore(20)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onDeleteSelected={handleDeleteSelected}
        totalCount={totalCount ?? undefined}
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
