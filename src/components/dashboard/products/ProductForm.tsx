'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast';
import { useCategories, useUnits, useCreateProduct, useUpdateProduct, useCreateCategory, useProduct, useSuppliers } from '@/features/catalog/hooks';
import { formatPKR } from '@/lib/utils';
import { suggestSku, uploadImage } from '@/features/catalog/api';
import { apiErrorMessage } from '@/lib/api';
import type { Product } from '@/types/catalog';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null; // present => edit mode
}

const empty = { name: '', categoryId: '', unitId: '', supplier: '', sellingPrice: '', purchaseCost: '', minStock: '', openingStock: '', sku: '', isAvailable: true };

export function ProductForm({ open, onClose, product }: Props) {
  const { data: categories } = useCategories();
  const { data: units } = useUnits();
  const { data: suppliers } = useSuppliers();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const createCategory = useCreateCategory();
  const [form, setForm] = useState<typeof empty>(empty);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [skuLoading, setSkuLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const isEdit = !!product;
  // Opening stock lives in the stock ledger, not on the list row — fetch it for edit.
  const { data: detail, isLoading: detailLoading } = useProduct(isEdit && open ? product!._id : null);
  const [loadedOpening, setLoadedOpening] = useState<number | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        categoryId: typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId,
        unitId: typeof product.unitId === 'object' ? product.unitId._id : product.unitId,
        supplier: product.supplier ?? '',
        sellingPrice: String(product.sellingPriceMinor / 100),
        purchaseCost: String(product.purchaseCostMinor / 100),
        minStock: String(product.minStock),
        openingStock: '',
        sku: product.sku,
        isAvailable: product.isAvailable,
      });
      setImageUrl(product.images?.[0] ?? '');
    } else {
      setForm(empty);
      setImageUrl('');
    }
    setAddingCategory(false);
    setNewCategory('');
    setLoadedOpening(null);
  }, [product, open]);

  // Prefill opening stock once the ledger value arrives (only for the product being edited).
  useEffect(() => {
    if (!open || !product || !detail || detail._id !== product._id || detail.openingStock === undefined) return;
    setLoadedOpening(detail.openingStock);
    setForm((f) => ({ ...f, openingStock: String(detail.openingStock) }));
  }, [detail, product, open]); // `open` too: reopening with a cached detail must re-prefill after the reset above

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onGenerateSku = async () => {
    setSkuLoading(true);
    try {
      setForm((f) => ({ ...f, sku: '' }));
      const sku = await suggestSku(form.categoryId || undefined);
      setForm((f) => ({ ...f, sku }));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSkuLoading(false);
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const onAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    createCategory.mutate({ name }, {
      onSuccess: (cat) => { setForm((f) => ({ ...f, categoryId: cat._id })); setAddingCategory(false); setNewCategory(''); },
    });
  };

  // Opening stock can't exceed the stock actually available: none yet for a new
  // product, the current stock when editing. Only checked when the value is set or
  // changed, so products sold down since can still have other details edited.
  const openingNum = form.openingStock.trim() === '' ? null : Number(form.openingStock);
  const availableStock = isEdit ? (detail?.currentStock ?? product?.currentStock ?? 0) : 0;
  const openingBeingSet = isEdit
    ? loadedOpening !== null && openingNum !== null && openingNum !== loadedOpening
    : openingNum !== null && openingNum > 0;
  const openingError = openingBeingSet && openingNum! > availableStock
    ? 'This much stock is not available. Please add stock first.'
    : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (openingError) return;
    const base = {
      name: form.name,
      categoryId: form.categoryId,
      unitId: form.unitId,
      sellingPrice: Number(form.sellingPrice),
      purchaseCost: Number(form.purchaseCost),
      supplier: form.supplier.trim(),
      minStock: form.minStock ? Number(form.minStock) : undefined,
      isAvailable: form.isAvailable,
      sku: form.sku || undefined,
      images: imageUrl ? [imageUrl] : undefined,
    };
    if (isEdit) {
      // Send opening stock only when it actually changed — the server turns the
      // difference into a ledger correction.
      const nextOpening = form.openingStock.trim() === '' ? null : Number(form.openingStock);
      const openingChanged = loadedOpening !== null && nextOpening !== null && nextOpening !== loadedOpening;
      update.mutate({ id: product!._id, payload: { ...base, ...(openingChanged ? { openingStock: nextOpening } : {}) } }, { onSuccess: onClose });
    }
    else create.mutate({ ...base, openingStock: form.openingStock ? Number(form.openingStock) : undefined }, { onSuccess: onClose });
  };

  const pending = create.isPending || update.isPending;

  // Profit per unit = Selling − Cost. Only shown when BOTH prices are filled.
  const sellNum = Number(form.sellingPrice);
  const costNum = Number(form.purchaseCost);
  const bothPrices = form.sellingPrice.trim() !== '' && form.purchaseCost.trim() !== '' && !Number.isNaN(sellNum) && !Number.isNaN(costNum);
  const unitProfit = bothPrices ? sellNum - costNum : null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit product' : 'Add product'}>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Image */}
        <div className="flex items-center gap-4">
          {imageUrl
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Product" className="h-16 w-16 rounded-lg object-cover" />
            : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl">📦</div>}
          <label className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
            {uploading ? 'Uploading…' : imageUrl ? 'Change image' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} disabled={uploading} />
          </label>
        </div>

        <Input label="Product name" value={form.name} onChange={set('name')} required />

        {/* Category with inline add */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <button type="button" onClick={() => setAddingCategory((v) => !v)} className="text-xs font-medium text-brand-700 hover:underline">
              {addingCategory ? 'Cancel' : '+ Add category'}
            </button>
          </div>
          {addingCategory ? (
            <div className="flex gap-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name"
                className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
              <Button type="button" variant="outline" onClick={onAddCategory} loading={createCategory.isPending}>Add</Button>
            </div>
          ) : (
            <Select name="categoryId" placeholder="Select…" value={form.categoryId} onChange={set('categoryId')} required
              options={(categories ?? []).map((c) => ({ value: c._id, label: c.name }))} />
          )}
        </div>

        <Select label="Unit" placeholder="Select…" value={form.unitId} onChange={set('unitId')} required
          options={(units ?? []).map((u) => ({ value: u._id, label: `${u.name} (${u.symbol})` }))} />

        {/* SKU with auto-generate */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
          <div className="flex gap-2">
            <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated or custom"
              className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <Button type="button" variant="outline" onClick={onGenerateSku} loading={skuLoading}>Generate</Button>
          </div>
        </div>

        <Input label="Supplier / Vendor" value={form.supplier} onChange={set('supplier')} list="product-suppliers"
          placeholder="Who you buy it from" hint={!isEdit && form.openingStock ? 'Opening stock is recorded as bought from this supplier' : undefined} />
        <datalist id="product-suppliers">{(suppliers ?? []).map((s) => <option key={s} value={s} />)}</datalist>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Cost price (Rs)" type="number" step="0.01" min="0" value={form.purchaseCost} onChange={set('purchaseCost')} required />
          <Input label="Sale price (Rs)" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={set('sellingPrice')} required />
        </div>
        {isEdit && detail?.avgCostMinor !== undefined && (
          <p className="-mt-2 text-xs text-slate-500">
            Average cost across stock purchases: <span className="font-medium text-slate-700">{formatPKR(detail.avgCostMinor)}</span> — sales are costed at this.
          </p>
        )}
        {/* Profit shown only when both prices are filled. */}
        {unitProfit !== null && (
          <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${unitProfit < 0 ? 'bg-red-50' : 'bg-brand-50'}`}>
            <span className="font-medium text-slate-600">Profit per unit</span>
            <span className={`font-bold ${unitProfit < 0 ? 'text-red-600' : 'text-brand-700'}`}>
              {unitProfit < 0 ? `– Rs ${Math.abs(unitProfit).toLocaleString()}` : `Rs ${unitProfit.toLocaleString()}`}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Min stock (alert)" type="number" min="0" value={form.minStock} onChange={set('minStock')} />
          {!isEdit && <Input label="Opening stock" type="number" min="0" value={form.openingStock} onChange={set('openingStock')} hint="Optional" error={openingError} />}
          {isEdit && product!.trackInventory && (
            <Input label="Opening stock" type="number" step="any" min="0"
              value={detailLoading && loadedOpening === null ? '' : form.openingStock}
              placeholder={detailLoading ? 'Loading…' : '0'}
              disabled={loadedOpening === null}
              onChange={set('openingStock')}
              error={openingError}
              hint={loadedOpening !== null && form.openingStock.trim() !== '' && Number(form.openingStock) !== loadedOpening
                ? `Current stock will change by ${Number(form.openingStock) - loadedOpening > 0 ? '+' : ''}${Number(form.openingStock) - loadedOpening}`
                : 'Changing it adjusts current stock by the difference'} />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
          Available for sale
        </label>

        <Button type="submit" className="w-full" loading={pending} disabled={uploading || !!openingError}>{isEdit ? 'Save changes' : 'Create product'}</Button>
      </form>
    </Modal>
  );
}
