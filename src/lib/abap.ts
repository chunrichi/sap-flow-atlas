export type AbapTokenType = "key" | "str" | "com" | "num" | "op" | "plain";

export type AbapToken = {
  text: string;
  type: AbapTokenType;
};

const KEYWORDS = new Set([
  "APPEND", "ASSIGN", "AT", "CALL", "CHANGING", "CHECK", "CLEAR", "COMMIT",
  "CONCATENATE", "CONDENSE", "CONSTANTS", "CONTINUE", "DATA", "DEFINE", "DELETE",
  "DESCRIBE", "DO", "ELSE", "ELSEIF", "END", "ENDCASE", "ENDDO", "ENDFORM",
  "ENDIF", "ENDLOOP", "ENDSELECT", "ENDTRY", "ENDWHILE", "EXCEPTIONS", "EXPORTING",
  "FIELD-SYMBOLS", "FORM", "FUNCTION", "IF", "IMPORTING", "IN", "INCLUDE",
  "INSERT", "INTO", "LOOP", "MESSAGE", "MODIFY", "MOVE", "NEW", "NOT",
  "OR", "PERFORM", "RAISE", "RANGES", "READ", "REF", "RETURN", "SELECT",
  "SELECT-OPTIONS", "SELECTION-SCREEN", "SORT", "SPLIT", "START-OF-SELECTION",
  "SUBMIT", "TABLES", "TRANSPORTING", "TRY", "TYPE", "TYPES", "USING", "VALUE",
  "WHEN", "WHERE", "WHILE", "WITH", "WRITE", "AND", "IS", "OF", "STANDARD",
  "TABLE", "SORTED", "HASHED", "LIKE", "LINE", "LINES", "SY-SUBRC", "ABAP_TRUE",
])

function scanString(line: string, start: number): number {
  let i = start + 1;
  while (i < line.length) {
    if (line[i] === "'") {
      if (line[i + 1] === "'") {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i += 1;
  }
  return line.length;
}

export function tokenizeAbap(line: string): AbapToken[] {
  if (/^\s*\*/.test(line)) return [{ text: line, type: "com" }];
  const tokens: AbapToken[] = [];
  let i = 0;
  while (i < line.length) {
    const char = line[i]!;
    if (char === "'") {
      const end = scanString(line, i);
      tokens.push({ text: line.slice(i, end), type: "str" });
      i = end;
      continue;
    }
    if (char === "\"") {
      tokens.push({ text: line.slice(i), type: "com" });
      break;
    }
    if (/\s/.test(char)) {
      let end = i + 1;
      while (end < line.length && /\s/.test(line[end]!)) end += 1;
      tokens.push({ text: line.slice(i, end), type: "plain" });
      i = end;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      let end = i + 1;
      while (end < line.length && /[A-Za-z0-9_\/~\-]/.test(line[end]!)) end += 1;
      const word = line.slice(i, end);
      tokens.push({ text: word, type: KEYWORDS.has(word.toUpperCase()) ? "key" : "plain" });
      i = end;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let end = i + 1;
      while (end < line.length && /[0-9.]/.test(line[end]!)) end += 1;
      tokens.push({ text: line.slice(i, end), type: "num" });
      i = end;
      continue;
    }
    if (/[=<>+\-*/(),.:]/.test(char)) {
      tokens.push({ text: char, type: "op" });
      i += 1;
      continue;
    }
    tokens.push({ text: char, type: "plain" });
    i += 1;
  }
  return tokens;
}

export function codeLines(code: string): string[] {
  return code.replace(/\r\n/g, "\n").split("\n");
}

export function annotationSet(
  annotations: Array<{ lines: string | number; note: string }>,
): Set<number> {
  const result = new Set<number>();
  for (const annotation of annotations) {
    const parts = String(annotation.lines)
      .split("-")
      .map((part) => Number(part));
    const start = parts[0] ?? 0;
    const end = parts[1] ?? start;
    for (let line = start; line <= end; line += 1) result.add(line);
  }
  return result;
}
