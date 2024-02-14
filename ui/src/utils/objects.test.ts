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

const jsonObj = { key1: "val1", key2: 4 };
const jsonArr = ["val1", "val2"];

test.each`
  text                       | expected
  ${"null"}                  | ${null}
  ${null}                    | ${null}
  ${"non-json log"}          | ${null}
  ${'"quoted non-json log"'} | ${null}
  ${'" "'}                   | ${null}
  ${'""'}                    | ${null}
  ${JSON.stringify(jsonObj)} | ${jsonObj}
  ${JSON.stringify(jsonArr)} | ${jsonArr}
`("parseJSON text: $text", ({ text, expected }) => {
  expect(objectsUtils.parseJSON(text)).toEqual(expected);
});
