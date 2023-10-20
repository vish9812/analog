import { createSignal } from "solid-js";

const Pages = {
  normalizer: "normalizer",
  analyzer: "analyzer",
} as const;

type Keys = keyof typeof Pages;
type PagesValues = (typeof Pages)[Keys];

const [page, setPage] = createSignal<PagesValues>(Pages.normalizer);

const usePage = () => ({
  page,
  setPage,
});

export default usePage;
export { Pages };
export type { PagesValues };
