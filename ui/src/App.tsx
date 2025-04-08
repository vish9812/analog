import "@thisbeyond/solid-select/style.css";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { Show, type Component } from "solid-js";
import Normalize from "./pages/normalize";
import Analyze from "./pages/analyze";
import { Route, Router } from "@solidjs/router";
import Layout from "./pages/layout";
import usePage, { Pages } from "./pages/usePage";

const App: Component = () => {
  const { page } = usePage();

  return (
    <Layout>
      <Show when={page() === Pages.analyze} fallback={<Normalize></Normalize>}>
        <Analyze></Analyze>
      </Show>
    </Layout>
  );
};

export default App;
