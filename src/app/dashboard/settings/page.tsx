'use client';

import { ProfileCard } from '@/components/dashboard/settings/ProfileCard';
import { ShopProfileCard } from '@/components/dashboard/settings/ShopProfileCard';
import { ShopConfigCard } from '@/components/dashboard/settings/ShopConfigCard';
import { StaffCard } from '@/components/dashboard/settings/StaffCard';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your shop profile, configuration and staff.</p>
      </div>
      <ProfileCard />
      <ShopProfileCard />
      <div className="grid gap-6 lg:grid-cols-2">
        <ShopConfigCard />
        <StaffCard />
      </div>
    </div>
  );
}
