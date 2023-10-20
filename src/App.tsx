import "@thisbeyond/solid-select/style.css";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { type Component, Show } from "solid-js";
import Normalizer from "./normalizer";
import Analyzer from "./analyzer";
import usePage, { Pages } from "./hooks/usePage";

const App: Component = () => {
  const { page } = usePage();

  return (
    <div style={{ padding: "10px 50px" }}>
      <Show
        when={page() === Pages.analyzer}
        fallback={<Normalizer></Normalizer>}
      >
        <Analyzer></Analyzer>
      </Show>
    </div>
  );
};

export default App;
