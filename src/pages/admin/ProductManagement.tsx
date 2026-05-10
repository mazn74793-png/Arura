import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category, Gender } from '../../types';
import { Plus, Trash2, Edit2, X, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  
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
    colors: [] as { name: string; hex: string; image: string }[]
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetColorIndex?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      
      if (typeof targetColorIndex === 'number') {
        const newColors = [...formData.colors];
        newColors[targetColorIndex].image = urls[0];
        setFormData(prev => ({ ...prev, colors: newColors }));
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...urls].slice(0, 5)
        }));
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset input
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
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      alert('Please add at least one image.');
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      images: formData.images.filter(img => img.trim() !== ''),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        alert('Piece updated successfully.');
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        alert('Piece cataloged successfully.');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Action failed. Please check permissions or data validity.');
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
      colors: []
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this piece?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        alert('Piece removed from archive.');
        fetchProducts();
      } catch (error) {
        console.error(error);
        alert('Delete failed. Unauthorized.');
      }
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
      colors: product.colors || []
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-12 pb-20 md:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-tight">Collection Inventory</h2>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{products.length} Items Listed</p>
        </div>
        <button 
          onClick={() => { setIsFormOpen(true); setEditingProduct(null); resetForm(); }}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 md:py-3 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Piece
        </button>
      </header>

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-neutral-950 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl animate-in fade-in zoom-in duration-300">
            <header className="sticky top-0 bg-neutral-950/80 backdrop-blur-md p-6 md:p-8 border-b border-white/5 flex justify-between items-center z-10">
              <h3 className="text-lg md:text-xl font-display uppercase">{editingProduct ? 'Update Piece' : 'Catalogue New Piece'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 md:w-6 h-6" /></button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                {/* Left Side: Basic Info */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Name</label>
                    <input 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Description</label>
                    <textarea 
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono resize-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Current Price ($)</label>
                       <input 
                         required 
                         type="number"
                         value={formData.price}
                         onChange={e => setFormData({...formData, price: e.target.value})}
                         className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Old Price ($) - OPTIONAL</label>
                       <input 
                         type="number"
                         value={formData.originalPrice}
                         onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                         className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono" 
                         placeholder="For strikethrough"
                       />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Status Badge</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono appearance-none"
                      >
                        <option value="none">None</option>
                        <option value="sale">Sale</option>
                        <option value="sold">Sold Out</option>
                        <option value="new">New Entry</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category})}
                        className="w-full bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono appearance-none"
                      >
                        <option value="shirt">Shirts</option>
                        <option value="pants">Pants</option>
                        <option value="basic-tops">Basic Tops</option>
                        <option value="sets">Sets</option>
                        <option value="sweatshirts">Sweatshirts</option>
                        <option value="shorts">Shorts</option>
                        <option value="accessories">Accessories</option>
                        <option value="jackets">Jackets</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Gender</label>
                    <div className="flex gap-4">
                      {['man', 'woman', 'unisex'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({...formData, gender: g as Gender})}
                          className={cn(
                            "flex-1 py-3 border text-[10px] font-mono uppercase tracking-widest transition-all",
                            formData.gender === g ? "bg-white text-black border-white" : "border-white/5 text-neutral-500 hover:border-white/20"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Assets & Options */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex justify-between">
                      Images <span>[{formData.images.length}]</span>
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square group">
                          <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-white/10" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                          <div className={cn(
                            "w-full h-full border border-dashed border-white/10 hover:border-white/40 transition-colors rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-white",
                            uploading && "animate-pulse"
                          )}>
                            {uploading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <ImageIcon className="w-6 h-6" />
                            )}
                            <span className="text-[8px] font-mono uppercase tracking-widest">
                              {uploading ? 'Processing' : 'Browse'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-700 italic">Or enter image URL manually</label>
                       <div className="flex gap-2">
                          <input 
                            placeholder="HTTPS://..."
                            id="manual-url"
                            className="flex-1 bg-neutral-900 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono text-[10px]" 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('manual-url') as HTMLInputElement;
                              if (input?.value) {
                                setFormData(prev => ({...prev, images: [...prev.images, input.value]}));
                                input.value = '';
                              }
                            }}
                            className="px-4 bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-mono uppercase"
                          >
                            Add
                          </button>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Available Sizes</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const newSizes = formData.sizes.includes(size) 
                              ? formData.sizes.filter(s => s !== size)
                              : [...formData.sizes, size];
                            setFormData({...formData, sizes: newSizes});
                          }}
                          className={cn(
                            "py-2 border text-[10px] font-mono uppercase tracking-widest transition-all",
                            formData.sizes.includes(size) ? "bg-white text-black border-white" : "border-white/5 text-neutral-500 hover:border-white/20"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Section */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Variants (Colors)</label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, colors: [...formData.colors, { name: '', hex: '#000000', image: '' }]})}
                        className="text-[8px] font-mono uppercase tracking-widest bg-white/5 px-3 py-1 hover:bg-white/10 transition-colors"
                      >
                        + Add Variant
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.colors.map((color, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                              <label className="text-[8px] font-mono uppercase text-neutral-500">Color Name</label>
                              <input 
                                value={color.name}
                                onChange={e => {
                                  const newColors = [...formData.colors];
                                  newColors[idx].name = e.target.value;
                                  setFormData({...formData, colors: newColors});
                                }}
                                className="w-full bg-black/40 border border-white/5 p-2 text-[10px] font-mono outline-none"
                                placeholder="Black, Crimson, etc"
                              />
                            </div>
                            <div className="w-20 space-y-2">
                              <label className="text-[8px] font-mono uppercase text-neutral-500">HEX</label>
                              <input 
                                type="color"
                                value={color.hex}
                                onChange={e => {
                                  const newColors = [...formData.colors];
                                  newColors[idx].hex = e.target.value;
                                  setFormData({...formData, colors: newColors});
                                }}
                                className="w-full h-9 bg-black/40 border border-white/5 p-1 outline-none cursor-pointer"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newColors = formData.colors.filter((_, i) => i !== idx);
                                setFormData({...formData, colors: newColors});
                              }}
                              className="self-end p-2 text-red-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-black border border-white/5 rounded-lg overflow-hidden flex-shrink-0">
                               {color.image ? (
                                 <img src={color.image} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-neutral-700">
                                   <ImageIcon className="w-4 h-4" />
                                 </div>
                               )}
                            </div>
                            <div className="flex-1 relative">
                              <input 
                                type="file"
                                onChange={(e) => handleFileUpload(e, idx)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                              />
                              <div className="w-full py-2 border border-dashed border-white/10 text-[8px] font-mono uppercase tracking-widest text-center hover:border-white/40 transition-colors">
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

              <div className="pt-12 border-t border-white/5 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-8 py-4 border border-white/10 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-12 py-4 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-3"
                >
                  <Save className="w-4 h-4" /> {editingProduct ? 'Sync Changes' : 'Catalog Piece'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full py-24 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Scanning inventory...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-24 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">No pieces archived</div>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-neutral-900 border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center group transition-all hover:bg-neutral-800">
              <div className="w-full md:w-24 h-48 md:h-32 bg-black border border-white/5 flex-shrink-0 overflow-hidden rounded-lg">
                <img 
                  src={product.images[0]} 
                  alt="" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 space-y-2 min-w-0 w-full">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-display uppercase truncate">{product.name}</h4>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{product.category} / {product.gender}</p>
                  </div>
                  <div className="text-xl font-mono">${product.price}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => <span key={s} className="text-[8px] font-mono px-2 py-1 bg-white/5 text-white/40 border border-white/5 rounded uppercase">{s}</span>)}
                </div>
              </div>
              <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button 
                  onClick={() => openEdit(product)}
                  className="flex-1 md:flex-none p-3 md:p-4 bg-white/5 hover:bg-white hover:text-black transition-all rounded-xl flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="md:hidden text-[10px] font-mono uppercase font-bold tracking-widest">Edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 md:flex-none p-3 md:p-4 bg-white/5 hover:bg-red-500 transition-all rounded-xl text-red-500 hover:text-white flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="md:hidden text-[10px] font-mono uppercase font-bold tracking-widest">Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
