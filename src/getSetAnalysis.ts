export interface SetAnalysisData {
    setIdentifier: string;
    bookmark: string;
    aggregationType: string;
    fieldExpression: string;
    setModifiers: SetAnalysisModifier[];
}

export interface SetAnalysisModifier {
    Action: string;                 // Action
    Field: string;                  // Field
    OtherField: string;             // Other field (indirect SA)
    FieldOperator: string;           // FieldOperator
    ValuesOrExpression_1: string;   // ValuesOrExpression Nr1
    ValuesOrExpression_2: string;   // ValuesOrExpression Nr2
    SelectionOperator: string;      // SelectionOperator
    IndirectField: string;          // Indirect Field for Indirect Set Selections
}

function bracketize(fieldValue: string) {
    fieldValue = fieldValue || '';
    if (fieldValue.trim().includes(' ')) {
        return `[${fieldValue.trim()}]`;
    }
    return fieldValue.trim();
}
function nullOrEmpty(obj: any) {
    if (obj == null || obj.length == 0 || obj == 'undefined') {
        return true;
    }
    return false;
} // (nullOrEmpty)


function calculateModifier(modifier: SetAnalysisModifier) {
    var indirectField;
    var technicalModifier;
    switch (modifier.Action) {
        case "set_remove":
            technicalModifier = bracketize(modifier.Field) + "=";
            break;
        case "set_modify_by_value":
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "{" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2) + "}";
            break;
        case "set_modify_by_expression":
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "{" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2, true) + "}";
            break;
        case "set_pindirect":
            //Customer = P({1<ProductCategory={'Beverages'}>} Customer)
            indirectField = (nullOrEmpty(modifier.IndirectField) ? modifier.Field : modifier.IndirectField); //Use the target field as default
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "P({1<" + bracketize(modifier.OtherField) + "={" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2, false) + "}>}" + bracketize(indirectField) + ")";
            break;
        case "set_eindirect":
            // same as set_pindirect but with E instead of P
            indirectField = (nullOrEmpty(modifier.IndirectField) ? modifier.Field : modifier.IndirectField); //Use the target field as default 
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "E({1<" + bracketize(modifier.OtherField) + "={" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2, false) + "}>}" + bracketize(indirectField) + ")";
            break;
        case "set_pindirect_exp":
            indirectField = (nullOrEmpty(modifier.IndirectField) ? modifier.Field : modifier.IndirectField); //Use the target field as default
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "P({1<" + bracketize(modifier.OtherField) + "={" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2, true) + "}>}" + bracketize(indirectField) + ")";
            break;
        case "set_eindirect_exp":
            indirectField = (nullOrEmpty(modifier.IndirectField) ? modifier.Field : modifier.IndirectField); //Use the target field as default
            technicalModifier = bracketize(modifier.Field) + modifier.FieldOperator + "E({1<" + bracketize(modifier.OtherField) + "={" + GetFieldOperation(modifier.SelectionOperator, modifier.ValuesOrExpression_1, modifier.ValuesOrExpression_2, true) + "}>}" + bracketize(indirectField) + ")";
            break;
        default:
            technicalModifier = '';
            break;
    }
    return technicalModifier;
}

function qualifyElement(el: string, mask: string, isWildCardExp?: boolean) {
    // empty, null or 0-string => return el
    if (el == null || el == 'undefined' || el.length == 0) {
        return el;
    }

    // if we have a number, just return the number
    if (!isNaN(Number(el))) {
        return (!nullOrEmpty(mask)) ? mask.replace('{0}', el) : el;
    }

    // Qualify if we have a delimited string ...
    if (el.indexOf(',') > 0) {
        var vals = el.split(',');
        vals = vals.map(x=>x.trim());

        var returnArr = new Array();
        for (var i = 0; i < vals.length; i++) {
            var newVal = null;
            var val = vals[i];
            var stringDel = '';
            // Here we should decide if we have an array of numbers, strings or mixed
            if (!isNaN(Number(val))) {
                stringDel = '';
            }
            else {
                stringDel = '\'';
            }
            newVal = (!nullOrEmpty(mask)) ? mask.replace('{0}', vals[i]) : vals[i];

            // If we do not have a wildcard expression, we have to delimit the string/value
            if (!isWildCardExp) {
                newVal = stringDel + newVal + stringDel;
            }
            returnArr.push(newVal);
        }
        return returnArr.join(',');
    }
    // we just have a single string
    else {
        return (!nullOrEmpty(mask)) ? mask.replace('{0}', el) : "'" + el + "'";
    }
}

