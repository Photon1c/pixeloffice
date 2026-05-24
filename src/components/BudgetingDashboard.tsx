import { useEffect, useState } from "react";
import { LAB_MODE } from "../config/env";

type BudgetAmount = { id: string; label: string; amount: number };

interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  targetSavingsRate: number;
  actualSavingsRate: number;
  meetsTarget: boolean;
}

interface BudgetResponse {
  incomes: BudgetAmount[];
  expenses: BudgetAmount[];
  summary: BudgetSummary;
  meta: { currency: string; period: string };
}

export default function BudgetingDashboard() {
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [view, setView] = useState<"summary" | "income" | "expenses">("summary");
  const [scenario, setScenario] = useState<"base" | "optimistic" | "stress">("base");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/budgeting");
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // silent failure; dashboard will show empty state
      }
    })();
  }, []);

  const currency = data?.meta.currency || "USD";

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderMainCanvas = () => {
    if (!data) {
      return <div style={{ color: "#888", fontSize: 14 }}>Loading budget data...</div>;
    }

    const { incomes, expenses, summary } = data;

    if (view === "income") {
      const max = Math.max(...incomes.map(i => i.amount), 1);
      return (
        <div>
          <h2 style={{ marginTop: 0 }}>Income Breakdown</h2>
          <p style={{ color: "#a0aec0", fontSize: 13 }}>
            Scenario: <strong>{scenario}</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #2d3748" }}>
                <th style={{ padding: "4px 0" }}>Source</th>
                <th style={{ padding: "4px 0" }}>Amount</th>
                <th style={{ padding: "4px 0" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => {
                const share = summary.totalIncome > 0 ? (inc.amount / summary.totalIncome) * 100 : 0;
                return (
                  <tr key={inc.id}>
                    <td style={{ padding: "4px 0" }}>{inc.label}</td>
                    <td style={{ padding: "4px 0" }}>{formatAmount(inc.amount)}</td>
                    <td style={{ padding: "4px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 8, background: "#1a202c", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(inc.amount / max) * 100}%`, height: "100%", background: "#48bb78" }} />
                        </div>
                        <span style={{ minWidth: 40, textAlign: "right" }}>{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (view === "expenses") {
      const max = Math.max(...data.expenses.map(e => e.amount), 1);
      return (
        <div>
          <h2 style={{ marginTop: 0 }}>Expense Breakdown</h2>
          <p style={{ color: "#a0aec0", fontSize: 13 }}>
            Scenario: <strong>{scenario}</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #2d3748" }}>
                <th style={{ padding: "4px 0" }}>Category</th>
                <th style={{ padding: "4px 0" }}>Amount</th>
                <th style={{ padding: "4px 0" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((exp) => {
                const share = summary.totalExpenses > 0 ? (exp.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <tr key={exp.id}>
                    <td style={{ padding: "4px 0" }}>{exp.label}</td>
                    <td style={{ padding: "4px 0" }}>{formatAmount(exp.amount)}</td>
                    <td style={{ padding: "4px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 8, background: "#1a202c", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(exp.amount / max) * 100}%`, height: "100%", background: "#f56565" }} />
                        </div>
                        <span style={{ minWidth: 40, textAlign: "right" }}>{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // summary view
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Budget Summary</h2>
        <p style={{ color: "#a0aec0", fontSize: 13 }}>
          Period: <strong>{data.meta.period}</strong> · Scenario: <strong>{scenario}</strong>
        </p>
        <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#a0aec0" }}>Total Income</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatAmount(summary.totalIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a0aec0" }}>Total Expenses</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatAmount(summary.totalExpenses)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a0aec0" }}>Net</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: summary.net >= 0 ? "#48bb78" : "#f56565" }}>
              {formatAmount(summary.net)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>
          <p>
            Target savings rate is <strong>{(summary.targetSavingsRate * 100).toFixed(1)}%</strong>. Your current
            savings rate is <strong>{(summary.actualSavingsRate * 100).toFixed(1)}%</strong>, which
            {" "}
            {summary.meetsTarget ? "meets or exceeds" : "is below"} your target.
          </p>
          <p>
            Use the left panels to switch views and scenarios. This canvas can be extended later with richer
            charts, projections, and what-if simulators without exposing any raw .env values in the repository.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Left side: two interactive panels */}
      <div style={{ width: "30%", padding: 16, display: "flex", flexDirection: "column", gap: 12, borderRight: "1px solid #1f2937" }}>
        {/* Panel 1: View + scenario selection */}
        <div style={{ padding: 12, borderRadius: 8, background: "#111827", border: "1px solid #1f2937" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>View</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setView("summary")} style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", background: view === "summary" ? "#2563eb" : "#1f2937", color: "#e5e7eb" }}>Summary</button>
            <button onClick={() => setView("income")} style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", background: view === "income" ? "#2563eb" : "#1f2937", color: "#e5e7eb" }}>Income</button>
            <button onClick={() => setView("expenses")} style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", background: view === "expenses" ? "#2563eb" : "#1f2937", color: "#e5e7eb" }}>Expenses</button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Scenario</div>
          <select value={scenario} onChange={e => setScenario(e.target.value as any)} style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid #374151", background: "#020617", color: "#e5e7eb", fontSize: 12 }}>
            <option value="base">Base</option>
            <option value="optimistic">Optimistic</option>
            <option value="stress">Stress</option>
          </select>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
            Scenarios are visual-only for now; underlying figures continue to come from the server-side
            budgeting model.
          </div>
        </div>

        {/* Panel 2: Quick ratios */}
        <div style={{ padding: 12, borderRadius: 8, background: "#111827", border: "1px solid #1f2937", flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Ratios</div>
          {data ? (
            <>
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                Expense / Income: {data.summary.totalIncome > 0 ? ((data.summary.totalExpenses / data.summary.totalIncome) * 100).toFixed(1) : "0.0"}%
              </div>
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                Net Margin: {data.summary.totalIncome > 0 ? ((data.summary.net / data.summary.totalIncome) * 100).toFixed(1) : "0.0"}%
              </div>
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                Savings Target: {(data.summary.targetSavingsRate * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11 }}>
                Status: {data.summary.meetsTarget ? "On track ✅" : "Below target ⚠️"}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Waiting for server snapshot...</div>
          )}
        </div>
      </div>

      {/* Right side: main canvas (70%) */}
      <div style={{ width: "70%", padding: 24, overflowY: "auto" }}>
        {LAB_MODE && (
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
            Lab Mode: budgeting dashboard is in experimental mode. Figures originate from server-side
            environment variables (BUDGET_* in .env) and are not committed to the repository.
          </div>
        )}
        {renderMainCanvas()}
      </div>
    </div>
  );
}
