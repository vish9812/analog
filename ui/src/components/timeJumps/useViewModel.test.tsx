import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import useJumper from "./useJumper";

describe("useViewModel", () => {
  test("handleJump", () => {
    createRoot((dispose) => {
      const props = {
        onTimeJump: vi.fn(),
      };

      const id = "10";
      vi.spyOn(useJumper, "jump").mockReturnValue(id);

      const vm = useViewModel(props);
      vm.handleJump(null as any);

      expect(props.onTimeJump, "onTimeJump").toHaveBeenCalledWith(id);

      dispose();
    });
  });
});
