import { useNavigate } from "react-router-dom";
import ScanHistory from "@/components/ScanHistory";

const HistoryPage = () => {
  const navigate = useNavigate();
  return (
    <section className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="text-xs uppercase tracking-widest text-primary mb-3">Recent activity</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your scan history</h1>
        <p className="text-muted-foreground mt-3">
          Stored locally in your browser. Re-run any past scan with one click.
        </p>
      </div>
      <ScanHistory
        onRerun={(rec) => {
          if (rec.type === "image") return;
          navigate("/", { state: { rerun: { type: rec.type, input: rec.input } } });
        }}
      />
    </section>
  );
};

export default HistoryPage;