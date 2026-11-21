import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category, Gender } from '../../types';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Image as ImageIcon,
  Save,
  Loader2,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../../lib/currency';

const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'shirt', label: 'Shirts' },
  { id: 'pants', label: 'Pants' },
  { id: 'basic-tops', label: 'Basic Tops' },
  { id: 'sets', label: 'Sets' },
  { id: 'sweatshirts', label: 'Sweatshirts' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'jackets', label: 'Jackets' },
];

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    status: 'none' as 'sale' | 'sold' | 'new' | 'none',
    category: 'shirt' as Category,
    gender: 'unisex' as Gender,
    images: [] as string[],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [] as { name: string; hex: string; image: string }[],
  });

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetColorIndex?: number
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);

      if (typeof targetColorIndex === 'number') {
        const newColors = [...formData.colors];
        newColors[targetColorIndex].image = urls[0];
        setFormData((prev) => ({ ...prev, colors: newColors }));
      } else {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...urls].slice(0, 5),
        }));
      }
      showToast('Image uploaded.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setProducts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      console.error(error);
      showToast('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      showToast('Please add at least one image.', 'error');
      return;
    }

    if (formData.sizes.length === 0) {
      showToast('Please select at least one size.', 'error');
      return;
    }

    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('Please enter a valid price greater than 0.', 'error');
      return;
    }

    const parsedOriginalPrice = formData.originalPrice ? parseFloat(formData.originalPrice) : null;
    if (parsedOriginalPrice !== null && (isNaN(parsedOriginalPrice) || parsedOriginalPrice < 0)) {
      showToast('Please enter a valid old price.', 'error');
      return;
    }

    const data = {
      ...formData,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      images: formData.images.filter((img) => img.trim() !== ''),
      updatedAt: serverTimestamp(),
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        showToast('Piece updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        showToast('Piece cataloged successfully.', 'success');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast('Action failed. Check permissions or input values.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      status: 'none',
      category: 'shirt',
      gender: 'unisex',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [],
    });
    setManualImageUrl('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setConfirmDeleteId(null);
      showToast('Piece removed from archive.', 'success');
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast('Delete failed. Unauthorized.', 'error');
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      status: product.status || 'none',
      category: product.category,
      gender: product.gender,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors || [],
    });
    setManualImageUrl('');
    setIsFormOpen(true);
  };

  const moveImageAsCover = (idx: number) => {
    if (idx === 0) return;
    setFormData((prev) => {
      const next = [...prev.images];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return { ...prev, images: next };
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.gender.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/80 border border-white/10 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-tight">
            Collection Inventory
          </h2>
          <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest tabular-nums">
            {filteredProducts.length} of {products.length} Items
          </p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setEditingProduct(null);
            resetForm();
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-white text-black font-mono text-xs uppercase font-bold tracking-widest rounded-xl hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Piece</span>
        </button>
      </header>

      {/* Search & Category Filter Bar */}
      <section className="bg-neutral-900/50 border border-white/10 p-4 md:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, category..."
              className="w-full pl-10 pr-9 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all whitespace-nowrap',
              categoryFilter === 'all'
                ? 'bg-white text-black border-white font-bold'
                : 'border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
            )}
          >
            All ({products.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all whitespace-nowrap',
                  categoryFilter === cat.id
                    ? 'bg-white text-black border-white font-bold'
                    : 'border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
                )}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-neutral-950 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl custom-scrollbar">
            <header className="sticky top-0 bg-neutral-950/90 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center z-10">
              <h3 className="text-lg md:text-xl font-display uppercase">
                {editingProduct ? 'Update Piece' : 'Catalogue New Piece'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                {/* Left Side: Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Name
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Current Price (EG)
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="any"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm tabular-nums"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Old Price (EG) - Optional
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.originalPrice}
                        onChange={(e) =>
                          setFormData({ ...formData, originalPrice: e.target.value })
                        }
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm tabular-nums"
                        placeholder="For strikethrough"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Status Badge
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm"
                      >
                        <option value="none">None</option>
                        <option value="sale">Sale</option>
                        <option value="sold">Sold Out</option>
                        <option value="new">New Entry</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value as Category })
                        }
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-sm"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Gender
                    </label>
                    <div className="flex gap-3">
                      {['man', 'woman', 'unisex'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: g as Gender })}
                          className={cn(
                            'flex-1 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all',
                            formData.gender === g
                              ? 'bg-white text-black border-white font-bold'
                              : 'border-white/10 text-neutral-400 hover:border-white/30'
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Assets & Options */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Images ({formData.images.length}/5)
                      </label>
                      <span className="text-[9px] font-mono text-neutral-500">
                        First image is cover
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {formData.images.map((img, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'relative aspect-square group rounded-xl overflow-hidden border bg-neutral-900',
                            idx === 0 ? 'border-white' : 'border-white/10'
                          )}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 text-white text-[8px] font-mono uppercase rounded">
                              Cover
                            </span>
                          )}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImageAsCover(idx)}
                              title="Make Cover Image"
                              className="absolute bottom-1 left-1 p-1 bg-black/75 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }))
                            }
                            aria-label="Remove image"
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {formData.images.length < 5 && (
                        <div className="relative aspect-square">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                          />
                          <div
                            className={cn(
                              'w-full h-full border border-dashed border-white/15 hover:border-white/40 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-white bg-neutral-900/50',
                              uploading && 'animate-pulse'
                            )}
                          >
                            {uploading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <ImageIcon className="w-6 h-6" />
                            )}
                            <span className="text-[9px] font-mono uppercase tracking-widest">
                              {uploading ? 'Uploading' : 'Upload'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                        Or add image URL manually
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={manualImageUrl}
                          onChange={(e) => setManualImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 focus:border-white transition-colors outline-none font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualImageUrl.trim() && formData.images.length < 5) {
                              setFormData((prev) => ({
                                ...prev,
                                images: [...prev.images, manualImageUrl.trim()],
                              }));
                              setManualImageUrl('');
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white hover:text-black transition-colors text-[10px] font-mono uppercase tracking-widest font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Available Sizes
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const newSizes = formData.sizes.includes(size)
                              ? formData.sizes.filter((s) => s !== size)
                              : [...formData.sizes, size];
                            setFormData({ ...formData, sizes: newSizes });
                          }}
                          className={cn(
                            'py-2.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all',
                            formData.sizes.includes(size)
                              ? 'bg-white text-black border-white font-bold'
                              : 'border-white/10 text-neutral-400 hover:border-white/30'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Section */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Color Variants ({formData.colors.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            colors: [...formData.colors, { name: '', hex: '#000000', image: '' }],
                          })
                        }
                        className="text-[10px] font-mono uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition-colors"
                      >
                        + Add Variant
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-3"
                        >
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[9px] font-mono uppercase text-neutral-400">
                                Color Name
                              </label>
                              <input
                                value={color.name}
                                onChange={(e) => {
                                  const newColors = [...formData.colors];
                                  newColors[idx].name = e.target.value;
                                  setFormData({ ...formData, colors: newColors });
                                }}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono outline-none focus:border-white"
                                placeholder="Black, Crimson, etc"
                              />
                            </div>
                            <div className="w-16 space-y-1.5">
                              <label className="text-[9px] font-mono uppercase text-neutral-400">
                                HEX
                              </label>
                              <input
                                type="color"
                                value={color.hex}
                                onChange={(e) => {
                                  const newColors = [...formData.colors];
                                  newColors[idx].hex = e.target.value;
                                  setFormData({ ...formData, colors: newColors });
                                }}
                                className="w-full h-9 bg-black/50 border border-white/10 rounded-lg p-1 outline-none cursor-pointer"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = formData.colors.filter((_, i) => i !== idx);
                                setFormData({ ...formData, colors: newColors });
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-black border border-white/10 rounded-lg overflow-hidden flex-shrink-0">
                              {color.image ? (
                                <img src={color.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, idx)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                              />
                              <div className="w-full py-2 rounded-lg border border-dashed border-white/15 text-[9px] font-mono uppercase tracking-widest text-center hover:border-white/40 transition-colors text-neutral-300">
                                {uploading ? 'Uploading...' : 'Upload Color Image'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 font-mono text-xs uppercase font-bold tracking-widest hover:border-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-8 py-3 rounded-xl bg-white text-black font-mono text-xs uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-24 text-center space-y-3 bg-neutral-900/40 rounded-2xl border border-white/5">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mx-auto" />
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              Scanning inventory...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-neutral-900/40 rounded-2xl border border-dashed border-white/10 p-8">
            <p className="font-display uppercase text-lg text-white">No Products Found</p>
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              {products.length === 0
                ? 'Start by adding your first piece to the catalog.'
                : 'No pieces match your current filter or search.'}
            </p>
            {(searchQuery || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-widest rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center group transition-colors hover:border-white/25"
            >
              <div className="w-full sm:w-24 h-44 sm:h-32 bg-black border border-white/10 flex-shrink-0 overflow-hidden rounded-xl">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-2.5 min-w-0 w-full">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base md:text-lg font-display uppercase truncate text-white">
                        {product.name}
                      </h4>
                      {product.status && product.status !== 'none' && (
                        <span
                          className={cn(
                            'text-[9px] font-mono uppercase tracking-widest font-bold shrink-0',
                            product.status === 'sold'
                              ? 'text-red-400'
                              : product.status === 'sale'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          )}
                        >
                          · {product.status === 'sold' ? 'Sold Out' : product.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                      {product.category} / {product.gender}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base md:text-lg font-mono font-bold tabular-nums text-white">
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-[10px] font-mono text-neutral-500 line-through tabular-nums">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <span
                      key={s}
                      className="text-[9px] font-mono px-2 py-0.5 bg-white/5 text-neutral-300 border border-white/10 rounded uppercase"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:p-3 bg-white/5 hover:bg-white hover:text-black border border-white/10 transition-all rounded-xl flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest"
                  title="Edit Piece"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="sm:hidden">Edit</span>
                </button>

                {confirmDeleteId === product.id ? (
                  <div className="flex gap-1.5 flex-1 sm:flex-none">
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 rounded-xl text-[10px] font-mono"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(product.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:p-3 bg-red-500/10 hover:bg-red-500 border border-red-500/20 transition-all rounded-xl text-red-400 hover:text-white flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest"
                    title="Delete Piece"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[999] max-w-sm w-full bg-neutral-900 border border-white/15 px-5 py-4 flex items-center justify-between gap-4 shadow-2xl rounded-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-200">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-neutral-500 hover:text-white text-xs font-mono"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
