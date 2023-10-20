import usePage, { Pages } from "./usePage";
import { createRoot } from "solid-js";

it(`sets page`, () => {
  createRoot((dispose) => {
    const { page, setPage } = usePage();

    expect(page(), `initial page should be ${Pages.normalizer}`).toBe(
      Pages.normalizer
    );

    setPage(Pages.analyzer);
    expect(page()).toBe(Pages.analyzer);

    setPage(Pages.normalizer);
    expect(page()).toBe(Pages.normalizer);
    dispose();
  });
});
