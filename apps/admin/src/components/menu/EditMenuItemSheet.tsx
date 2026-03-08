'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { Plus, Check } from 'lucide-react';
import { useUpdateMenuItem, useCreateMenuItem, useCreateCategory } from '@/hooks/use-menu';
import { useToast } from '@/components/shared/Toast';
import type { AdminMenuItem, AdminCategory } from '@/mock/seed';

// ── VND-based form schema (user types VND, we store satang internally) ────────
const FormSchema = z.object({
  name:        z.string().min(2, 'Tên món tối thiểu 2 ký tự').max(120),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional().or(z.literal('')),
  priceVnd:    z.number({ invalid_type_error: 'Giá phải là số' })
                .int('Giá phải là số nguyên')
                .min(1_000, 'Giá tối thiểu 1.000đ'),
  imageUrl:    z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
  isAvailable: z.boolean(),
  categoryId:  z.string().min(1, 'Vui lòng chọn danh mục'),
  tags:        z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof FormSchema>;

// Convert satang → VND for display (satang = vnd * 100)
const satangToVnd  = (s: number) => Math.round(s / 100);
const vndToSatang  = (v: number) => v * 100;
const fmtVnd       = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

interface Props {
  open:       boolean;
  onClose:    () => void;
  categories: AdminCategory[];
  item?:      AdminMenuItem | null;
}

export function EditMenuItemSheet({ open, onClose, categories, item }: Props) {
  const isEdit = !!item;
  const { toast } = useToast();
  const updateMutation = useUpdateMenuItem();
  const createMutation = useCreateMenuItem();

  // Extra categories created during this session (before query re-fetches)
  const [localCategories, setLocalCategories] = useState<AdminCategory[]>([]);
  const allCategories = [...categories, ...localCategories.filter((lc) => !categories.find((c) => c.id === lc.id))];

  const makeDefaults = (): FormValues => ({
    name:        item?.name        ?? '',
    description: item?.description ?? '',
    priceVnd:    item ? satangToVnd(item.priceSatang) : 35_000,
    imageUrl:    item?.imageUrl    ?? '',
    isAvailable: item?.isAvailable ?? true,
    categoryId:  item?.categoryId  ?? (allCategories[0]?.id ?? ''),
    tags:        item?.tags        ?? [],
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: makeDefaults(),
  });

  useEffect(() => { reset(makeDefaults()); }, [item, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const priceVnd = watch('priceVnd');

  async function onSubmit(data: FormValues) {
    const payload = {
      name:        data.name,
      description: data.description,
      priceSatang: vndToSatang(data.priceVnd),
      imageUrl:    data.imageUrl,
      isAvailable: data.isAvailable,
      categoryId:  data.categoryId,
      tags:        data.tags ?? [],
    };
    try {
      if (isEdit) {
        await (updateMutation.mutateAsync as (p: { itemId: string; data: typeof payload }) => Promise<unknown>)(
          { itemId: item!.id, data: payload },
        );
        toast(`Đã cập nhật "${data.name}"`, 'success');
      } else {
        await (createMutation.mutateAsync as (d: typeof payload) => Promise<unknown>)(payload);
        toast(`Đã thêm "${data.name}"`, 'success');
      }
      onClose();
    } catch {
      toast('Lưu thất bại, thử lại.', 'error');
    }
  }

  const isPending = updateMutation.isPending || createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="rounded-t-2xl px-0 pb-0 max-h-[92dvh] flex flex-col bg-pos-surface">
        <SheetHeader className="px-5 pb-3 shrink-0">
          <SheetTitle className="text-white text-lg font-semibold">
            {isEdit ? `Sửa: ${item?.name}` : 'Thêm món mới'}
          </SheetTitle>
          <SheetDescription className="sr-only">Chỉnh sửa thông tin món ăn</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 space-y-4 pb-8">
          {/* Tên món */}
          <Field label="Tên món" required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="Bánh tráng nướng phô mai"
              className="pos-input"
            />
          </Field>

          {/* Mô tả */}
          <Field label="Mô tả" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mô tả ngắn gọn về món..."
              className={cn(
                'w-full resize-none rounded-xl px-3 py-3 text-sm',
                'bg-white/10 border border-white/10 text-white',
                'placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pos-brand',
              )}
            />
          </Field>

          {/* Giá VNĐ */}
          <Field label="Giá (VNĐ)" required error={errors.priceVnd?.message}>
            <Input
              {...register('priceVnd', { valueAsNumber: true })}
              type="number"
              step="1000"
              min="1000"
              placeholder="35000"
              className="pos-input"
            />
            {priceVnd > 0 && !isNaN(priceVnd) && (
              <p className="text-xs text-white/40 mt-1">{fmtVnd(priceVnd)}</p>
            )}
          </Field>

          {/* Danh mục */}
          <Field label="Danh mục" required error={errors.categoryId?.message}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategoryDropdown
                  categories={allCategories}
                  value={field.value}
                  onChange={field.onChange}
                  onCategoryCreated={(cat) => {
                    setLocalCategories((prev) => [...prev, cat]);
                    field.onChange(cat.id);
                  }}
                />
              )}
            />
          </Field>

          {/* Ảnh URL */}
          <Field label="Ảnh (URL)" error={errors.imageUrl?.message}>
            <Input
              {...register('imageUrl')}
              placeholder="https://..."
              className="pos-input"
              type="url"
            />
          </Field>

          {/* Đang bán toggle */}
          <Controller
            name="isAvailable"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between py-2">
                <span className="text-white/80 text-sm">Đang bán</span>
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  role="switch"
                  aria-checked={field.value}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full p-[2px]',
                    'transition-colors duration-200 focus-visible:outline-none',
                    field.value ? 'bg-[#22C55E]' : 'bg-white/20',
                  )}
                >
                  <span className={cn(
                    'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                    field.value ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </button>
              </div>
            )}
          />

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || isPending}
              className="w-full h-14 text-base font-semibold bg-pos-brand hover:bg-pos-brand/90"
            >
              {isPending ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Thêm món'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Custom dropdown for category ─────────────────────────────────────────────
// Uses a fixed-position panel so it floats OVER the sheet content without
// pushing other fields down (no layout jump).
function CategoryDropdown({
  categories,
  value,
  onChange,
  onCategoryCreated,
}: {
  categories:        AdminCategory[];
  value:             string;
  onChange:          (v: string) => void;
  onCategoryCreated: (cat: AdminCategory) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving,  setSaving]    = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const createCategory = useCreateCategory();
  const { toast } = useToast();

  // Panel position derived from trigger rect
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const measureAndOpen = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top:      rect.bottom + 4,
      left:     rect.left,
      width:    rect.width,
      zIndex:   9999,
    });
    setOpen(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Focus input when create row appears
  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 50);
  }, [creating]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const cat = await createCategory.mutateAsync(name) as AdminCategory;
      onCategoryCreated(cat);
      onChange(cat.id);
      toast(`Đã tạo danh mục "${cat.name}"`, 'success');
      setCreating(false);
      setNewName('');
      setOpen(false);
    } catch {
      toast('Tạo danh mục thất bại', 'error');
    } finally {
      setSaving(false);
    }
  }

  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative">
      {/* Trigger — fixed height, never changes */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : measureAndOpen()}
        className={cn(
          'w-full h-12 flex items-center justify-between px-3 rounded-xl text-sm',
          'bg-white/10 border text-white',
          open ? 'border-pos-brand ring-2 ring-pos-brand' : 'border-white/10',
        )}
      >
        <span>{selected?.name ?? 'Chọn danh mục'}</span>
        <svg
          className={cn('h-4 w-4 text-white/50 transition-transform duration-200 shrink-0', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel — portaled via fixed position, does NOT affect layout */}
      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="rounded-xl bg-pos-bg border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Existing categories */}
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setOpen(false); setCreating(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors',
                c.id === value
                  ? 'bg-pos-brand text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 active:bg-white/15',
              )}
            >
              {c.id === value
                ? <Check className="h-3.5 w-3.5 shrink-0" />
                : <span className="h-3.5 w-3.5 shrink-0 block" />
              }
              {c.name}
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Create new category row */}
          {creating ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
                placeholder="Tên danh mục mới..."
                className={cn(
                  'flex-1 min-w-0 rounded-lg px-3 py-2 text-sm bg-white/10 border border-white/20',
                  'text-white placeholder:text-white/30 focus:outline-none focus:border-pos-brand',
                )}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-pos-brand disabled:opacity-40"
              >
                {saving
                  ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check className="h-4 w-4 text-white" />
                }
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-pos-brand hover:bg-white/5 transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Tạo danh mục mới
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label:     string;
  required?: boolean;
  error?:    string;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">
        {label}
        {required && <span className="ml-0.5 text-red-400"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
