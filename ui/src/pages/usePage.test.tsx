import usePage, { Pages } from "./usePage";
import { createRoot } from "solid-js";

it(`sets page`, () => {
  createRoot((dispose) => {
    const { page, setPage } = usePage();

    expect(page(), `initial page should be ${Pages.normalize}`).toBe(
      Pages.normalize
    );

    setPage(Pages.analyze);
    expect(page()).toBe(Pages.analyze);

    setPage(Pages.normalize);
    expect(page()).toBe(Pages.normalize);
    dispose();
  });
});
