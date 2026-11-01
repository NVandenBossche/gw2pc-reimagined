import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ItemPage, SetPage } from "./pages/ItemPage";
import { Legendaries } from "./pages/Legendaries";
import { Pay } from "./pages/Pay";
import { PricesProvider } from "./prices";
import { useRoute } from "./router";

export function App() {
  const route = useRoute();
  useEffect(() => {
    if (route.name === "home") document.title = "GW2PC Reimagined";
  }, [route]);
  return (
    <PricesProvider>
      <Layout route={route}>
        <div className="page" key={route.name === "item" || route.name === "set" ? `${route.name}/${route.slug}` : route.name}>
          {route.name === "home" && <Home />}
          {route.name === "pay" && <Pay amount={route.amount} />}
          {route.name === "leg" && <Legendaries />}
          {route.name === "item" && <ItemPage slug={route.slug} />}
          {route.name === "set" && <SetPage slug={route.slug} />}
          {route.name === "notfound" && <p>Page not found. <a href="#/">Back to prices</a>.</p>}
        </div>
      </Layout>
    </PricesProvider>
  );
}
