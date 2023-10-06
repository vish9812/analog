import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-alpine.min.css";

import { type Component, Show } from "solid-js";
import Normalizer from "./normalizer";
import Analyzer from "./analyzer";
import { Container } from "@suid/material";
import usePage, { Pages } from "./hooks/usePage";

const App: Component = () => {
  const { page } = usePage();

  return (
    <Container maxWidth="xl">
      <Show
        when={page() === Pages.analyzer}
        fallback={<Normalizer></Normalizer>}
      >
        <Analyzer></Analyzer>
      </Show>
    </Container>
  );
};

export default App;
