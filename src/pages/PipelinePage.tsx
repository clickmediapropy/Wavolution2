import { useState, useCallback, DragEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getFullName } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Kanban,
  Plus,
  Trash2,
  GripVertical,
  User,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import { Link } from "react-router-dom";

function EngagementBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const barColor =
    score >= 75
      ? "bg-blue-500"
      : score >= 50
        ? "bg-emerald-500"
        : score >= 25
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5 min-w-[3.5rem]">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-500 tabular-nums">{score}</span>
    </div>
  );
}

function ContactCard({
  contact,
  onDragStart,
}: {
  contact: {
    _id: Id<"contacts">;
    phone: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
    engagementScore?: number;
  };
  onDragStart: (e: DragEvent<HTMLDivElement>, contactId: Id<"contacts">) => void;
}) {
  const name = getFullName(contact);
  return (
    <Link to={`/contacts/${contact._id}`}>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, contact._id)}
        className="bg-zinc-800/80 border border-zinc-700/50 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-zinc-600 transition-colors group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {name || contact.phone}
              </p>
              {name && (
                <p className="text-xs text-zinc-500 truncate">{contact.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <EngagementBadge score={contact.engagementScore} />
            <GripVertical className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-[10px] text-zinc-500">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function StageColumn({
  stageId,
  stageName,
  stageColor,
  contacts,
  onDragStart,
  onDrop,
  onDragOver,
  onDeleteStage,
  isDragOver,
}: {
  stageId: string;
  stageName: string;
  stageColor: string;
  contacts: Array<{
    _id: Id<"contacts">;
    phone: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
    engagementScore?: number;
  }>;
  onDragStart: (e: DragEvent<HTMLDivElement>, contactId: Id<"contacts">) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, stageId: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, stageId: string) => void;
  onDeleteStage?: (stageId: Id<"pipelineStages">) => void;
  isDragOver: boolean;
}) {
  return (
    <div
      onDrop={(e) => onDrop(e, stageId)}
      onDragOver={(e) => onDragOver(e, stageId)}
      className={cn(
        "flex-shrink-0 w-72 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col max-h-[calc(100vh-200px)]",
        isDragOver && "border-emerald-500/50 bg-emerald-500/5",
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stageColor }}
          />
          <h3 className="text-sm font-medium text-zinc-100">{stageName}</h3>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
        {onDeleteStage && (
          <button
            onClick={() => onDeleteStage(stageId as Id<"pipelineStages">)}
            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {contacts.map((contact) => (
          <ContactCard
            key={contact._id}
            contact={contact}
            onDragStart={onDragStart}
          />
        ))}
        {contacts.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs">
            Drop contacts here
          </div>
        )}
      </div>
    </div>
  );
}

function CreateStageDialog({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");

  const colors = [
    "#6b7280",
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          New Pipeline Stage
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Stage name..."
          className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none mb-3"
          autoFocus
        />
        <div className="flex gap-2 mb-4">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all",
                color === c ? "border-white scale-110" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSubmit(name.trim(), color);
                setName("");
                setColor("#6b7280");
              }
            }}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export function PipelinePage() {
  const stages = useQuery(api.pipeline.listStages);
  const allContacts = useQuery(api.contacts.exportAll);

  const createStage = useMutation(api.pipeline.createStage);
  const deleteStage = useMutation(api.pipeline.deleteStage);
  const moveContact = useMutation(api.pipeline.moveContact);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Group contacts by stage
  const contactsByStageMap = new Map<string, typeof groupedContacts>();

  type ContactItem = {
    _id: Id<"contacts">;
    phone: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
    engagementScore?: number;
    pipelineStageId?: Id<"pipelineStages">;
  };

  const groupedContacts: ContactItem[] = (allContacts ?? []).map((c) => ({
    _id: c._id,
    phone: c.phone,
    firstName: c.firstName,
    lastName: c.lastName,
    tags: c.tags,
    engagementScore: c.engagementScore,
    pipelineStageId: c.pipelineStageId,
  }));

  // Build map
  if (stages) {
    for (const stage of stages) {
      contactsByStageMap.set(
        stage._id,
        groupedContacts.filter((c) => c.pipelineStageId === stage._id),
      );
    }
  }
  const unassigned = groupedContacts.filter((c) => !c.pipelineStageId);

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, contactId: Id<"contacts">) => {
      e.dataTransfer.setData("text/plain", contactId);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, stageId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverStage(stageId);
    },
    [],
  );

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>, stageId: string) => {
      e.preventDefault();
      setDragOverStage(null);
      const contactId = e.dataTransfer.getData("text/plain") as Id<"contacts">;
      if (!contactId) return;

      try {
        await moveContact({
          contactId,
          stageId:
            stageId === "unassigned"
              ? undefined
              : (stageId as Id<"pipelineStages">),
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to move contact",
        );
      }
    },
    [moveContact],
  );

  const handleCreateStage = useCallback(
    async (name: string, color: string) => {
      try {
        const position = stages ? stages.length : 0;
        await createStage({ name, color, position });
        setShowCreateDialog(false);
        toast.success(`Stage "${name}" created`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create stage",
        );
      }
    },
    [createStage, stages],
  );

  const handleDeleteStage = useCallback(
    async (stageId: Id<"pipelineStages">) => {
      try {
        await deleteStage({ id: stageId });
        toast.success("Stage deleted");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete stage",
        );
      }
    },
    [deleteStage],
  );

  const isLoading = stages === undefined || allContacts === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (stages.length === 0) {
    return (
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Kanban className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Pipeline</h1>
            <p className="text-small text-zinc-500">
              Manage your contacts through pipeline stages.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItemVariants}
          className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl"
        >
          <div className="p-4 bg-zinc-800 rounded-full mb-4">
            <Kanban className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-zinc-100 mb-2">
            No pipeline stages yet
          </h3>
          <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
            Create your first stage to start organizing contacts through your
            sales pipeline.
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create first stage
          </button>
        </motion.div>

        <CreateStageDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateStage}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-4 p-4 md:p-6"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Kanban className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Pipeline</h1>
            <p className="text-small text-zinc-500">
              {groupedContacts.length} contacts across {stages.length} stages
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stage
        </button>
      </motion.div>

      {/* Kanban board */}
      <motion.div
        variants={staggerItemVariants}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
      >
        {/* Unassigned column */}
        <StageColumn
          stageId="unassigned"
          stageName="Unassigned"
          stageColor="#6b7280"
          contacts={unassigned}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          isDragOver={dragOverStage === "unassigned"}
        />

        {/* Stage columns */}
        {stages.map((stage) => (
          <StageColumn
            key={stage._id}
            stageId={stage._id}
            stageName={stage.name}
            stageColor={stage.color ?? "#6b7280"}
            contacts={contactsByStageMap.get(stage._id) ?? []}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDeleteStage={handleDeleteStage}
            isDragOver={dragOverStage === stage._id}
          />
        ))}
      </motion.div>

      <CreateStageDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateStage}
      />
    </motion.div>
  );
}
