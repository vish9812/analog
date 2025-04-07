import "@thisbeyond/solid-select/style.css";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { type Component } from "solid-js";
import Normalize from "./pages/normalize";
import Analyze from "./pages/analyze";
import { Route, Router } from "@solidjs/router";
import Layout from "./pages/layout";

const App: Component = () => {
  return (
    <Router root={Layout}>
      <Route path="/" component={Normalize} />
      <Route path="/analyze" component={Analyze} />
    </Router>
  );
};

export default App;
