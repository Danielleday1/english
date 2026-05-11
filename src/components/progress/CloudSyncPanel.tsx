import { useEffect, useState } from "react";
import { Cloud, CloudDownload, CloudUpload, LogOut, Mail } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { ConfirmDialog } from "../common/ConfirmDialog";

function formatTimestamp(value?: string): string {
  if (!value) {
    return "还没有同步记录";
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

export function CloudSyncPanel() {
  const { cloudSync, requestCloudMagicLink, pushCloudBackup, pullCloudBackup, signOutCloudUser } = useAppContext();
  const [email, setEmail] = useState(cloudSync.userEmail ?? "");
  const [confirmPullOpen, setConfirmPullOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cloudSync.userEmail) {
      setEmail(cloudSync.userEmail);
    }
  }, [cloudSync.userEmail]);

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

  async function handleMagicLinkRequest() {
    if (!canRequestMagicLink) {
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCloudMagicLink(email);
      setCooldownUntil(Date.now() + 60_000);
      setNow(Date.now());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePush() {
    setIsSubmitting(true);
    try {
      await pushCloudBackup();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePull() {
    setIsSubmitting(true);
    try {
      await pullCloudBackup();
      setConfirmPullOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    try {
      await signOutCloudUser();
    } finally {
      setIsSubmitting(false);
    }
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
            <h3 className="text-lg font-semibold text-ink">跨电脑使用</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              现在可以把学习记录和录音同步到云端。以后在别的电脑打开同一个网页，只要登录同一个邮箱，新电脑会优先自动恢复一次历史数据，然后继续本地使用和自动同步。
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 text-sm text-slate-600">
          <p>当前状态：{cloudSync.phase === "setup_required" ? "仅本地保存" : cloudSync.isSignedIn ? "已连接云端" : "未登录云端"}</p>
          <p className="mt-2">最后同步：{formatTimestamp(cloudSync.lastSyncedAt)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200/70 bg-white/80 p-5">
        {!cloudSync.isConfigured ? (
          <div className="space-y-3">
            <p className="text-sm leading-7 text-slate-600">
              这台站点还没有接上 Supabase，所以现在仍然是本地保存。把 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
              配好后，这里就会变成可登录的云端同步入口。
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
              登录方式用邮箱 magic link，不需要单独记密码。第一次连上后，别的电脑也用同一个邮箱进入即可。为了避免邮箱限流，发送后请先等 60 秒，再决定是否重发。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>当前账号</p>
                <p className="mt-2 font-medium text-ink">{cloudSync.userEmail}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>云端最近更新</p>
                <p className="mt-2 font-medium text-ink">{formatTimestamp(cloudSync.remoteUpdatedAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>自动同步</p>
                <p className="mt-2 font-medium text-ink">{cloudSync.autoSyncEnabled ? "已开启" : "还没开始"}</p>
              </div>
            </div>

            {cloudSync.restoreRecommended ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm leading-7 text-sky-900">
                <p className="font-medium">建议先恢复一次云端数据</p>
                <p className="mt-1">{cloudSync.restoreReason ?? "检测到云端可能比本地更新，先恢复会更稳。"}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handlePush()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CloudUpload className="h-4 w-4" />
                上传当前数据到云端
              </button>
              <button
                type="button"
                onClick={() => setConfirmPullOpen(true)}
                disabled={isSubmitting || !cloudSync.hasRemoteSnapshot}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloudDownload className="h-4 w-4" />
                从云端恢复到这台电脑
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                退出云端
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-500">
              第一次建议先点一次“上传当前数据到云端”。之后你继续练习时，新的改动会自动往云端同步；新电脑首次登录如果本地是空的，会自动恢复历史记录，不需要你每次手动点恢复。
            </div>
          </div>
        )}
      </div>

      {cloudSync.message ? <p className="mt-4 text-sm leading-7 text-slate-500">{cloudSync.message}</p> : null}

      <ConfirmDialog
        open={confirmPullOpen}
        title="确认从云端恢复？"
        description="恢复会覆盖当前浏览器里的本地数据。建议先做一次本地备份，再从云端拉取。"
        confirmLabel="确认恢复"
        onConfirm={() => void handlePull()}
        onCancel={() => setConfirmPullOpen(false)}
      />
    </section>
  );
}