function GetFieldOperation(selectionOperator: string, ValuesOrExpression_1: string, ValuesOrExpression_2: string, isExp?: boolean) {
    // Can be made easier ... just define mask1 and mask2 ... :)
    switch (selectionOperator) {
        case "equal_to":
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "$(={0})") : qualifyElement(ValuesOrExpression_1, '');
        case "greater_than":
            //">$(=max(Year))"
            //">2000"
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\">$(={0})\"") : qualifyElement(ValuesOrExpression_1, "\">{0}\"", true);
        case "less_than":
            //"<$(=max(Year))"
            //"<2000"
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\"<$(={0})\"") : qualifyElement(ValuesOrExpression_1, "\"<{0}\"", true);
        case "greater_than_or_equal":
            //">=$(=max(Year))"
            //">=2000"
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\">=$(={0})\"") : qualifyElement(ValuesOrExpression_1, "\">={0}\"", true);
        case "less_than_or_equal":
            //"<=$(=max(Year))"
            //"<=2000"return "\"<=" + ValuesOrExpression_1 + "\"";
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\"<=$(={0})\"") : qualifyElement(ValuesOrExpression_1, "\"<={0}\"", true);
        case "contains":
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\"*$(={0})*\"") : qualifyElement(ValuesOrExpression_1, "\"*{0}*\"", true)
        case "startswith":
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\"$(={0})*\"") : qualifyElement(ValuesOrExpression_1, "\"{0}*\"", true)
        case "endswith":
            return (isExp) ? qualifyElement(ValuesOrExpression_1, "\"*$(={0})\"") : qualifyElement(ValuesOrExpression_1, "\"*{0}\"", true)
        case "between_gt_lt":
            //">2000<2010"
            //">$(=min(Year))<$(=max(Year))
            //Todo: should we allow multiple values?
            return (isExp) ? "\">$(=" + ValuesOrExpression_1 + ")<$(=" + ValuesOrExpression_2 + ")\"" : "\">" + ValuesOrExpression_1 + "<" + ValuesOrExpression_2 + "\"";
        case "between_gt=_lt=":
            return (isExp) ? "\">=$(=" + ValuesOrExpression_1 + ")<=$(=" + ValuesOrExpression_2 + ")\"" : "\">=" + ValuesOrExpression_1 + "<=" + ValuesOrExpression_2 + "\"";
        case "between_gt_lt=":
            return (isExp) ? "\">$(=" + ValuesOrExpression_1 + ")<=$(=" + ValuesOrExpression_2 + ")\"" : "\">" + ValuesOrExpression_1 + "<=" + ValuesOrExpression_2 + "\"";
        case "between_gt=_lt":
            return (isExp) ? "\">=$(=" + ValuesOrExpression_1 + ")<$(=" + ValuesOrExpression_2 + ")\"" : "\">=" + ValuesOrExpression_1 + "<" + ValuesOrExpression_2 + "\"";
    }
}

function getSetModifier(modifiers: SetAnalysisModifier[]) {
    if (modifiers?.length > 0) {
        return modifiers.map(x => calculateModifier(x)).join(',')
    }
    return "";
}

function getSetExpression(setIdentifier: string, bookmark: string, modifiers: SetAnalysisModifier[]) {
    let val = "{set_identifier}<{set_modifier}>".replace("{set_identifier}", setIdentifier.replace('bookmark', bookmark).replace('altState', bookmark));
    let sm = getSetModifier(modifiers);
    val = val.replace(sm.length == 0 ? "<{set_modifier}>" : "{set_modifier}", sm);
    return val;
}

export function getSetAnalysis(data: SetAnalysisData) {
    let expr = "{aggr_type}({{set_expression}}{field_expression})";
    expr = expr.replace("{aggr_type}", data.aggregationType);
    expr = expr.replace("{set_expression}", getSetExpression(data.setIdentifier, data.bookmark, data.setModifiers));
    expr = expr.replace("{field_expression}", bracketize(data.fieldExpression));
    return expr;
}
