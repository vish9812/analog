import { createSignal } from "solid-js";

const Pages = {
  normalizer: "normalizer",
  analyzer: "analyzer",
} as const;

type Keys = keyof typeof Pages;
type Values = (typeof Pages)[Keys];

const [page, setPage] = createSignal<Values>(Pages.normalizer);

const usePage = () => ({
  page,
  setPage,
});

export default usePage;
export { Pages };
