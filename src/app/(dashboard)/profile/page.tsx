"use client";

import { ProfileForm } from "@/features/profile/components/profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Profile & Resume</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Manage your contact info, social links, Cloudinary resume asset, and drafting context summary.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
