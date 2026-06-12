"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import {
  getDefaultUserProfile,
  loadUserProfile,
  saveUserProfile
} from "../services/profile";
import type { UserProfile } from "../types";

const bannerOptions: Array<{
  label: string;
  tone: UserProfile["bannerTone"];
  preview: string;
}> = [
  {
    label: "Mint",
    tone: "mint",
    preview: "from-[#baf7c3] via-[#e9fff0] to-[#d7efff]"
  },
  {
    label: "Sky",
    tone: "sky",
    preview: "from-[#dce9ff] via-[#f6f8ff] to-[#c6f0ff]"
  },
  {
    label: "Sunrise",
    tone: "sunrise",
    preview: "from-[#ffe1c4] via-[#fff7df] to-[#cdf8e0]"
  }
];

export function EditProfileForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading, updateUser, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfile(loadUserProfile(user));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  function updateField<Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    if (!profile.displayName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!profile.username.trim()) {
      setError("Vui lòng nhập tên người dùng.");
      return;
    }

    const nextProfile = saveUserProfile(profile);
    updateUser({
      avatar: nextProfile.avatar,
      displayName: nextProfile.displayName
    });
    setProfile(nextProfile);
    setSaved(true);
    router.push("/profile");
  }

  if (isLoading) {
    return (
      <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
        <div className="container-shell">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-muted">Đang tải thông tin...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
        <div className="container-shell">
          <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-container text-primary">
              <UserRound className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold text-ink">
              Đăng nhập để cập nhật hồ sơ
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Thông tin cá nhân được gắn với tài khoản TOEIC Green của bạn.
            </p>
            <Link
              href="/login?next=/profile/edit"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentProfile = profile ?? getDefaultUserProfile(user);

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
      <div className="container-shell">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-[#005d16]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang cá nhân
        </Link>

        <form
          onSubmit={handleSubmit}
          className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft"
        >
          <div className="border-b border-slate-200 px-5 py-6 md:px-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">
              Hồ sơ
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-ink">
              Cập nhật thông tin cá nhân
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Các trường dưới đây được tách riêng trong profile service để sau này có thể thay bằng API backend.
            </p>
          </div>

          <div className="grid gap-7 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Field label="Email">
                <input
                  value={currentProfile.email || "Chưa liên kết email"}
                  disabled
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-muted"
                />
              </Field>

              <Field label="Họ và tên">
                <input
                  value={currentProfile.displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nhập họ và tên"
                />
              </Field>

              <Field label="Tên người dùng">
                <input
                  value={currentProfile.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Tên người dùng"
                />
              </Field>

              <Field label="Về bản thân">
                <textarea
                  value={currentProfile.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  className="min-h-36 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Chia sẻ ngắn gọn về mục tiêu học TOEIC của bạn"
                />
              </Field>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </p>
              ) : null}

              {saved ? (
                <p className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã lưu thông tin.
                </p>
              ) : null}
            </div>

            <aside className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-ink">Ảnh đại diện</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-black text-xl font-extrabold text-white">
                    {currentProfile.avatar}
                  </div>
                  <input
                    value={currentProfile.avatar}
                    onChange={(event) => updateField("avatar", event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold uppercase text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="TG"
                    maxLength={3}
                  />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-muted">
                  Bản hiện tại dùng ký hiệu avatar. Khi có backend, phần này có thể đổi sang upload ảnh.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-ink">Banner</p>
                <div className="mt-4 grid gap-3">
                  {bannerOptions.map((option) => (
                    <button
                      key={option.tone}
                      type="button"
                      onClick={() => updateField("bannerTone", option.tone)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border bg-white p-2 text-left transition",
                        currentProfile.bannerTone === option.tone
                          ? "border-primary ring-2 ring-primary/15"
                          : "border-slate-200 hover:border-primary/35"
                      )}
                    >
                      <span
                        className={cn(
                          "h-10 w-24 rounded-md bg-gradient-to-r",
                          option.preview
                        )}
                      />
                      <span className="flex-1 text-sm font-extrabold text-ink">
                        {option.label}
                      </span>
                      {currentProfile.bannerTone === option.tone ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end md:px-8">
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-primary/35"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
            >
              <Save className="h-4 w-4" />
              Lưu
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
