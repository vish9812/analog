import objectsUtils from "./objects";

test("getNestedKeys", () => {
  const obj = {
    p1: {
      c1: "p1c1",
      c2: ["p1c2"],
    },
    p2: {
      c1: {
        x: 2,
        y: false,
      },
    },
  };

  const expected = [
    "p1",
    "p1.c1",
    "p1.c2",
    "p2",
    "p2.c1",
    "p2.c1.x",
    "p2.c1.y",
  ];
  expect(objectsUtils.getNestedKeys(obj).sort()).toEqual(expected.sort());
});

test.each`
  text                                         | expected
  ${"abc"}                                     | ${false}
  ${JSON.stringify({ key1: "val1", key2: 4 })} | ${true}
  ${JSON.stringify(["val1", "val2"])}          | ${true}
`("isJSON text: $text", ({ text, expected }) => {
  expect(objectsUtils.isJSON(text)).toEqual(expected);
});
