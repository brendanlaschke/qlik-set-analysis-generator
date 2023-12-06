export interface SetAnalysisData {
  setIdentifier: string;
  bookmark: string;
  aggregationType: string;
  fieldExpression: string;
  setModifiers: SetAnalysisModifier[];
}

export interface SetAnalysisModifier {
  Action:
    | "set_remove"
    | "set_modify_by_value"
    | "set_modify_by_expression"
    | "set_pindirect"
    | "set_eindirect"
    | "set_pindirect_exp"
    | "set_eindirect_exp"; // Action
  Field: string; // Field
  OtherField: string; // Other field (indirect SA)
  FieldOperator: string; // FieldOperator
  ValuesOrExpression_1: string; // ValuesOrExpression Nr1
  ValuesOrExpression_2: string; // ValuesOrExpression Nr2
  SelectionOperator: string; // SelectionOperator
  IndirectField: string; // Indirect Field for Indirect Set Selections
}

function bracketize(fieldValue: string) {
  fieldValue = fieldValue || "";
  if (fieldValue.trim().includes(" ")) {
    return `[${fieldValue.trim()}]`;
  }
  return fieldValue.trim();
}
function nullOrEmpty(obj: any) {
  return obj == null || obj.length == 0 || obj == "undefined";
}

function qualifyElement(el: string, mask: string, isWildCardExp?: boolean) {
  // empty, null or 0-string => return el
  if (el == null || el == "undefined" || el.length == 0) {
    return el;
  }

  // if we have a number, just return the number
  if (!isNaN(Number(el))) {
    return !nullOrEmpty(mask) ? mask.replace("{0}", el) : el;
  }

  // Qualify if we have a delimited string ...
  if (el.indexOf(",") > 0) {
    var vals = el.split(",");
    vals = vals.map((x) => x.trim());

    var returnArr = new Array();
    for (var i = 0; i < vals.length; i++) {
      var newVal = null;
      var val = vals[i];
      var stringDel = "";
      // Here we should decide if we have an array of numbers, strings or mixed
      if (!isNaN(Number(val))) {
        stringDel = "";
      } else {
        stringDel = "'";
      }
      newVal = !nullOrEmpty(mask) ? mask.replace("{0}", vals[i]) : vals[i];

      // If we do not have a wildcard expression, we have to delimit the string/value
      if (!isWildCardExp) {
        newVal = stringDel + newVal + stringDel;
      }
      returnArr.push(newVal);
    }
    return returnArr.join(",");
  }
  // we just have a single string
  else {
    return !nullOrEmpty(mask) ? mask.replace("{0}", el) : "'" + el + "'";
  }
}

function GetFieldOperation(
  selectionOperator: string,
  ValuesOrExpression_1: string,
  ValuesOrExpression_2: string,
  isExp?: boolean,
) {
  // Can be made easier ... just define mask1 and mask2 ... :)
  switch (selectionOperator) {
    case "equal_to":
      return isExp
        ? qualifyElement(ValuesOrExpression_1, "$(={0})")
        : qualifyElement(ValuesOrExpression_1, "");
    case "greater_than":
      //">$(=max(Year))"
      //">2000"
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '">$(={0})"')
        : qualifyElement(ValuesOrExpression_1, '">{0}"', true);
    case "less_than":
      //"<$(=max(Year))"
      //"<2000"
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '"<$(={0})"')
        : qualifyElement(ValuesOrExpression_1, '"<{0}"', true);
    case "greater_than_or_equal":
      //">=$(=max(Year))"
      //">=2000"
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '">=$(={0})"')
        : qualifyElement(ValuesOrExpression_1, '">={0}"', true);
    case "less_than_or_equal":
      //"<=$(=max(Year))"
      //"<=2000"return "\"<=" + ValuesOrExpression_1 + "\"";
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '"<=$(={0})"')
        : qualifyElement(ValuesOrExpression_1, '"<={0}"', true);
    case "contains":
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '"*$(={0})*"')
        : qualifyElement(ValuesOrExpression_1, '"*{0}*"', true);
    case "startswith":
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '"$(={0})*"')
        : qualifyElement(ValuesOrExpression_1, '"{0}*"', true);
    case "endswith":
      return isExp
        ? qualifyElement(ValuesOrExpression_1, '"*$(={0})"')
        : qualifyElement(ValuesOrExpression_1, '"*{0}"', true);
    case "between_gt_lt":
      //">2000<2010"
      //">$(=min(Year))<$(=max(Year))
      //Todo: should we allow multiple values?
      return isExp
        ? '">$(=' + ValuesOrExpression_1 + ")<$(=" + ValuesOrExpression_2 + ')"'
        : '">' + ValuesOrExpression_1 + "<" + ValuesOrExpression_2 + '"';
    case "between_gt=_lt=":
      return isExp
        ? '">=$(=' +
            ValuesOrExpression_1 +
            ")<=$(=" +
            ValuesOrExpression_2 +
            ')"'
        : '">=' + ValuesOrExpression_1 + "<=" + ValuesOrExpression_2 + '"';
    case "between_gt_lt=":
      return isExp
        ? '">$(=' +
            ValuesOrExpression_1 +
            ")<=$(=" +
            ValuesOrExpression_2 +
            ')"'
        : '">' + ValuesOrExpression_1 + "<=" + ValuesOrExpression_2 + '"';
    case "between_gt=_lt":
      return isExp
        ? '">=$(=' +
            ValuesOrExpression_1 +
            ")<$(=" +
            ValuesOrExpression_2 +
            ')"'
        : '">=' + ValuesOrExpression_1 + "<" + ValuesOrExpression_2 + '"';
    default:
      return "";
  }
}

