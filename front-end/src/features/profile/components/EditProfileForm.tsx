"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  getDefaultUserProfile,
  loadUserProfile,
  saveUserProfile,
  uploadUserAvatar
} from "../services/profile";
import type { UserProfile } from "../types";

const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const bannerOptions: Array<{
  label: string;
  tone: UserProfile["bannerTone"];
  preview: string;
}> = [
  {
    label: "Mint",
    tone: "mint",
    preview: "bg-[#eafaf1]"
  },
  {
    label: "Sky",
    tone: "sky",
    preview: "bg-[#edf4fe]"
  },
  {
    label: "Sunrise",
    tone: "sunrise",
    preview: "bg-[#fff9f2]"
  }
];

export function EditProfileForm() {
  const router = useRouter();
  const { isAuthenticated, isApiReady, isLoading, updateUser, user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<{
    profile: UserProfile;
    userId: string;
  } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !isApiReady) {
      return;
    }

    let cancelled = false;

    loadUserProfile(user)
      .then((nextProfile) => {
        if (!cancelled) {
          setLoadedProfile({ profile: nextProfile, userId: user.id });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedProfile({
            profile: getDefaultUserProfile(user),
            userId: user.id
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, isApiReady]);

  const profile =
    loadedProfile && loadedProfile.userId === user?.id
      ? loadedProfile.profile
      : null;

  function updateField<Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) {
    setLoadedProfile((current) =>
      current
        ? { ...current, profile: { ...current.profile, [key]: value } }
        : current
    );
    setSaved(false);
    setError("");
  }

  function replaceAvatarPreview(nextUrl: string | null) {
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
    }

    avatarPreviewUrlRef.current = nextUrl;
    setAvatarPreviewUrl(nextUrl);
  }

  function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError("Ảnh đại diện chỉ hỗ trợ JPEG, PNG hoặc WebP.");
      setAvatarFile(null);
      replaceAvatarPreview(null);
      return;
    }

    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setAvatarError("Ảnh đại diện không được vượt quá 2 MB.");
      setAvatarFile(null);
      replaceAvatarPreview(null);
      return;
    }

    setAvatarError("");
    setError("");
    setSaved(false);
    setAvatarFile(file);
    replaceAvatarPreview(URL.createObjectURL(file));
  }

  function clearSelectedAvatar() {
    setAvatarFile(null);
    setAvatarError("");
    replaceAvatarPreview(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile || !user) {
      return;
    }

    if (!profile.displayName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setError("");
      setAvatarError("");
      setIsSaving(true);
      let nextProfile = await saveUserProfile(profile);

      if (avatarFile) {
        nextProfile = await uploadUserAvatar(avatarFile);
      }

      updateUser({
        avatar: nextProfile.avatar,
        avatarUrl: nextProfile.avatarUrl,
        displayName: nextProfile.displayName
      });
      clearSelectedAvatar();
      setLoadedProfile({ profile: nextProfile, userId: user.id });
      setSaved(true);
      router.push("/profile");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Không thể cập nhật hồ sơ cá nhân."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || (isAuthenticated && user && !profile)) {
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

  if (!isAuthenticated || !user || !profile) {
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
              href="/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentProfile = profile;
  const displayedAvatarUrl = avatarPreviewUrl || currentProfile.avatarUrl;

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
              Chỉnh sửa thông tin hiển thị trên hồ sơ TOEIC Green của bạn.
              Email đăng nhập được giữ cố định để bảo vệ tài khoản.
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
                  <UserAvatar
                    alt={`${currentProfile.displayName} avatar`}
                    avatarUrl={displayedAvatarUrl}
                    className="h-20 w-20 bg-[#d4f9d2] text-xl font-extrabold text-primary shadow-soft"
                    initials={currentProfile.avatar}
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="sr-only"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-ink transition hover:border-primary/40 hover:text-primary"
                      >
                        <Upload className="h-4 w-4" />
                        Chọn ảnh
                      </button>
                    </div>
                    {avatarFile ? (
                      <p className="mt-2 truncate text-xs font-bold text-primary">
                        {avatarFile.name}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-muted">
                  Chọn ảnh rõ mặt để hồ sơ dễ nhận diện hơn. Hỗ trợ JPEG, PNG
                  hoặc WebP, tối đa 2 MB.
                </p>
                {avatarError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    {avatarError}
                  </p>
                ) : null}
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
                          "h-10 w-24 rounded-md border border-slate-200",
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
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Đang lưu" : "Lưu"}
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
