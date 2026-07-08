import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiTag, FiBox } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      navigate('/merchant/products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Product not found</p>
        <Link to="/merchant/products" className="btn-primary mt-4 inline-block">Back to Products</Link>
      </div>
    );
  }

  const allImages = product.images || [];
  const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? product.inventory?.[0]?.quantity ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/merchant/products" className="btn-secondary p-2">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{product.name}</h1>
            <p className="text-sm text-secondary-500">SKU: {product.sku || 'N/A'} | Slug: {product.slug}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to={`/merchant/products/${id}/edit`} className="btn-secondary flex items-center space-x-2">
            <FiEdit2 className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button onClick={handleDelete} className="btn-danger flex items-center space-x-2">
            <FiTrash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex space-x-4">
              <div className="w-72 flex-shrink-0">
                <div className="w-72 h-72 bg-secondary-100 rounded-lg overflow-hidden mb-2">
                  {allImages[selectedImage] ? (
                    <img src={allImages[selectedImage].url} alt={allImages[selectedImage].altText || product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary-400"><FiPackage className="w-12 h-12" /></div>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === selectedImage ? 'border-primary-500' : 'border-secondary-200'}`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {product.isFeatured && <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">Featured</span>}
                </div>
                <div className="text-3xl font-bold text-secondary-900 mb-3">{formatCurrency(Number(product.basePrice))}</div>
                {product.comparePrice && (
                  <div className="text-lg text-secondary-400 line-through mb-3">{formatCurrency(Number(product.comparePrice))}</div>
                )}
                {product.shortDescription && (
                  <p className="text-secondary-600 mb-4">{product.shortDescription}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-secondary-500">
                  <span className="flex items-center"><FiBox className="w-4 h-4 mr-1" /> Stock: {totalStock}</span>
                  <span className="flex items-center"><FiTag className="w-4 h-4 mr-1" /> {product.category?.name || 'No category'}</span>
                  <span className="flex items-center"><FiDollarSign className="w-4 h-4 mr-1" /> {product.brand?.name || 'No brand'}</span>
                </div>
              </div>
            </div>
            {product.description && (
              <div className="mt-6 pt-6 border-t border-secondary-200">
                <h3 className="text-sm font-semibold text-secondary-900 mb-2">Description</h3>
                <div className="text-sm text-secondary-600 whitespace-pre-wrap">{product.description}</div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Variants</h2>
            {product.variants?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary-50 border-b border-secondary-200">
                      <th className="text-left px-3 py-2 text-xs font-medium text-secondary-500 uppercase">Name</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-secondary-500 uppercase">SKU</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-secondary-500 uppercase">Price</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-secondary-500 uppercase">Stock</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-secondary-500 uppercase">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 text-sm font-medium text-secondary-900">{v.name}</td>
                        <td className="px-3 py-2 text-sm text-secondary-600">{v.sku || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm font-medium">{formatCurrency(Number(v.price))}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`font-medium ${v.stock === 0 ? 'text-red-600' : v.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>{v.stock}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-secondary-600">
                          {v.options && typeof v.options === 'object' ? Object.entries(v.options).map(([k, val]) => (
                            <span key={k} className="inline-flex items-center px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full mr-1">
                              {k}: {String(val)}
                            </span>
                          )) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-secondary-500">No variants configured</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3">Product Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Created</span>
                <span className="text-secondary-700">{formatDate(product.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Updated</span>
                <span className="text-secondary-700">{formatDate(product.updatedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Cost Price</span>
                <span className="text-secondary-700">{product.costPrice ? formatCurrency(Number(product.costPrice)) : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Weight</span>
                <span className="text-secondary-700">{product.weight ? `${product.weight} ${product.weightUnit}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Track Quantity</span>
                <span className="text-secondary-700">{product.trackQuantity ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {product.tags?.length > 0 ? product.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{tag}</span>
              )) : <span className="text-sm text-secondary-500">No tags</span>}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3">SEO</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-secondary-500">Meta Title</p>
                <p className="text-sm text-secondary-700">{product.metaTitle || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Meta Description</p>
                <p className="text-sm text-secondary-700">{product.metaDescription || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Meta Keywords</p>
                <p className="text-sm text-secondary-700">{product.metaKeywords || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
