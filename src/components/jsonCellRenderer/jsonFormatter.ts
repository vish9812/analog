// https://github.com/luyilin/json-format-highlight/issues/47

type ColorsOptions = {
  keyColor?: string;
  numberColor?: string;
  stringColor?: string;
  trueColor?: string;
  falseColor?: string;
  nullColor?: string;
};

const DEFAULT_COLORS: ColorsOptions = {
  keyColor: "black",
  numberColor: "blue",
  stringColor: "#0B7500",
  trueColor: "#1773C4",
  falseColor: "#ff8080",
  nullColor: "dimgray",
};

const ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

const escapeHtml = (html: string) =>
  String(html).replace(
    /[&<>"'`=]/g,
    (entityKey: string) => ENTITY_MAP[entityKey as keyof typeof ENTITY_MAP]
  );

function format(
  object: string | object,
  colorOptions: ColorsOptions = {}
): string {
  if (typeof object !== "string") {
    object = JSON.stringify(object, null, 2) || typeof object;
  }

  let colors = Object.assign({}, DEFAULT_COLORS, colorOptions);
  object = object.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
  return object.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+]?\d+)?)/g,
    (match) => {
      let color = colors.numberColor;
      let style = "";

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          color = colors.keyColor;
        } else {
          color = colors.stringColor;
          match = '"' + escapeHtml(match.substring(1, match.length - 1)) + '"';
          style = "word-wrap:break-word;white-space:pre-wrap;";
        }
      } else if (/true/.test(match)) {
        color = colors.trueColor;
      } else if (/false/.test(match)) {
        color = colors.falseColor;
      } else if (/null/.test(match)) {
        color = colors.nullColor;
      }

      return `<span style="${style}color:${color}">${match}</span>`;
    }
  );
}

const jsonFormatter = {
  format,
};

export default jsonFormatter;
