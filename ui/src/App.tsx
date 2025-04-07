import "@thisbeyond/solid-select/style.css";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { type Component, onMount, Show } from "solid-js";
import usePage, { Pages } from "./pages/usePage";
// import Analyze from "./pages/analyze";
import Normalize from "./pages/normalize";
import { Route, Router } from "@solidjs/router";
import Layout from "./pages/layout";

const App: Component = () => {
  const { page } = usePage();

  return (
    <Router root={Layout}>
      <Route path="/" component={Normalize} />
    </Router>
  );
};

export default App;
