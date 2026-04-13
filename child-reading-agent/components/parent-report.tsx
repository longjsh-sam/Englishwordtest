import { buildParentReport } from "@/lib/agent";
import { AgentState } from "@/lib/types";

type Props = {
  state?: AgentState;
};

export function ParentReport({ state }: Props) {
  if (!state) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">부모 요약</h2>
        <p className="mt-2 text-sm text-slate-600">이야기를 완성하면 요약이 여기에 보여요.</p>
      </div>
    );
  }

  const report = buildParentReport(state);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">부모 요약</h2>
      <div className="mt-4 space-y-4 text-sm text-slate-700">
        <div>
          <div className="font-semibold">책 제목</div>
          <div>{report.bookTitle ?? "선택 안 됨"}</div>
        </div>
        <div>
          <div className="font-semibold">회상한 단어 수</div>
          <div>{report.totalWords}개</div>
        </div>
        <div>
          <div className="font-semibold">단어 분류</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {Object.entries(report.categories).map(([key, values]) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-3">
                <div className="font-medium">{key}</div>
                <div className="mt-1 text-slate-600">{values.length ? values.join(", ") : "없음"}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold">이야기 요약</div>
          <div>{report.storySummary}</div>
        </div>
        <div>
          <div className="font-semibold">한 줄 피드백</div>
          <div>{report.encouragement}</div>
        </div>
      </div>
    </div>
  );
}
