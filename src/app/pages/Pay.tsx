import { useEffect } from "react";
import { PayCalculator } from "../components/PayCalculator";

export function Pay() {
  useEffect(() => {
    document.title = "Pay · GW2PC Reimagined";
  }, []);
  return (
    <>
      <h1>Payment calculator</h1>
      <p className="hint">Turn a gold amount into Ecto, Mystic Coins, T6 sets or raw gold at OTC prices, or value what you are about to receive.</p>
      <PayCalculator />
    </>
  );
}