export type SetExprInteractivePart = {
  type:
    | "Aggregation"
    | "Field"
    | "Bracket"
    | "SetIdentifier"
    | "ModifierSeperator"
    | "SetModifierField"
    | "Set Operator"
    | "FieldOperation"
    | "Other Field"
    | "Indirect Field"
    | "P"
    | "E";
  bracketId?: string;
  text: string;
};
const bracketMapping: { [key: string]: string } = {
  "<": ">",
  "(": ")",
  "{": "}",
};
function withInteractiveBracket(
  expr: SetExprInteractivePart[],
  bracket: string,
  bracketId: string,
  func: () => void,
) {
  expr.push({
    type: "Bracket",
    bracketId: bracketId,
    text: bracket,
  });

  func();

  expr.push({
    type: "Bracket",
    bracketId: bracketId,
    text: bracketMapping[bracket],
  });
}

export function getSetAnalysisInteractive(data: SetAnalysisData) {
  let expr: SetExprInteractivePart[] = [];
  // Aggr Type
  expr.push({
    type: "Aggregation",
    text: data.aggregationType,
  });

  withInteractiveBracket(expr, "(", "setExpr", () => {
    withInteractiveBracket(expr, "{", "setIdent", () => {
      // Set Identifier
      expr.push({
        type: "SetIdentifier",
        text: data.setIdentifier
          .replace("bookmark", data.bookmark)
          .replace("altState", data.bookmark),
      });

      // Set Modifiers
      const setExpr: SetExprInteractivePart[] =
        getSetExpressionModifierInteractive(data.setModifiers);
      for (const p of setExpr) {
        expr.push(p);
      }
    });

    // Field Expr
    expr.push({
      type: "Field",
      text: bracketize(data.fieldExpression),
    });
  });

  return expr;
}

function getSetExpressionModifierInteractive(modifiers: SetAnalysisModifier[]) {
  if (modifiers.length == 0) {
    return [];
  }
  let expr: SetExprInteractivePart[] = [];

  withInteractiveBracket(expr, "<", "Modifiers", () => {
    for (let i = 0; i < modifiers.length; i++) {
      const setModExpr = calculateInteractiveSetModifier(modifiers[i], i);
      for (let e of setModExpr) {
        expr.push(e);
      }

      if (i != modifiers.length - 1)
        expr.push({
          type: "ModifierSeperator",
          text: ",",
        });
    }
  });

  return expr;
}
function calculateInteractiveSetModifier(
  modifier: SetAnalysisModifier,
  index: number,
): SetExprInteractivePart[] {
  let expr: SetExprInteractivePart[] = [];

  expr.push({
    type: "SetModifierField",
    text: bracketize(modifier.Field),
  });

  if (modifier.Action == "set_remove") {
    expr.push({
      type: "Set Operator",
      text: "=",
    });
  } else if (modifier.Action == "set_modify_by_value") {
    expr.push({
      type: "Set Operator",
      text: modifier.FieldOperator,
    });

    withInteractiveBracket(expr, "{", "SetMod" + index, () => {
      expr.push({
        type: "FieldOperation",
        text: GetFieldOperation(
          modifier.SelectionOperator,
          modifier.ValuesOrExpression_1,
          modifier.ValuesOrExpression_2,
        ),
      });
    });
  } else if (modifier.Action == "set_modify_by_expression") {
    expr.push({
      type: "Set Operator",
      text: modifier.FieldOperator,
    });
    withInteractiveBracket(expr, "{", "SetMod" + index, () => {
      expr.push({
        type: "FieldOperation",
        text: GetFieldOperation(
          modifier.SelectionOperator,
          modifier.ValuesOrExpression_1,
          modifier.ValuesOrExpression_2,
          true,
        ),
      });
    });
  } else if (
    modifier.Action == "set_pindirect" ||
    modifier.Action == "set_eindirect" ||
    modifier.Action == "set_eindirect_exp" ||
    modifier.Action == "set_pindirect_exp"
  ) {
    let indirectField = nullOrEmpty(modifier.IndirectField)
      ? modifier.Field
      : modifier.IndirectField;

    expr.push({
      type: "Set Operator",
      text: modifier.FieldOperator,
    });
    withInteractiveBracket(expr, "{", "SetMod" + index, () => {
      // P / E
      expr.push({
        type:
          modifier.Action == "set_pindirect" ||
          modifier.Action == "set_pindirect_exp"
            ? "P"
            : "E",
        text:
          modifier.Action == "set_pindirect" ||
          modifier.Action == "set_pindirect_exp"
            ? "P"
            : "E",
      });

      withInteractiveBracket(expr, "(", "IndMod(" + index, () => {
        withInteractiveBracket(expr, "{", "IndMod{" + index, () => {
          expr.push({
            type: "SetIdentifier",
            text: "1",
          });
          withInteractiveBracket(expr, "<", "IndMod<" + index, () => {
            expr.push({
              type: "Other Field",
              text: bracketize(modifier.OtherField),
            });
            expr.push({
              type: "Set Operator",
              text: "=",
            });

            withInteractiveBracket(expr, "{", "IndMod{Nest" + index, () => {
              expr.push({
                type: "FieldOperation",
                text: GetFieldOperation(
                  modifier.SelectionOperator,
                  modifier.ValuesOrExpression_1,
                  modifier.ValuesOrExpression_2,
                  modifier.Action == "set_eindirect_exp" ||
                    modifier.Action == "set_pindirect_exp",
                ),
              });
            });
          });
        });
        expr.push({
            type: 'Indirect Field',
            text: bracketize(indirectField)
        })
      });
    });
  }

  return expr;
}
