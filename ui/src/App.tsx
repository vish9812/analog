import "@thisbeyond/solid-select/style.css";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { type Component, Show } from "solid-js";
import usePage, { Pages } from "./pages/usePage";
import Analyze from "./pages/analyze";
import Normalize from "./pages/normalize";

const App: Component = () => {
  const { page } = usePage();

  return (
    <div style={{ padding: "10px 50px" }}>
      <h1 style={{ display: "flex", "justify-content": "center" }}>Analog</h1>
      <Show when={page() === Pages.analyze} fallback={<Normalize></Normalize>}>
        <Analyze></Analyze>
      </Show>
    </div>
  );
};

export default App;
