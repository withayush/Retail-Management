import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, Edit3 } from "lucide-react";
import {
  getProducts,
  getProductCategories,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  createCategory,
} from "../../services/product.api";
import { emptyForm } from "./utils/product.utils";
import ProductHeader from "./components/ProductHeader";
import ProductStats from "./components/ProductStats";
import ProductFilters from "./components/ProductFilters";
import ProductTable from "./components/ProductTable";
import ProductForm from "./components/ProductForm";
import ProductModal from "./components/ProductModal";
import ArchiveProductModal from "./components/ArchiveProductModal";

export default function ProductsPage() {
  const navigate = useNavigate();
  const businessId = localStorage.getItem("businessId");
  const isFirst = useRef(true);

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 12;

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ALL | ACTIVE | ARCHIVED
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("created"); // created | name | price | margin
  const [sortDir, setSortDir] = useState("DESC");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState(emptyForm);

  // Stats derived
  const activeCount = products.filter(
    (p) => (p.isActive ?? p.is_active ?? true) && !p.isArchived
  ).length;

  const avgMargin =
    products.length > 0
      ? (
          products.reduce((acc, p) => {
            const cost = parseFloat(p.costPrice ?? p.cost_price ?? 0);
            const sell = parseFloat(p.sellingPrice ?? p.selling_price ?? 0);
            if (sell <= 0) return acc;
            return acc + ((sell - cost) / sell) * 100;
          }, 0) / products.length
        ).toFixed(1)
      : "0.0";

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getProductCategories();
      const catList = res.data?.categories || res.data || [];
      setCategories(catList);
      return catList;
    } catch (err) {
      console.error("Failed to load categories:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Fetch Products ──
  const fetchProducts = useCallback(
    async (pg = 1) => {
      setLoading(true);
      try {
        const queryParams = {
          limit: LIMIT,
          search: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
        };

        if (statusFilter === "ARCHIVED") {
          queryParams.status = "archived";
          queryParams.isArchived = true;
        } else if (statusFilter === "ALL") {
          queryParams.status = "all";
        } else {
          queryParams.status = "active";
          queryParams.isArchived = false;
        }

        const res = await getProducts(queryParams);
        const fetched = res.data?.products || res.data || [];
        const pagination = res.pagination || res.data?.pagination || {};

        setProducts(fetched);
        setTotalPages(pagination.totalPages || (fetched.length < LIMIT ? 1 : Math.max(1, pg)));
        setTotalItems(pagination.totalItems || fetched.length);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, selectedCategory]
  );

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (page === 1) fetchProducts(1);
      else setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter, selectedCategory, sortBy, sortDir, page, fetchProducts]);

  // ── Helper: Resolve or Create Category ──
  const resolveCategoryId = async (catName, existingCats) => {
    const trimmed = (catName || "").trim();
    if (!trimmed) {
      // Find or create default General category
      const genCat = existingCats.find(
        (c) => c.name.toLowerCase() === "general" || c.name.toLowerCase() === "uncategorized"
      );
      if (genCat) return genCat.id || genCat._id;
      try {
        const newCatRes = await createCategory({ name: "General", description: "General products" });
        const createdCat = newCatRes.data;
        setCategories((prev) => [createdCat, ...prev]);
        return createdCat.id || createdCat._id;
      } catch (e) {
        console.error("Auto category creation failed:", e);
      }
    }

    // Match case-insensitively
    const match = existingCats.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() || (c.id || c._id) === trimmed
    );
    if (match) return match.id || match._id;

    // Create new category on the fly
    try {
      const newCatRes = await createCategory({ name: trimmed });
      const createdCat = newCatRes.data;
      setCategories((prev) => [createdCat, ...prev]);
      return createdCat.id || createdCat._id;
    } catch (err) {
      console.error("Category auto-creation failed:", err);
      // If error is duplicate, fetch again
      const refreshed = await fetchCategories();
      const refMatch = refreshed.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (refMatch) return refMatch.id || refMatch._id;
      throw new Error("Could not assign or create category");
    }
  };

  // ── Add Product ──
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sellingPrice) {
      return toast.error("Product name and selling price are required");
    }

    setSubmitting(true);
    try {
      const categoryId = await resolveCategoryId(form.categoryName, categories);

      let finalSku = form.sku.trim();
      if (!finalSku) {
        const prefix = form.name.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "") || "SKU";
        finalSku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const payload = {
        name: form.name.trim(),
        sku: finalSku.toUpperCase(),
        barcode: form.barcode.trim() || null,
        categoryId: categoryId,
        sellingPrice: parseFloat(form.sellingPrice),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
        unit: form.unit.trim() || "pcs",
      };

      if (form.openingStock !== "" && form.openingStock !== null) {
        const openingQty = parseFloat(form.openingStock);
        if (!isNaN(openingQty) && openingQty >= 0) {
          payload.openingStock = openingQty;
          payload.openingStockNotes = form.openingStockNotes.trim() || null;
        }
      }

      await createProduct(payload);

      toast.success("Product created successfully!");
      setShowAdd(false);
      setForm(emptyForm);
      setPage(1);
      fetchProducts(1);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit Product ──
  const openEdit = (product) => {
    setEditTarget(product);
    const catName = product.category?.name || product.category_name || "";
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      categoryName: catName,
      sellingPrice: (product.sellingPrice ?? product.selling_price ?? "").toString(),
      costPrice: (product.costPrice ?? product.cost_price ?? "").toString(),
      unit: product.unit || "pcs",
      openingStock: "",
      openingStockNotes: "",
    });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sellingPrice) {
      return toast.error("Name and selling price are required");
    }

    setSubmitting(true);
    try {
      const categoryId = await resolveCategoryId(form.categoryName, categories);
      const targetId = editTarget.id || editTarget._id;

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() ? form.sku.trim().toUpperCase() : undefined,
        barcode: form.barcode.trim() || null,
        categoryId: categoryId,
        sellingPrice: parseFloat(form.sellingPrice),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
        unit: form.unit.trim() || "pcs",
      };

      await updateProduct(targetId, payload);
      toast.success("Product updated successfully!");
      setShowEdit(false);
      setEditTarget(null);
      setForm(emptyForm);
      fetchProducts(page);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Archive ──
  const confirmArchive = (product) => {
    setArchiveTarget(product);
    setShowArchiveConfirm(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setSubmitting(true);
    try {
      const targetId = archiveTarget.id || archiveTarget._id;
      await archiveProduct(targetId);
      toast.success("Product archived (historical invoices preserved)");
      setShowArchiveConfirm(false);
      setArchiveTarget(null);
      fetchProducts(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to archive product");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Restore ──
  const handleRestore = async (product) => {
    try {
      const targetId = product.id || product._id;
      await restoreProduct(targetId);
      toast.success("Product restored to active catalog!");
      fetchProducts(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to restore product");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <ProductHeader
        onNavigateDashboard={() => navigate("/dashboard")}
        onOpenAddModal={() => {
          setForm(emptyForm);
          setShowAdd(true);
        }}
      />

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <ProductStats
        totalItems={totalItems}
        loading={loading}
        activeCount={activeCount}
        categoriesCount={categories.length}
        avgMargin={avgMargin}
      />

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        onClearSearch={() => setSearch("")}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(sb, sd) => {
          setSortBy(sb);
          setSortDir(sd);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => fetchProducts(page)}
        loading={loading}
        onResetFilters={() => {
          setSearch("");
          setSelectedCategory("");
          setStatusFilter("ACTIVE");
        }}
      />

      {/* ── Product Table ────────────────────────────────────────────────────── */}
      <ProductTable
        products={products}
        loading={loading}
        search={search}
        selectedCategory={selectedCategory}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        onEdit={openEdit}
        onArchive={confirmArchive}
        onRestore={handleRestore}
      />

      {/* ── Add Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <ProductModal
            open={showAdd}
            onClose={() => {
              setShowAdd(false);
              setForm(emptyForm);
            }}
            title="Add New Product"
            icon={Plus}
          >
            <ProductForm
              form={form}
              setForm={setForm}
              categories={categories}
              onSubmit={handleAdd}
              submitLabel="Save Product"
              submitting={submitting}
              isEdit={false}
              onCancel={() => {
                setShowAdd(false);
                setForm(emptyForm);
              }}
            />
          </ProductModal>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit && (
          <ProductModal
            open={showEdit}
            onClose={() => {
              setShowEdit(false);
              setForm(emptyForm);
            }}
            title={`Edit: ${editTarget?.name}`}
            icon={Edit3}
          >
            <ProductForm
              form={form}
              setForm={setForm}
              categories={categories}
              onSubmit={handleEdit}
              submitLabel="Save Changes"
              submitting={submitting}
              isEdit={true}
              onCancel={() => {
                setShowEdit(false);
                setForm(emptyForm);
              }}
            />
          </ProductModal>
        )}
      </AnimatePresence>

      {/* ── Archive Confirmation Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <ArchiveProductModal
            open={showArchiveConfirm}
            onClose={() => setShowArchiveConfirm(false)}
            archiveTarget={archiveTarget}
            onArchive={handleArchive}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
