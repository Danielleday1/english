import { WORKPLACE_SCENARIOS } from "../../constants/options";

interface ScenarioTrainingCardsProps {
  onUsePrompt: (prompt: string) => void;
}

export function ScenarioTrainingCards({ onUsePrompt }: ScenarioTrainingCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {WORKPLACE_SCENARIOS.map((scenario) => (
        <article key={scenario.title} className="panel-soft flex flex-col justify-between p-5">
          <div>
            <p className="text-sm text-slate-400">场景训练</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">{scenario.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{scenario.prompt}</p>
          </div>
          <button
            type="button"
            onClick={() => onUsePrompt(scenario.prompt)}
            className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
          >
            复制到今日练习
          </button>
        </article>
      ))}
    </section>
  );
}
