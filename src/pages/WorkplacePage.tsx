import { PageHeader } from "../components/layout/PageHeader";
import { MaterialLibrary } from "../components/workplace/MaterialLibrary";
import { ScenarioTrainingCards } from "../components/workplace/ScenarioTrainingCards";
import { SentenceBank } from "../components/workplace/SentenceBank";
import { SpeakingRecordList } from "../components/workplace/SpeakingRecordList";
import type { StudySession } from "../types/study";

interface WorkplacePageProps {
  sessions: StudySession[];
  onUsePrompt: (prompt: string) => void;
}

export function WorkplacePage({ sessions, onUsePrompt }: WorkplacePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workplace English"
        title="把日常输入慢慢变成你的表达资产"
        description="材料库、句型库和口语记录都会在这里沉淀下来。你不需要每次都从零开始。"
      />

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">材料库</h3>
        <MaterialLibrary sessions={sessions} />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">句型库 Sentence Bank</h3>
        <SentenceBank />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">口语记录</h3>
        <SpeakingRecordList sessions={sessions} />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">场景训练</h3>
        <ScenarioTrainingCards onUsePrompt={onUsePrompt} />
      </section>
    </div>
  );
}
