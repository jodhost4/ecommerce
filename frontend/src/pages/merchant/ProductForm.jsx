import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiPlus, FiTrash2, FiSave, FiSend } from 'react-icons/fi';
import { LuGripVertical } from 'react-icons/lu';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const defaultVariant = { name: 'Default', price: '', comparePrice: '', costPrice: '', sku: '', stock: 0, weight: '', weightUnit: 'kg', options: { size: '', quality: '' } };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [tagsInput, setTagsInput] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '',
    basePrice: '', comparePrice: '', costPrice: '',
    categoryId: '', brandId: '',
    sku: '', barcode: '',
    trackQuantity: true, stock: 0,
    weight: '', weightUnit: 'kg',
    isActive: true, isFeatured: false,
    metaTitle: '', metaDescription: '', metaKeywords: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories?limit=200'),
        api.get('/brands?limit=200'),
      ]);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);

      if (isEdit) {
        const productRes = await api.get(`/products/${id}`);
        const product = productRes.data.data;
        setForm({
          name: product.name || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          basePrice: product.basePrice?.toString() || '',
          comparePrice: product.comparePrice?.toString() || '',
          costPrice: product.costPrice?.toString() || '',
          categoryId: product.categoryId || '',
          brandId: product.brandId || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          trackQuantity: product.trackQuantity,
          stock: product.inventory?.[0]?.quantity || 0,
          weight: product.weight?.toString() || '',
          weightUnit: product.weightUnit || 'kg',
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          metaKeywords: product.metaKeywords || '',
        });
        setImages(product.images?.map((img) => ({ ...img, preview: img.url })) || []);
        setVariants(product.variants?.map((v) => ({
          name: v.name,
          price: v.price?.toString() || '',
          comparePrice: v.comparePrice?.toString() || '',
          costPrice: v.costPrice?.toString() || '',
          sku: v.sku || '',
          stock: v.stock || 0,
          weight: v.weight?.toString() || '',
          options: v.options || { size: '', quality: '' },
        })) || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, { url: ev.target.result, file, isPrimary: prev.length === 0, sortOrder: prev.length }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageRemove = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImagePrimary = (index) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...defaultVariant }]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), tagsInput.trim()] }));
      setTagsInput('');
    }
  };

  const removeTag = (index) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (status = 'active') => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        basePrice: parseFloat(form.basePrice) || 0,
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        stock: parseInt(form.stock) || 0,
        isActive: status === 'active',
        images: images.map((img, i) => ({
          url: img.preview || img.url,
          isPrimary: img.isPrimary || i === 0,
          sortOrder: img.sortOrder || i,
        })),
        variants: variants.length ? variants.map((v, i) => ({
          ...v,
          price: parseFloat(v.price) || 0,
          comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
          stock: parseInt(v.stock) || 0,
          sortOrder: i,
        })) : undefined,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      navigate('/merchant/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="btn-secondary flex items-center space-x-2">
            <FiSave className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button onClick={() => handleSubmit('active')} disabled={saving} className="btn-primary flex items-center space-x-2">
            <FiSend className="w-4 h-4" />
            <span>{isEdit ? 'Update' : 'Publish'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Product Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Short Description</label>
                <input type="text" name="shortDescription" value={form.shortDescription} onChange={handleChange} className="input-field" maxLength={500} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={6} className="input-field" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Media</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {images.map((img, i) => (
                <div key={i} className={`relative group border-2 rounded-lg overflow-hidden ${img.isPrimary ? 'border-primary-500' : 'border-secondary-200'}`}>
                  <img src={img.preview || img.url} alt="" className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                    {!img.isPrimary && (
                      <button onClick={() => handleImagePrimary(i)} className="p-1 bg-white rounded text-xs">Primary</button>
                    )}
                    <button onClick={() => handleImageRemove(i)} className="p-1 bg-red-500 text-white rounded">
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                  {img.isPrimary && <span className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1 rounded">Primary</span>}
                </div>
              ))}
              <label className="border-2 border-dashed border-secondary-300 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                <div className="text-center">
                  <FiUpload className="w-6 h-6 text-secondary-400 mx-auto mb-1" />
                  <span className="text-xs text-secondary-500">Upload</span>
                </div>
                <input type="file" multiple accept="image/*" onChange={handleImageAdd} className="hidden" />
              </label>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Base Price *</label>
                <input type="number" step="0.01" name="basePrice" value={form.basePrice} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Compare Price</label>
                <input type="number" step="0.01" name="comparePrice" value={form.comparePrice} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Cost Price</label>
                <input type="number" step="0.01" name="costPrice" value={form.costPrice} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Variants</h2>
              <button type="button" onClick={addVariant} className="btn-secondary flex items-center space-x-1 text-sm">
                <FiPlus className="w-3 h-3" />
                <span>Add Variant</span>
              </button>
            </div>
            {variants.length === 0 ? (
              <p className="text-sm text-secondary-500">This product has no variants. It will use the base price.</p>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, i) => (
                  <div key={i} className="flex items-start space-x-2 p-3 bg-secondary-50 rounded-lg">
                    <div className="pt-2"><LuGripVertical className="w-4 h-4 text-secondary-400" /></div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      <input type="text" placeholder="Name" value={variant.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} className="input-field text-sm" />
                      <input type="number" step="0.01" placeholder="Price" value={variant.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} className="input-field text-sm" />
                      <input type="text" placeholder="SKU" value={variant.sku} onChange={(e) => handleVariantChange(i, 'sku', e.target.value)} className="input-field text-sm" />
                      <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => handleVariantChange(i, 'stock', parseInt(e.target.value) || 0)} className="input-field text-sm" />
                      <input type="number" step="0.1" placeholder="Weight" value={variant.weight} onChange={(e) => handleVariantChange(i, 'weight', e.target.value)} className="input-field text-sm" />
                      <input type="text" placeholder="Size" value={variant.options?.size || ''} onChange={(e) => handleVariantChange(i, 'options', { ...variant.options, size: e.target.value })} className="input-field text-sm" />
                      <div className="flex items-center space-x-1">
                        <select value={variant.options?.quality || ''} onChange={(e) => handleVariantChange(i, 'options', { ...variant.options, quality: e.target.value })} className="input-field text-sm flex-1">
                          <option value="">Quality</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                          <option value="Refurbished">Refurbished</option>
                        </select>
                        <button onClick={() => removeVariant(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Meta Title</label>
                <input type="text" name="metaTitle" value={form.metaTitle} onChange={handleChange} className="input-field" maxLength={70} />
                <p className="text-xs text-secondary-400 mt-1">{form.metaTitle.length}/70</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Meta Description</label>
                <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2} className="input-field" maxLength={160} />
                <p className="text-xs text-secondary-400 mt-1">{form.metaDescription.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Meta Keywords</label>
                <input type="text" name="metaKeywords" value={form.metaKeywords} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Category</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Brand</label>
                <select name="brandId" value={form.brandId} onChange={handleChange} className="input-field">
                  <option value="">No brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(form.tags || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                      {tag}
                      <button onClick={() => removeTag(i)} className="ml-1"><FiX className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Type and press Enter" className="input-field" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">SKU</label>
                <input type="text" name="sku" value={form.sku} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Barcode</label>
                <input type="text" name="barcode" value={form.barcode} onChange={handleChange} className="input-field" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="trackQuantity" name="trackQuantity" checked={form.trackQuantity} onChange={handleChange} className="rounded border-secondary-300 text-primary-600" />
                <label htmlFor="trackQuantity" className="text-sm text-secondary-700">Track quantity</label>
              </div>
              {form.trackQuantity && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Stock Quantity</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} className="input-field" min={0} />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Shipping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Weight</label>
                <input type="number" step="0.01" name="weight" value={form.weight} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Weight Unit</label>
                <select name="weightUnit" value={form.weightUnit} onChange={handleChange} className="input-field">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Status</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded border-secondary-300 text-primary-600" />
                <span className="text-sm text-secondary-700">Active</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="rounded border-secondary-300 text-primary-600" />
                <span className="text-sm text-secondary-700">Featured</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
