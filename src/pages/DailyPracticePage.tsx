import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { ProgressBar } from "../components/common/ProgressBar";
import { StepCard } from "../components/common/StepCard";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/layout/PageHeader";
import { DailyReportCard } from "../components/daily/DailyReportCard";
import { DailyReviewForm } from "../components/daily/DailyReviewForm";
import { IELTSSpeakingForm } from "../components/daily/IELTSSpeakingForm";
import { IELTSListeningForm } from "../components/daily/IELTSListeningForm";
import { IntensiveListeningForm } from "../components/daily/IntensiveListeningForm";
import { KeywordInput } from "../components/daily/KeywordInput";
import { MaterialForm } from "../components/daily/MaterialForm";
import { SentenceEditor } from "../components/daily/SentenceEditor";
import { ShadowingTracker } from "../components/daily/ShadowingTracker";
import { WarmupStep } from "../components/daily/WarmupStep";
import { AudioRecorder } from "../components/daily/AudioRecorder";
import type { IELTSPracticeType, PracticeMode, Sentence, StudySession } from "../types/study";
import {
  calculateSessionProgress,
  createEmptyShadowingRecords,
  hasMeaningfulSessionContent,
  normalizeActualMinutes,
} from "../utils/study";
import {
  getPlannedMinutes,
  getPracticeSteps,
  IELTS_ADDON_OPTIONS,
  IELTS_PRACTICE_TYPE_OPTIONS,
  normalizeIELTSPracticeType,
  normalizePracticeMode,
  normalizePracticeSession,
  PRACTICE_MODE_OPTIONS,
  type PracticeStepConfig,
  type PracticeStepId,
} from "../utils/practiceMode";

interface DailyPracticePageProps {
  session: StudySession;
  onSessionChange: (session: StudySession) => void;
  onComplete: (session: StudySession) => void;
  onSyncSentences: (sessionId: string, sentences: Sentence[]) => void;
}

function getDefaultOpenStep(session: StudySession, steps: PracticeStepConfig[]): PracticeStepId {
  return (steps.find((step) => !session.completedSteps.includes(step.id)) ?? steps[0]).id;
}

function getStepDescription(stepId: PracticeStepId): string {
  const descriptions: Record<PracticeStepId, string> = {
    material: "输入今天的播客、视频或材料来源。链接只用于记录，不做自动解析。",
    warmup: "先把声音打开。今天不需要完美，只需要进入英语状态。",
    blindListening: "先听 1-2 分钟，不看字幕，只记录你听到的关键词。",
    intensiveListening: "第二遍可以打开字幕或文本，重点搞懂大意和逻辑。",
    sentences: "把今天真正想带走的 3 句表达整理出来，保存进句型库。",
    shadowing: "针对今日 3 句做重复练习。完成 5 次后，这张卡片会自然变成完成状态。",
    workplaceSpeaking: "Summarize today’s clip and give your opinion.",
    ieltsPracticeChoice: "雅思训练不是重复精听。这里重点练看题、定位、做题、错因复盘和限时表达。",
    ieltsAddonChoice: "混合训练只加练一个雅思专项，让今天的任务保持轻一点。",
    ieltsListening: "输入总题数和答对题数后，会自动计算正确率。",
    ieltsSpeaking: "按 Part 选择准备计时器，录音仍然会本地保存。",
    review: "把收获和问题留下来，明天打开页面时就能接着往前走。",
  };
  return descriptions[stepId];
}

function hasHiddenContent(session: StudySession, nextMode: PracticeMode, nextType: IELTSPracticeType): boolean {
  const currentSteps = new Set(getPracticeSteps(normalizePracticeMode(session.practiceMode), normalizeIELTSPracticeType(normalizePracticeMode(session.practiceMode), session.ieltsPracticeType)).map((step) => step.id));
  const nextSteps = new Set(getPracticeSteps(nextMode, nextType).map((step) => step.id));

  if (currentSteps.has("ieltsListening") && !nextSteps.has("ieltsListening")) {
    if (session.ieltsListening.materialName.trim() || session.ieltsListening.totalQuestions > 0 || session.ieltsListening.notes.trim()) {
      return true;
    }
  }

  if (currentSteps.has("ieltsSpeaking") && !nextSteps.has("ieltsSpeaking")) {
    if (session.ieltsSpeaking.prompt.trim() || session.ieltsSpeaking.transcript.trim() || session.ieltsSpeaking.recordingId) {
      return true;
    }
  }

  if (currentSteps.has("workplaceSpeaking") && !nextSteps.has("workplaceSpeaking")) {
    if (session.workplaceSpeaking.transcript.trim() || session.workplaceSpeaking.recordingId) {
      return true;
    }
  }

  return false;
}

