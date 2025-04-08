import { createSignal } from "solid-js";

const Pages = {
  normalize: "normalize",
  analyze: "analyze",
} as const;

type Keys = keyof typeof Pages;
type PagesValues = (typeof Pages)[Keys];

const [page, setPage] = createSignal<PagesValues>(Pages.normalize);

const usePage = () => ({
  page,
  setPage,
});

export default usePage;
export { Pages };
export type { PagesValues };