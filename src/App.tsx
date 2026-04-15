import { InputPanel } from "@/components/layout/InputPanel";
import { OutputPanel } from "@/components/layout/OutputPanel";

export default function App() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto grid max-w-[1800px] gap-6 xl:grid-cols-[minmax(360px,0.35fr)_minmax(0,0.65fr)]">
        <InputPanel />
        <OutputPanel />
      </div>
    </main>
  );
}
