import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DAILY_PLANNED_MINUTES, STEP_CONFIG } from "../constants/options";
import { ProgressBar } from "../components/common/ProgressBar";
import { StepCard } from "../components/common/StepCard";
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
import type { Sentence, StudySession } from "../types/study";
import {
  calculateSessionProgress,
  createEmptyShadowingRecords,
  hasMeaningfulSessionContent,
  normalizeActualMinutes,
} from "../utils/study";

interface DailyPracticePageProps {
  session: StudySession;
  onSessionChange: (session: StudySession) => void;
  onComplete: (session: StudySession) => void;
  onSyncSentences: (sessionId: string, sentences: Sentence[]) => void;
}

function getDefaultOpenStep(session: StudySession): string {
  return STEP_CONFIG.find((step) => !session.completedSteps.includes(step.id))?.id ?? STEP_CONFIG[0].id;
}

export function DailyPracticePage({ session, onSessionChange, onComplete, onSyncSentences }: DailyPracticePageProps) {
  const [openStep, setOpenStep] = useState(getDefaultOpenStep(session));
  const [message, setMessage] = useState("");
  const normalizedSession = normalizeActualMinutes(session);

  useEffect(() => {
    setOpenStep(getDefaultOpenStep(session));
  }, [session.id]);

  useEffect(() => {
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
  }, [session.sentences, session.shadowing, session.completedSteps]);

  function updateSession(nextSession: StudySession) {
    onSessionChange({
      ...normalizeActualMinutes(nextSession),
      updatedAt: new Date().toISOString(),
    });
  }

  function getNextStepId(stepId: string): string | undefined {
    const currentIndex = STEP_CONFIG.findIndex((step) => step.id === stepId);
    return STEP_CONFIG[currentIndex + 1]?.id;
  }

  function completeStep(stepId: string, successMessage: string, options?: { advanceToNextStep?: boolean }) {
    const nextCompletedSteps = session.completedSteps.includes(stepId)
      ? session.completedSteps
      : [...session.completedSteps, stepId];

    updateSession({
      ...session,
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
    if (!hasMeaningfulSessionContent(session)) {
      setMessage("至少先写下一个材料标题或一条学习记录，再保存今天的练习。");
      return;
    }

    if (session.completedSteps.length < STEP_CONFIG.length) {
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
      const existing = session.shadowing.find((item) => item.sentenceId === record.sentenceId);
      return existing ?? record;
    });

    updateSession({
      ...session,
      sentences: withTimestamps,
      shadowing: nextShadowing.filter((record) => activeIds.has(record.sentenceId)),
    });
  }

  const progress = calculateSessionProgress(normalizedSession);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Practice"
        title={session.isCompleted ? "今天的练习已经存好了" : "今天的训练流程"}
        description="页面会自动保存本地草稿。你可以中途离开，回来继续，不需要重新组织今天怎么学。"
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

      <section className="panel-soft p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>今日日期：{session.date}</span>
              <span>已完成步骤：{session.completedSteps.length}/10</span>
              <span>今日计划时间：{DAILY_PLANNED_MINUTES} 分钟</span>
              <span>今日实际记录时间：{normalizedSession.actualMinutes} 分钟</span>
            </div>
            <ProgressBar value={progress} label="今日总进度" tone={session.isCompleted ? "success" : "default"} />
          </div>
          {message ? <p className="max-w-md rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">{message}</p> : null}
        </div>
      </section>

      {session.isCompleted ? <DailyReportCard session={session} /> : null}

      <div className="space-y-4">
        <StepCard
          title="输入今日材料"
          description="输入今天的播客、视频或雅思材料来源。链接只用于记录，不做自动解析。"
          isOpen={openStep === "material"}
          isCompleted={session.completedSteps.includes("material")}
          stepIndex={1}
          plannedMinutes={0}
          onToggle={() => setOpenStep(openStep === "material" ? "" : "material")}
        >
          <MaterialForm
            material={session.material}
            onChange={(material) => updateSession({ ...session, material })}
            onSave={() => completeStep("material", "材料已保存，继续下一步。")}
          />
        </StepCard>

        <StepCard
          title="热身开口"
          description="先把声音打开。今天不需要完美，只需要进入英语状态。"
          isOpen={openStep === "warmup"}
          isCompleted={session.completedSteps.includes("warmup")}
          stepIndex={2}
          plannedMinutes={5}
          onToggle={() => setOpenStep(openStep === "warmup" ? "" : "warmup")}
        >
          <WarmupStep
            value={session.warmup}
            onChange={(warmup) => updateSession({ ...session, warmup })}
            onComplete={() => completeStep("warmup", "热身完成，今天已经开始了。")}
          />
        </StepCard>

        <StepCard
          title="盲听关键词"
          description="先听 1–2 分钟，不看字幕，只记录你听到的关键词。"
          isOpen={openStep === "blindListening"}
          isCompleted={session.completedSteps.includes("blindListening")}
          stepIndex={3}
          plannedMinutes={10}
          onToggle={() => setOpenStep(openStep === "blindListening" ? "" : "blindListening")}
        >
          <div className="space-y-5">
            <KeywordInput value={session.blindListening} onChange={(blindListening) => updateSession({ ...session, blindListening })} />
            <button type="button" onClick={() => completeStep("blindListening", "盲听关键词已保存，继续精听。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="精听理解"
          description="第二遍可以打开字幕或文本，重点搞懂大意和逻辑。"
          isOpen={openStep === "intensiveListening"}
          isCompleted={session.completedSteps.includes("intensiveListening")}
          stepIndex={4}
          plannedMinutes={25}
          onToggle={() => setOpenStep(openStep === "intensiveListening" ? "" : "intensiveListening")}
        >
          <div className="space-y-5">
            <IntensiveListeningForm
              value={session.intensiveListening}
              onChange={(intensiveListening) => updateSession({ ...session, intensiveListening })}
            />
            <button type="button" onClick={() => completeStep("intensiveListening", "精听理解已保存，去挑今天的 3 句。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="今日 3 句"
          description="把今天真正想带走的 3 句表达整理出来，保存进句型库。"
          isOpen={openStep === "sentences"}
          isCompleted={session.completedSteps.includes("sentences")}
          stepIndex={5}
          plannedMinutes={15}
          onToggle={() => setOpenStep(openStep === "sentences" ? "" : "sentences")}
        >
          <SentenceEditor
            sentences={session.sentences}
            onChange={updateSentences}
            onSave={() => {
              onSyncSentences(session.id, session.sentences);
              completeStep("sentences", "句子已同步到 Sentence Bank。");
            }}
          />
        </StepCard>

        <StepCard
          title="跟读打卡"
          description="针对今日 3 句做重复练习。完成 5 次后，这张卡片会自然变成完成状态。"
          isOpen={openStep === "shadowing"}
          isCompleted={session.completedSteps.includes("shadowing")}
          stepIndex={6}
          plannedMinutes={20}
          onToggle={() => setOpenStep(openStep === "shadowing" ? "" : "shadowing")}
        >
          <div className="space-y-5">
            <ShadowingTracker shadowing={session.shadowing} sentences={session.sentences} onChange={(shadowing) => updateSession({ ...session, shadowing })} />
            <button type="button" onClick={() => completeStep("shadowing", "跟读打卡已保存，继续开口输出。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="职场口语输出"
          description="Summarize today’s clip and give your opinion."
          isOpen={openStep === "workplaceSpeaking"}
          isCompleted={session.completedSteps.includes("workplaceSpeaking")}
          stepIndex={7}
          plannedMinutes={15}
          onToggle={() => setOpenStep(openStep === "workplaceSpeaking" ? "" : "workplaceSpeaking")}
        >
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5">
              <label className="field-label">题目</label>
              <input
                className="field"
                value={session.workplaceSpeaking.prompt}
                onChange={(event) =>
                  updateSession({
                    ...session,
                    workplaceSpeaking: { ...session.workplaceSpeaking, prompt: event.target.value },
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
              sessionId={session.id}
              recordingType="workplace"
              recordingId={session.workplaceSpeaking.recordingId}
              onSaved={(recordingId, duration) =>
                updateSession({
                  ...session,
                  workplaceSpeaking: { ...session.workplaceSpeaking, recordingId, duration },
                })
              }
              onDeleted={() =>
                updateSession({
                  ...session,
                  workplaceSpeaking: { ...session.workplaceSpeaking, recordingId: undefined, duration: 0 },
                })
              }
            />

            <div>
              <label className="field-label">我的英文复述文本</label>
              <textarea
                className="field min-h-28"
                value={session.workplaceSpeaking.transcript}
                onChange={(event) =>
                  updateSession({
                    ...session,
                    workplaceSpeaking: { ...session.workplaceSpeaking, transcript: event.target.value },
                  })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="field-label">流畅度</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={session.workplaceSpeaking.fluencyScore}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      workplaceSpeaking: { ...session.workplaceSpeaking, fluencyScore: Number(event.target.value) },
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
                />
              </div>
              <div>
                <label className="field-label">清晰度</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={session.workplaceSpeaking.clarityScore}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      workplaceSpeaking: { ...session.workplaceSpeaking, clarityScore: Number(event.target.value) },
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
                />
              </div>
              <div>
                <label className="field-label">自信度</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={session.workplaceSpeaking.confidenceScore}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      workplaceSpeaking: { ...session.workplaceSpeaking, confidenceScore: Number(event.target.value) },
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 p-5">
              <h4 className="text-base font-semibold text-ink">未来 AI 反馈</h4>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                这里未来可以显示自动转写、表达纠错、自然版表达和职场版表达。第一版只做静态占位，不接接口。
              </p>
            </div>

            <button type="button" onClick={() => completeStep("workplaceSpeaking", "职场口语输出已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="雅思听力训练"
          description="输入总题数和答对题数后，会自动计算正确率。"
          isOpen={openStep === "ieltsListening"}
          isCompleted={session.completedSteps.includes("ieltsListening")}
          stepIndex={8}
          plannedMinutes={25}
          onToggle={() => setOpenStep(openStep === "ieltsListening" ? "" : "ieltsListening")}
        >
          <div className="space-y-5">
            <IELTSListeningForm value={session.ieltsListening} onChange={(ieltsListening) => updateSession({ ...session, ieltsListening })} />
            <button type="button" onClick={() => completeStep("ieltsListening", "雅思听力记录已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="雅思口语训练"
          description="按 Part 选择准备计时器，录音仍然会本地保存。"
          isOpen={openStep === "ieltsSpeaking"}
          isCompleted={session.completedSteps.includes("ieltsSpeaking")}
          stepIndex={9}
          plannedMinutes={25}
          onToggle={() => setOpenStep(openStep === "ieltsSpeaking" ? "" : "ieltsSpeaking")}
        >
          <div className="space-y-5">
            <IELTSSpeakingForm sessionId={session.id} value={session.ieltsSpeaking} onChange={(ieltsSpeaking) => updateSession({ ...session, ieltsSpeaking })} />
            <button type="button" onClick={() => completeStep("ieltsSpeaking", "雅思口语训练已保存。")} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              完成这一步
            </button>
          </div>
        </StepCard>

        <StepCard
          title="今日复盘"
          description="把收获和问题留下来，明天打开页面时就能接着往前走。"
          isOpen={openStep === "review"}
          isCompleted={session.completedSteps.includes("review")}
          stepIndex={10}
          plannedMinutes={5}
          onToggle={() => setOpenStep(openStep === "review" ? "" : "review")}
        >
          <div className="space-y-5">
            <DailyReviewForm
              review={session.review}
              actualMinutes={normalizedSession.actualMinutes}
              completionRate={progress}
              onReviewChange={(review) => updateSession({ ...session, review })}
              onActualMinutesChange={(actualMinutes) => updateSession({ ...session, actualMinutes })}
            />
            <button
              type="button"
              onClick={() => completeStep("review", "今日复盘已保存。", { advanceToNextStep: false })}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
            >
              完成这一步
            </button>
          </div>
        </StepCard>
      </div>
    </div>
  );
}
