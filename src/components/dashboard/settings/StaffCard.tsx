'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useStaff, useCreateStaff, useDeactivateStaff } from '@/features/shop/hooks';

export function StaffCard() {
  const { data: staff, isLoading } = useStaff();
  const create = useCreateStaff();
  const deactivate = useDeactivateStaff();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name: form.name, email: form.email, password: form.password, phone: form.phone || undefined },
      { onSuccess: () => { setOpen(false); setForm({ name: '', email: '', password: '', phone: '' }); } },
    );
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Staff</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>Add staff</Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        ) : staff && staff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2.5 text-slate-500">{s.email}</td>
                    <td className="py-2.5">
                      <Badge tone={s.role === 'SHOP_ADMIN' ? 'blue' : 'slate'}>
                        {s.role === 'SHOP_ADMIN' ? 'Owner' : 'Staff'}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge tone={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      {s.role !== 'SHOP_ADMIN' && s.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => deactivate.mutate(s.id)}>
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No staff yet.</p>
        )}
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title="Add staff member">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required hint="At least 8 characters" />
          <Button type="submit" className="w-full" loading={create.isPending}>Create staff</Button>
        </form>
      </Modal>
    </Card>
  );
}
