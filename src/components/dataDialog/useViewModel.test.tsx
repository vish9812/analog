import { createRoot } from "solid-js";
import useViewModel, { Props } from "./useViewModel";

describe("useViewModel", () => {
  test("initial state", () => {
    createRoot((dispose) => {
      const vm = useViewModel(null as any);
      expect(vm.expanded(), "expanded").toEqual(false);

      dispose();
    });
  });

  test("handleExpandToggle", () => {
    createRoot((dispose) => {
      const vm = useViewModel(null as any);
      expect(vm.expanded()).toEqual(false);

      const ref = { expandAll: vi.fn(), collapseAll: vi.fn() };
      vm.handleExpandToggle(ref as any);

      expect(ref.expandAll, "expandAll").toHaveBeenCalledOnce();
      expect(vm.expanded(), "expanded").toEqual(true);

      vm.handleExpandToggle(ref as any);
      expect(ref.collapseAll, "collapseAll").toHaveBeenCalledOnce();
      expect(vm.expanded(), "expanded").toEqual(false);

      dispose();
    });
  });

  test.each`
    name                          | data                | expected
    ${"object returns stringify"} | ${{ key1: "val1" }} | ${JSON.stringify({ key1: "val1" })}
    ${"string returns as it is"}  | ${"string text"}    | ${"string text"}
  `("data when $name", ({ data, expected }) => {
    createRoot((dispose) => {
      const props = {
        data,
      };
      const vm = useViewModel(props as any);
      expect(vm.data(), "data").toEqual(expected);

      dispose();
    });
  });
});
