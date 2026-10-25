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
        aria-expanded={open}
        className="btn btn-ghost btn-sm p-2 rounded-full"
      >
        <span aria-hidden className="text-body-large">🔔</span>
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 chip chip-status chip-status-up text-[10px] px-1.5 py-0">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 card-elevated animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-subhead text-text-primary">{t("title")}</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={readAll}
                className="btn btn-ghost btn-sm text-caption"
              >
                {t("readAll")}
              </button>
            ) : null}
          </div>
          <ul className="list divide-y divide-border max-h-80 overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id} className="list-item px-3 py-2 gap-3">
                <button
                  type="button"
                  onClick={() => openNotification(row)}
                  className="w-full text-left gap-3 p-0 hover:bg-transparent active:bg-transparent flex items-start"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary truncate">{row.title}</p>
                    {row.body ? <p className="mt-0.5 text-body-small text-text-secondary">{row.body}</p> : null}
                  </div>
                  {!row.read_at && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" aria-label="Unread" />
                  )}
                </button>
              </li>
            ))}
            {!rows.length ? (
              <li className="list-item px-3 py-4 text-center">
                <p className="text-body text-text-tertiary">{t("empty")}</p>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}