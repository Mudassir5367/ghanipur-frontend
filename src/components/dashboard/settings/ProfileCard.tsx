'use client';

import { useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth';
import { uploadAvatar } from '@/features/auth/api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const MAX_MB = 5;

export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Image must be under ${MAX_MB} MB.`); return; }
    setBusy(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      patchUser({ avatarUrl }); // reflect immediately in the header/welcome avatar
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardBody>
        <div className="flex items-center gap-5">
          <Avatar name={user?.name} src={user?.avatarUrl} className="h-20 w-20 text-2xl shadow-sm ring-2 ring-slate-100" />
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-3">
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
              <Button variant="outline" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
                {user?.avatarUrl ? 'Change photo' : 'Upload photo'}
              </Button>
              <p className="mt-2 text-xs text-slate-400">JPG, PNG, WEBP or GIF · up to {MAX_MB} MB</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
