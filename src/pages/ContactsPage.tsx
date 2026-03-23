import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, Plus, Upload, Search, Download, Tag, ChevronDown, X } from "lucide-react";
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

  // Tag filter state
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

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
  const bulkAddTag = useMutation(api.contacts.bulkAddTag);
  const bulkRemoveTag = useMutation(api.contacts.bulkRemoveTag);

  // Dialog state — unified for add/edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [dialogError, setDialogError] = useState("");
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk tag management state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addTagPopoverOpen, setAddTagPopoverOpen] = useState(false);
  const [removeTagPopoverOpen, setRemoveTagPopoverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isApplyingTag, setIsApplyingTag] = useState(false);
  const addTagInputRef = useRef<HTMLInputElement>(null);

  // Compute unique tags from all contacts for the filter dropdown
  const uniqueTags = useMemo(() => {
    if (!allContacts) return [];
    const tagSet = new Set<string>();
    for (const c of allContacts) {
      if (c.tags) {
        for (const t of c.tags) tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }, [allContacts]);

  // Determine which contacts to show, with optional status + tag filter
  const isSearching = debouncedSearch.length > 0;
  const displayContacts = isSearching
    ? searchResults ?? []
    : paginatedContacts.results;
  const filteredContacts = useMemo(
    () =>
      displayContacts.filter((c: any) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (tagFilter !== "all" && (!c.tags || !c.tags.includes(tagFilter))) return false;
        return true;
      }),
    [displayContacts, statusFilter, tagFilter],
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
    const header = "phone,firstName,lastName,status,tags,engagementScore,repliedAt";
    const rows = allContacts.map((c) => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const phone = esc(c.phone);
      const firstName = esc(c.firstName || "");
      const lastName = esc(c.lastName || "");
      const status = esc(c.status);
      const tags = esc((c.tags || []).join(";"));
      const engagementScore = c.engagementScore !== undefined ? String(c.engagementScore) : "";
      const repliedAt = c.repliedAt !== undefined ? new Date(c.repliedAt).toISOString() : "";
      return `${phone},${firstName},${lastName},${status},${tags},${engagementScore},${repliedAt}`;
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

  // Bulk tag handlers
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    // Close popovers when selection changes to empty
    if (ids.length === 0) {
      setAddTagPopoverOpen(false);
      setRemoveTagPopoverOpen(false);
    }
  }, []);

  // Compute tags from currently selected contacts
  const selectedContactTags = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const tagSet = new Set<string>();
    const allDisplayed = filteredContacts as any[];
    for (const c of allDisplayed) {
      if (selectedIds.includes(c._id) && c.tags) {
        for (const t of c.tags) tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }, [selectedIds, filteredContacts]);

  const handleBulkAddTag = useCallback(async () => {
    const tag = newTagInput.trim();
    if (!tag || selectedIds.length === 0) return;
    setIsApplyingTag(true);
    try {
      const result = await bulkAddTag({ contactIds: selectedIds as any, tag });
      toast.success(`Tag "${tag}" added to ${result.updated} contact${result.updated !== 1 ? "s" : ""}`);
      setNewTagInput("");
      setAddTagPopoverOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add tag");
    } finally {
      setIsApplyingTag(false);
    }
  }, [newTagInput, selectedIds, bulkAddTag]);

  const handleBulkRemoveTag = useCallback(async (tag: string) => {
    if (selectedIds.length === 0) return;
    setIsApplyingTag(true);
    try {
      const result = await bulkRemoveTag({ contactIds: selectedIds as any, tag });
      toast.success(`Tag "${tag}" removed from ${result.updated} contact${result.updated !== 1 ? "s" : ""}`);
      // Close popover if no more tags left
      const remainingTags = selectedContactTags.filter((t) => t !== tag);
      if (remainingTags.length === 0) setRemoveTagPopoverOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove tag");
    } finally {
      setIsApplyingTag(false);
    }
  }, [selectedIds, bulkRemoveTag, selectedContactTags]);

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

      {/* Filter chips + tag dropdown */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2" role="group" aria-label="Filter by status">
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

        {/* Tag filter dropdown */}
        {uniqueTags.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setTagDropdownOpen((o) => !o)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                tagFilter !== "all"
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
              aria-haspopup="listbox"
              aria-expanded={tagDropdownOpen}
              aria-label="Filter by tag"
            >
              <Tag className="w-3 h-3" />
              {tagFilter === "all" ? "All Tags" : tagFilter}
              <ChevronDown className={`w-3 h-3 transition-transform ${tagDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {tagDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTagDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] max-h-60 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => {
                      setTagFilter("all");
                      setTagDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      tagFilter === "all"
                        ? "text-violet-400 bg-violet-500/10"
                        : "text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    All Tags
                  </button>
                  {uniqueTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setTagFilter(tag);
                        setTagDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        tagFilter === tag
                          ? "text-violet-400 bg-violet-500/10"
                          : "text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
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
        onSelectionChange={handleSelectionChange}
        totalCount={totalCount ?? undefined}
      />

      {/* Floating bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50 animate-fadeIn">
          <span className="text-sm font-medium text-zinc-300">
            {selectedIds.length} selected
          </span>
          <div className="w-px h-5 bg-zinc-700" />

          {/* Add Tag */}
          <div className="relative">
            <button
              onClick={() => {
                setAddTagPopoverOpen((o) => !o);
                setRemoveTagPopoverOpen(false);
                setTimeout(() => addTagInputRef.current?.focus(), 50);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
              aria-label="Add tag to selected contacts"
            >
              <Tag className="w-3.5 h-3.5" />
              Add Tag
            </button>
            {addTagPopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAddTagPopoverOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 z-20 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-3">
                  <p className="text-xs text-zinc-400 mb-2">
                    Add a tag to {selectedIds.length} contact{selectedIds.length !== 1 ? "s" : ""}
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBulkAddTag();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      ref={addTagInputRef}
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Tag name..."
                      className="flex-1 px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                      disabled={isApplyingTag}
                    />
                    <button
                      type="submit"
                      disabled={!newTagInput.trim() || isApplyingTag}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApplyingTag ? "..." : "Add"}
                    </button>
                  </form>
                  {/* Quick-pick from existing tags */}
                  {uniqueTags.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-1.5">Existing tags</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {uniqueTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setNewTagInput(tag);
                              addTagInputRef.current?.focus();
                            }}
                            className="px-2 py-0.5 text-xs text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Remove Tag */}
          <div className="relative">
            <button
              onClick={() => {
                setRemoveTagPopoverOpen((o) => !o);
                setAddTagPopoverOpen(false);
              }}
              disabled={selectedContactTags.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Remove tag from selected contacts"
            >
              <X className="w-3.5 h-3.5" />
              Remove Tag
            </button>
            {removeTagPopoverOpen && selectedContactTags.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRemoveTagPopoverOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 z-20 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-3">
                  <p className="text-xs text-zinc-400 mb-2">
                    Remove a tag from {selectedIds.length} contact{selectedIds.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {selectedContactTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleBulkRemoveTag(tag)}
                        disabled={isApplyingTag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-200 bg-zinc-700 rounded-full hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-zinc-600 transition-colors disabled:opacity-50"
                      >
                        {tag}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
