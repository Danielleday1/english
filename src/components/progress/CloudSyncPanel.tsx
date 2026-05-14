import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Cloud, CloudDownload, CloudUpload, LogOut, Mail, RefreshCw } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import type { CloudSyncDisplayStatus } from "../../types/study";
import { ConfirmDialog } from "../common/ConfirmDialog";

function formatTimestamp(value?: string): string {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: CloudSyncDisplayStatus): string {
  const labels: Record<CloudSyncDisplayStatus, string> = {
    synced: "已同步",
    syncing: "同步中",
    pending: "有未同步内容",
    failed: "同步失败",
    offline: "离线保存中",
    signed_out: "未登录",
    local_only: "仅本机保存",
  };
  return labels[status];
}

function getStatusTone(status: CloudSyncDisplayStatus): string {
  if (status === "synced") {
    return "border-emerald-200 bg-emerald-50/80 text-emerald-700";
  }
  if (status === "syncing") {
    return "border-sky-200 bg-sky-50/80 text-sky-700";
  }
  if (status === "pending") {
    return "border-amber-200 bg-amber-50/80 text-amber-700";
  }
  if (status === "failed") {
    return "border-rose-200 bg-rose-50/80 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function CloudSyncPanel() {
  const { cloudSync, requestCloudMagicLink, syncCloudNow, pushCloudBackup, pullCloudBackup, signOutCloudUser } = useAppContext();
  const [email, setEmail] = useState(cloudSync.accountEmail ?? cloudSync.userEmail ?? "");
  const [confirmPullOpen, setConfirmPullOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const nextEmail = cloudSync.accountEmail ?? cloudSync.userEmail;
    if (nextEmail) {
      setEmail(nextEmail);
    }
  }, [cloudSync.accountEmail, cloudSync.userEmail]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const canRequestMagicLink = !isSubmitting && remainingSeconds === 0;

  async function runAction(action: () => Promise<void>) {
    setIsSubmitting(true);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMagicLinkRequest() {
    if (!canRequestMagicLink) {
      return;
    }

    await runAction(async () => {
      await requestCloudMagicLink(email);
      setCooldownUntil(Date.now() + 60_000);
      setNow(Date.now());
    });
  }

  return (
    <section className="panel-soft p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            <Cloud className="h-3.5 w-3.5" />
            Cloud Sync
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">云端同步</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              练习记录会自动保存在本机，并在联网时同步到云端。换电脑登录同一账号后，会自动恢复最新数据。
            </p>
          </div>
        </div>

        <div className={clsx("rounded-2xl border px-4 py-3 text-sm font-medium", getStatusTone(cloudSync.displayStatus))}>
          {getStatusLabel(cloudSync.displayStatus)}
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200/70 bg-white/80 p-5">
        {!cloudSync.isConfigured ? (
          <div className="space-y-3">
            <p className="text-sm leading-7 text-slate-600">
              这台站点还没有接上 Supabase，所以现在仍然是本机保存。配置好 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
              后，这里就会变成自动同步入口。
            </p>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              本地开发：在 `.env.local` 里配置
              <br />
              GitHub Pages：在仓库 Secrets 里配置同名变量
            </div>
          </div>
        ) : !cloudSync.isSignedIn ? (
          <div className="space-y-4">
            <div>
              <label className="field-label">登录邮箱</label>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className="field pl-11"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleMagicLinkRequest()}
                  disabled={!canRequestMagicLink}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {remainingSeconds > 0 ? `${remainingSeconds} 秒后可重发` : "发送登录链接"}
                </button>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-500">
              登录方式使用邮箱 magic link，不需要记密码。首次登录时，系统会自动判断本机和云端数据，并恢复最新记录。
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>当前账号</p>
                <p className="mt-2 font-medium text-ink">{cloudSync.accountEmail ?? cloudSync.userEmail}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>同步状态</p>
                <p className="mt-2 font-medium text-ink">{getStatusLabel(cloudSync.displayStatus)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>最后同步时间</p>
                <p className="mt-2 font-medium text-ink">{formatTimestamp(cloudSync.lastSyncedAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>自动同步</p>
                <p className="mt-2 font-medium text-ink">{cloudSync.autoSyncEnabled ? "已开启" : "未开启"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>本机数据更新时间</p>
                <p className="mt-2 font-medium text-ink">{formatTimestamp(cloudSync.localUpdatedAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>云端数据更新时间</p>
                <p className="mt-2 font-medium text-ink">{formatTimestamp(cloudSync.cloudUpdatedAt ?? cloudSync.remoteUpdatedAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void runAction(syncCloudNow)}
                disabled={isSubmitting || cloudSync.isSyncing}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={clsx("h-4 w-4", cloudSync.isSyncing && "animate-spin")} />
                立即同步
              </button>
              <p className="text-sm leading-7 text-slate-500">
                文字记录和已保存录音都会参与同步，录音也会继续保留在本机作为缓存。
              </p>
            </div>

            {cloudSync.message ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-500">{cloudSync.message}</div>
            ) : null}

            <div className="rounded-[24px] border border-slate-200/70 bg-white/70">
              <button
                type="button"
                onClick={() => setAdvancedOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700"
              >
                高级操作
                <ChevronDown className={clsx("h-4 w-4 transition", advancedOpen && "rotate-180")} />
              </button>

              {advancedOpen ? (
                <div className="space-y-4 border-t border-slate-200/70 px-4 py-4">
                  <p className="text-sm leading-7 text-slate-500">
                    通常不需要使用这些操作。只有在自动同步异常、换设备恢复失败或需要强制覆盖数据时再使用。
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void runAction(pushCloudBackup)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CloudUpload className="h-4 w-4" />
                      强制上传本机数据到云端
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPullOpen(true)}
                      disabled={isSubmitting || !cloudSync.hasRemoteSnapshot}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CloudDownload className="h-4 w-4" />
                      强制从云端恢复到这台电脑
                    </button>
                    <button
                      type="button"
                      onClick={() => void runAction(signOutCloudUser)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4" />
                      退出云端
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {cloudSync.message && !cloudSync.isSignedIn ? <p className="mt-4 text-sm leading-7 text-slate-500">{cloudSync.message}</p> : null}

      <ConfirmDialog
        open={confirmPullOpen}
        title="确认强制从云端恢复？"
        description="这会用云端数据覆盖当前浏览器里的本机数据。通常只在自动同步异常时使用。"
        confirmLabel="确认恢复"
        onConfirm={() => void runAction(async () => {
          await pullCloudBackup();
          setConfirmPullOpen(false);
        })}
        onCancel={() => setConfirmPullOpen(false)}
      />
    </section>
  );
}