export function DailyPracticePage({ session, onSessionChange, onComplete, onSyncSentences }: DailyPracticePageProps) {
  const sessionWithMode = useMemo(() => normalizePracticeSession(session), [session]);
  const steps = useMemo(
    () => getPracticeSteps(sessionWithMode.practiceMode, sessionWithMode.ieltsPracticeType),
    [sessionWithMode.practiceMode, sessionWithMode.ieltsPracticeType],
  );
  const [openStep, setOpenStep] = useState<PracticeStepId>(getDefaultOpenStep(sessionWithMode, steps));
  const [message, setMessage] = useState("");
  const [pendingModeChange, setPendingModeChange] = useState<{ mode: PracticeMode; type: IELTSPracticeType } | null>(null);
  const normalizedSession = normalizeActualMinutes(sessionWithMode);
  const progress = calculateSessionProgress(normalizedSession);

  useEffect(() => {
    const normalized = normalizePracticeSession(session);
    if (
      normalized.practiceMode !== session.practiceMode ||
      normalized.ieltsPracticeType !== session.ieltsPracticeType ||
      normalized.plannedMinutes !== session.plannedMinutes ||
      normalized.completedSteps.length !== session.completedSteps.length
    ) {
      onSessionChange(normalized);
    }
  }, [session, onSessionChange]);

  useEffect(() => {
    setOpenStep(getDefaultOpenStep(sessionWithMode, steps));
  }, [sessionWithMode.id, sessionWithMode.practiceMode, sessionWithMode.ieltsPracticeType, steps]);

  useEffect(() => {
    if (!steps.some((step) => step.id === "shadowing")) {
      return;
    }

    const activeSentences = session.sentences.filter((sentence) => sentence.text.trim());
    if (activeSentences.length === 0 || session.completedSteps.includes("shadowing")) {
      return;
    }

    const allCompleted = activeSentences.every((sentence) => {
      const record = session.shadowing.find((item) => item.sentenceId === sentence.id);
      return (record?.repeatCount ?? 0) >= 5;
    });

    if (allCompleted) {
      completeStep("shadowing", "跟读 5 次已完成，继续下一步。");
    }
  }, [session.sentences, session.shadowing, session.completedSteps, steps]);

  function updateSession(nextSession: StudySession) {
    onSessionChange({
      ...normalizeActualMinutes(normalizePracticeSession(nextSession)),
      updatedAt: new Date().toISOString(),
    });
  }

  function applyModeChange(mode: PracticeMode, type: IELTSPracticeType) {
    const ieltsPracticeType = normalizeIELTSPracticeType(mode, type);
    const stepIds = new Set(getPracticeSteps(mode, ieltsPracticeType).map((step) => step.id));
    const nextSession = normalizeActualMinutes({
      ...session,
      practiceMode: mode,
      ieltsPracticeType,
      plannedMinutes: getPlannedMinutes(mode, ieltsPracticeType),
      completedSteps: session.completedSteps.filter((stepId) => stepIds.has(stepId as PracticeStepId)),
      updatedAt: new Date().toISOString(),
    });
    onSessionChange(nextSession);
    setOpenStep(getDefaultOpenStep(nextSession, getPracticeSteps(mode, ieltsPracticeType)));
    setMessage("训练模式已更新。隐藏的内容仍然保留在今天草稿里。");
  }

  function requestModeChange(mode: PracticeMode, type?: IELTSPracticeType) {
    const normalizedType = normalizeIELTSPracticeType(mode, type ?? sessionWithMode.ieltsPracticeType);
    if (mode === sessionWithMode.practiceMode && normalizedType === sessionWithMode.ieltsPracticeType) {
      return;
    }

    if (hasHiddenContent(session, mode, normalizedType)) {
      setPendingModeChange({ mode, type: normalizedType });
      return;
    }

    applyModeChange(mode, normalizedType);
  }

  function getNextStepId(stepId: PracticeStepId): PracticeStepId | undefined {
    const currentIndex = steps.findIndex((step) => step.id === stepId);
    return steps[currentIndex + 1]?.id;
  }

  function completeStep(stepId: PracticeStepId, successMessage: string, options?: { advanceToNextStep?: boolean }) {
    const visibleStepIds = new Set(steps.map((step) => step.id));
    const nextCompletedSteps = normalizedSession.completedSteps.includes(stepId)
      ? normalizedSession.completedSteps
      : [...normalizedSession.completedSteps.filter((id) => visibleStepIds.has(id as PracticeStepId)), stepId];

    updateSession({
      ...normalizedSession,
      completedSteps: nextCompletedSteps,
    });
    setMessage(successMessage);

    if (options?.advanceToNextStep === false) {
      return;
    }

    const nextStepId = getNextStepId(stepId);
    if (nextStepId) {
      setOpenStep(nextStepId);
    }
  }

  function saveDraft() {
    updateSession(normalizedSession);
    setMessage("草稿已保存。刷新页面后也会保留。");
  }

  function completeToday() {
    if (!hasMeaningfulSessionContent(normalizedSession)) {
      setMessage("至少先写下一个材料标题或一条学习记录，再保存今天的练习。");
      return;
    }

    if (normalizedSession.completedSteps.length < steps.length) {
      setMessage("还有部分内容未填写，仍然可以保存今天的练习。");
    } else {
      setMessage("今天的训练已经完成，首页统计会同步更新。");
    }

    onSyncSentences(normalizedSession.id, normalizedSession.sentences);
    onComplete({
      ...normalizedSession,
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateSentences(sentences: Sentence[]) {
    const withTimestamps = sentences.map((sentence) => ({
      ...sentence,
      updatedAt: new Date().toISOString(),
    }));
    const activeIds = new Set(withTimestamps.filter((sentence) => sentence.text.trim()).map((sentence) => sentence.id));
    const baseShadowing = createEmptyShadowingRecords(withTimestamps.filter((sentence) => sentence.text.trim()));
    const nextShadowing = baseShadowing.map((record) => {
      const existing = normalizedSession.shadowing.find((item) => item.sentenceId === record.sentenceId);
      return existing ?? record;
    });

    updateSession({
      ...normalizedSession,
      sentences: withTimestamps,
      shadowing: nextShadowing.filter((record) => activeIds.has(record.sentenceId)),
    });
  }

  function renderModeSelector() {
    return (
      <section className="panel-soft p-5">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Practice Mode</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">今天想怎么练？</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">今天不需要把所有模块都练完。选择一个模式，完成一个闭环就够了。</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {PRACTICE_MODE_OPTIONS.map((option) => {
            const selected = normalizedSession.practiceMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => requestModeChange(option.id)}
                className={clsx(
                  "rounded-[24px] border p-4 text-left transition",
                  selected ? "border-sky-200 bg-sky-50/70 shadow-soft" : "border-slate-200/80 bg-white/80 hover:border-slate-300",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-semibold text-ink">{option.title}</h4>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-slate-500">{option.estimatedMinutes} 分钟</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderIeltsChoice(addon = false) {
    const options = addon ? IELTS_ADDON_OPTIONS : IELTS_PRACTICE_TYPE_OPTIONS;
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-slate-50/80 px-4 py-3 text-sm leading-7 text-slate-500">
          {addon
            ? "混合训练只选择一个雅思专项加练，不需要把考试模块全部塞进同一天。"
            : "雅思训练不是重复精听。这里重点练看题、定位、做题、错因复盘和限时表达。"}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {options.map((option) => {
            const selected = normalizedSession.ieltsPracticeType === option.value;
            const minutes = "minutes" in option && typeof option.minutes === "number" ? option.minutes : undefined;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => requestModeChange(normalizedSession.practiceMode, option.value)}
                className={clsx(
                  "rounded-[22px] border px-4 py-3 text-left text-sm transition",
                  selected ? "border-sky-200 bg-sky-50/80 text-ink" : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300",
                )}
              >
                <span className="font-medium">{option.label}</span>
                {minutes ? <span className="mt-2 block text-xs text-slate-400">{minutes} 分钟</span> : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => completeStep(addon ? "ieltsAddonChoice" : "ieltsPracticeChoice", "雅思训练类型已保存。")}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          完成这一步
        </button>
      </div>
    );
  }

  function renderStepContent(stepId: PracticeStepId) {
    if (stepId === "material") {
      return (
        <MaterialForm
          material={normalizedSession.material}
          onChange={(material) => updateSession({ ...normalizedSession, material })}
          onSave={() => completeStep("material", "材料已保存，继续下一步。")}
        />
      );
    }

    if (stepId === "warmup") {
      return (
        <WarmupStep
          value={normalizedSession.warmup}
          onChange={(warmup) => updateSession({ ...normalizedSession, warmup })}
          onComplete={() => completeStep("warmup", "热身完成，今天已经开始了。")}
        />
      );
    }

    if (stepId === "blindListening") {
      return (
        <div className="space-y-5">
          <KeywordInput value={normalizedSession.blindListening} onChange={(blindListening) => updateSession({ ...normalizedSession, blindListening })} />
          <button type="button" onClick={() => completeStep("blindListening", "关键词已保存，继续下一步。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    if (stepId === "intensiveListening") {
      return (
        <div className="space-y-5">
          <IntensiveListeningForm
            value={normalizedSession.intensiveListening}
            onChange={(intensiveListening) => updateSession({ ...normalizedSession, intensiveListening })}
          />
          <button type="button" onClick={() => completeStep("intensiveListening", "精听理解已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    if (stepId === "sentences") {
      return (
        <SentenceEditor
          sentences={normalizedSession.sentences}
          onChange={updateSentences}
          onSave={() => {
            onSyncSentences(normalizedSession.id, normalizedSession.sentences);
            completeStep("sentences", "句子已同步到 Sentence Bank。");
          }}
        />
      );
    }

    if (stepId === "shadowing") {
      return (
        <div className="space-y-5">
          <ShadowingTracker shadowing={normalizedSession.shadowing} sentences={normalizedSession.sentences} onChange={(shadowing) => updateSession({ ...normalizedSession, shadowing })} />
          <button type="button" onClick={() => completeStep("shadowing", "跟读打卡已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    if (stepId === "workplaceSpeaking") {
      return (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5">
            <label className="field-label">题目</label>
            <input
              className="field"
              value={normalizedSession.workplaceSpeaking.prompt}
              onChange={(event) =>
                updateSession({
                  ...normalizedSession,
                  workplaceSpeaking: { ...normalizedSession.workplaceSpeaking, prompt: event.target.value },
                })
              }
            />
            <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 text-sm leading-7 text-slate-500">
              This clip is mainly about...
              <br />
              The speaker thinks that...
              <br />
              One important point is...
              <br />
              From my perspective...
            </div>
          </div>

          <AudioRecorder
            sessionId={normalizedSession.id}
            recordingType="workplace"
            recordingId={normalizedSession.workplaceSpeaking.recordingId}
            onSaved={(recordingId, duration) =>
              updateSession({
                ...normalizedSession,
                workplaceSpeaking: { ...normalizedSession.workplaceSpeaking, recordingId, duration },
              })
            }
            onDeleted={() =>
              updateSession({
                ...normalizedSession,
                workplaceSpeaking: { ...normalizedSession.workplaceSpeaking, recordingId: undefined, duration: 0 },
              })
            }
          />

          <div>
            <label className="field-label">我的英文复述文本</label>
            <textarea
              className="field min-h-28"
              value={normalizedSession.workplaceSpeaking.transcript}
              onChange={(event) =>
                updateSession({
                  ...normalizedSession,
                  workplaceSpeaking: { ...normalizedSession.workplaceSpeaking, transcript: event.target.value },
                })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["fluencyScore", "流畅度"],
              ["clarityScore", "清晰度"],
              ["confidenceScore", "自信度"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={normalizedSession.workplaceSpeaking[key as "fluencyScore" | "clarityScore" | "confidenceScore"]}
                  onChange={(event) =>
                    updateSession({
                      ...normalizedSession,
                      workplaceSpeaking: { ...normalizedSession.workplaceSpeaking, [key]: Number(event.target.value) },
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
                />
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 p-5">
            <h4 className="text-base font-semibold text-ink">未来 AI 反馈</h4>
            <p className="mt-3 text-sm leading-7 text-slate-500">这里未来可以显示自动转写、表达纠错、自然版表达和职场版表达。第一版只做静态占位，不接接口。</p>
          </div>

          <button type="button" onClick={() => completeStep("workplaceSpeaking", "职场口语输出已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    if (stepId === "ieltsPracticeChoice") {
      return renderIeltsChoice(false);
    }

    if (stepId === "ieltsAddonChoice") {
      return renderIeltsChoice(true);
    }

    if (stepId === "ieltsListening") {
      return (
        <div className="space-y-5">
          <IELTSListeningForm value={normalizedSession.ieltsListening} onChange={(ieltsListening) => updateSession({ ...normalizedSession, ieltsListening })} />
          <button type="button" onClick={() => completeStep("ieltsListening", "雅思听力记录已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    if (stepId === "ieltsSpeaking") {
      return (
        <div className="space-y-5">
          <IELTSSpeakingForm sessionId={normalizedSession.id} value={normalizedSession.ieltsSpeaking} onChange={(ieltsSpeaking) => updateSession({ ...normalizedSession, ieltsSpeaking })} />
          <button type="button" onClick={() => completeStep("ieltsSpeaking", "雅思口语训练已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            完成这一步
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <DailyReviewForm
          review={normalizedSession.review}
          actualMinutes={normalizedSession.actualMinutes}
          completionRate={progress}
          onReviewChange={(review) => updateSession({ ...normalizedSession, review })}
          onActualMinutesChange={(actualMinutes) => updateSession({ ...normalizedSession, actualMinutes })}
        />
        <button
          type="button"
          onClick={() => completeStep("review", "今日复盘已保存。", { advanceToNextStep: false })}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          完成这一步
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Practice"
        title={normalizedSession.isCompleted ? "今天的练习已经存好了" : "今天的训练流程"}
        description="页面会自动保存本地草稿。选择一个模式，完成一个闭环就够了。"
        actions={
          <>
            <button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600">
              <Save className="h-4 w-4" />
              保存草稿
            </button>
            <button type="button" onClick={completeToday} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white">
              完成今日训练
            </button>
          </>
        }
      />

      {renderModeSelector()}

      {normalizedSession.practiceMode === "workplace" ? (
        <p className="rounded-[24px] bg-white/70 px-5 py-3 text-sm leading-7 text-slate-500">用真实材料训练听懂、跟读、复述和表达。</p>
      ) : null}
      {normalizedSession.practiceMode === "ielts" ? (
        <p className="rounded-[24px] bg-white/70 px-5 py-3 text-sm leading-7 text-slate-500">用考试题型训练定位、错因复盘和限时表达。</p>
      ) : null}
      {normalizedSession.practiceMode === "mixed" ? (
        <p className="rounded-[24px] bg-white/70 px-5 py-3 text-sm leading-7 text-slate-500">时间充足时使用，同时保留职场表达和雅思专项。</p>
      ) : null}

      <section className="panel-soft p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>今日日期：{normalizedSession.date}</span>
              <span>已完成步骤：{normalizedSession.completedSteps.length}/{steps.length}</span>
              <span>今日计划时间：{normalizedSession.plannedMinutes} 分钟</span>
              <span>今日实际记录时间：{normalizedSession.actualMinutes} 分钟</span>
            </div>
            <ProgressBar value={progress} label="今日总进度" tone={normalizedSession.isCompleted ? "success" : "default"} />
          </div>
          {message ? <p className="max-w-md rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">{message}</p> : null}
        </div>
      </section>

      {normalizedSession.isCompleted ? <DailyReportCard session={normalizedSession} /> : null}

      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            title={step.title}
            description={getStepDescription(step.id)}
            isOpen={openStep === step.id}
            isCompleted={normalizedSession.completedSteps.includes(step.id)}
            stepIndex={index + 1}
            plannedMinutes={step.minutes}
            onToggle={() => setOpenStep(openStep === step.id ? "review" : step.id)}
          >
            {renderStepContent(step.id)}
          </StepCard>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingModeChange)}
        title="切换训练模式？"
        description="切换训练模式可能会隐藏部分已填写内容，但不会立即删除。确定切换吗？"
        confirmLabel="确定切换"
        onConfirm={() => {
          if (pendingModeChange) {
            applyModeChange(pendingModeChange.mode, pendingModeChange.type);
          }
          setPendingModeChange(null);
        }}
        onCancel={() => setPendingModeChange(null)}
      />
    </div>
  );
}
