import NavigationMenu from "../components/NavigationMenu.jsx";
import "./BudgetInput.css";

export default function BudgetInput() {
  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main">
        <div className="budget-input-grid">
          <section className="budget-region selector-area">
            <p className="budget-region__label">Selector_Area</p>
            <p className="budget-region__description">
              Placeholder for filter controls and period selection.
            </p>
          </section>

          <section className="budget-region balances-area">
            <p className="budget-region__label">Balances_Area</p>
            <p className="budget-region__description">
              Placeholder for balances, summaries, or charts.
            </p>
          </section>

          <section className="budget-region input-area">
            <p className="budget-region__label">Input_Area</p>
            <p className="budget-region__description">
              Placeholder for budget inputs and detail forms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
