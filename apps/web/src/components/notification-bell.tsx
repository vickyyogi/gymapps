"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ locale }: { locale: string }) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [rows, setRows] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    const response = await fetch("/api/v1/notifications?limit=20");
    if (!response.ok) return;
    const payload = await response.json();
    setRows(payload.data ?? []);
    setUnread(payload.meta?.unread_count ?? 0);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, []);

  async function openNotification(row: Notification) {
    if (!row.read_at) {
      await fetch(`/api/v1/notifications/${row.id}`, { method: "PATCH" });
      setUnread((value) => Math.max(0, value - 1));
    }
    setOpen(false);
    if (row.link) router.push(row.link.startsWith("/") ? `/${locale}${row.link}` : row.link);
    else void load();
  }

  async function readAll() {
    await fetch("/api/v1/notifications/read-all", { method: "POST" });
    setUnread(0);
    void load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("label")}
        className="relative rounded-lg border border-border px-2 py-1.5 text-sm"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium">{t("title")}</span>
            {unread > 0 ? (
              <button type="button" onClick={readAll} className="text-xs underline underline-offset-2">
                {t("readAll")}
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => openNotification(row)}
                  className={`w-full px-2 py-2 text-left text-sm ${row.read_at ? "opacity-60" : ""}`}
                >
                  <p className="font-medium">{row.title}</p>
                  {row.body ? <p className="mt-0.5 text-xs text-muted-foreground">{row.body}</p> : null}
                </button>
              </li>
            ))}
            {!rows.length ? (
              <li className="px-2 py-3 text-sm text-muted-foreground">{t("empty")}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
