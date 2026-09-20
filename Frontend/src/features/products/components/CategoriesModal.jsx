import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  AlertCircle,
  Loader2,
  FolderOpen,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/category.api";

export default function CategoriesModal({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
  onSelectCategoryFilter,
}) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [updating, setUpdating] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  // ── 1. Create Category ──
  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      return toast.error("Category name is required");
    }
    if (trimmed.length < 2) {
      return toast.error("Category name must be at least 2 characters");
    }

    setCreating(true);
    try {
      const res = await createCategory({
        name: trimmed,
        description: newDesc.trim() || undefined,
      });

      toast.success(`Category "${trimmed}" created successfully!`);
      setNewName("");
      setNewDesc("");
      setShowAddForm(false);
      await onCategoriesUpdated();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || err?.message || "Failed to create category";
      toast.error(errMsg);
    } finally {
      setCreating(false);
    }
  };

  // ── 2. Start Editing ──
  const startEdit = (cat) => {
    setEditingId(cat.id || cat._id);
    setEditName(cat.name || "");
    setEditDesc(cat.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  };

  // ── 3. Save Edit ──
  const handleUpdate = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      return toast.error("Category name is required");
    }

    setUpdating(true);
    try {
      await updateCategory(id, {
        name: trimmed,
        description: editDesc.trim() || "",
      });

      toast.success("Category updated successfully!");
      setEditingId(null);
      await onCategoriesUpdated();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || err?.message || "Failed to update category";
      toast.error(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  // ── 4. Delete Category ──
  const handleDelete = async (cat) => {
    const catId = cat.id || cat._id;
    if (
      !window.confirm(
        `Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(catId);
    try {
      await deleteCategory(catId);
      toast.success(`Category "${cat.name}" deleted successfully!`);
      await onCategoriesUpdated();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Cannot delete category with active products attached.";
      toast.error(errMsg, { duration: 4000 });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Categories</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {categories.length} total
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organize and group items for POS billing and inventory tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Bar: Search & Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                showAddForm
                  ? "bg-secondary text-foreground border border-border"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> New Category
                </>
              )}
            </button>
          </div>

          {/* New Category Form Collapsible */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-primary" /> Add New Category
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Category Name * (e.g. Dairy, Beverages, Snacks)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional, e.g. Fresh milk & cheese products)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-background border border-border text-foreground hover:bg-secondary rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Save Category
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Categories List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <FolderOpen className="w-10 h-10 mx-auto opacity-40 stroke-1" />
                <p className="text-sm font-medium">No categories found</p>
                <p className="text-xs text-muted-foreground/80">
                  {search
                    ? "Try adjusting your search query."
                    : "Create your first category to start organizing your catalog."}
                </p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const catId = cat.id || cat._id;
                const isEditing = editingId === catId;
                const isDeleting = deletingId === catId;

                if (isEditing) {
                  return (
                    <div
                      key={catId}
                      className="p-3 bg-secondary/50 border border-primary/30 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Category Name"
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 px-2.5 rounded-lg text-xs border border-border bg-background hover:bg-secondary text-foreground cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(catId)}
                          disabled={updating || !editName.trim()}
                          className="inline-flex items-center gap-1 p-1.5 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                        >
                          {updating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={catId}
                    className="group p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {cat.name}
                        </span>
                      </div>
                      {cat.description ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {cat.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 italic mt-0.5">
                          No description provided
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {onSelectCategoryFilter && (
                        <button
                          onClick={() => {
                            onSelectCategoryFilter(catId);
                            onClose();
                          }}
                          title="Filter products by this category"
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(cat)}
                        title="Edit category"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDeleting}
                        title="Delete category"
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-primary" /> Multi-tenant business scoped
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
