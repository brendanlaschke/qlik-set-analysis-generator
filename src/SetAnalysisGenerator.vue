<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SetAnalysisModifier, getSetAnalysis } from './getSetAnalysis';

//#region 
const optionsBasis = [{
    label: "Selection",
    options: [{
        value: "$",
        label: "Current Selection",
    }, {
        value: "1",
        label: "All Values",
    }, {
        value: "1-$",
        label: "Everything Except Current selection",
    }]
}, {
    label: "Bookmarks",
    options: [{
        value: "bookmark",
        label: "Bookmark",
    }, {
        value: "$+bookmark",
        label: "Current Selection + Bookmark",
    }, {
        value: "$-bookmark",
        label: "Current Selection - Bookmark",
    }, {
        value: "$*bookmark",
        label: "Current Selection intersected Bookmark",
    }]
}, {
    label: "Alternative States",
    options: [{
        value: "altState",
        label: "Alternative State",
    }, {
        value: "$+altState",
        label: "Current Selection + Alternative State",
    }, {
        value: "$-altState",
        label: "Current Selection - Alternative State",
    }, {
        value: "$*altState",
        label: "Current Selection intersected Alternative State",
    }]
}, {
    label: "Previous/Next Selection",
    options: [{
        value: "$1",
        label: "Previous Selection",
    }, {
        value: "$2",
        label: "2. Previous Selection",
    }, {
        value: "$_1",
        label: "Next Selection",
    }, {
        value: "$_2",
        label: "2. Next Selection",
    },]
}];

const modifierActions = [{
    label: "Standard Set Modifiers",
    options: [{
        value: "set_remove",
        label: "Remove selection in field",
    }, {
        value: "set_modify_by_value",
        label: "Modify the set explicitely by defining values",
    }, {
        value: "set_modify_by_expression",
        label: "Modify the set by using expressions",
    }]
}, {
    label: "Indirect Set Analysis (using explicit values)",
    options: [{
        value: "set_pindirect",
        label: "Select values based on selections(by value) in another field",
    }, {
        value: "set_eindirect",
        label: "Select values based on INVERSE selection(by value) in another field",
    }]
}, {
    label: "Indirect Set Analysis (using expressions)",
    options: [{
        value: "set_pindirect_exp",
        label: "Select values based on selections(by expression) in another field",
    }, {
        value: "set_eindirect_exp",
        label: "Select values based on INVERSE selection(by expression) in another field",
    }]
}]

const AggregationFunctions = [{
    label: "Basis Aggregation Functions", options: [
        "Sum",
        "Min",
        "Max",
        "Only",
        "Mode",
        "FirstSortedValue"
    ]
},
{
    label: "String Aggregation Functions", options: [
        "MinString",
        "MaxString",
        "Concat"
    ]
},
{
    label: "Counter Aggregation Functions", options: [
        "Count",
        "NumericCount",
        "TextCount",
        "NullCount",
        "MissingCount"
    ]
}];

const fieldModes = [{
    label: "Select Values Explicitely (=)",
    value: "=",
}, {
    label: "Additionally Select Values (+=)",
    value: "+=",
}, {
    label: "Exclude Values (-=)",
    value: "-=",
}, {
    label: "Select with Positive Intersection (*=)",
    value: "*=",
}, {
    label: "Select with Negative Intersection (/=)",
    value: "/=",
}];

const operators = [{
    label: "=",
    value: "equal_to",
}, {
    label: ">",
    value: "greater_than",
}, {
    label: "<",
    value: "less_than",
}, {
    label: ">=",
    value: "greater_than_or_equal",
}, {
    label: "<=",
    value: "less_than_or_equal",
}, {
    label: "contains",
    value: "contains",
}, {
    label: "startswith",
    value: "starts with",
}, {
    label: "endswith",
    value: "ends with",
}, {
    label: "val1 < x < val2",
    value: "between_gt_lt",
}, {
    label: "val1 <= x < val2",
    value: "between_gt=_lt",
}, {
    label: "val1 <= x <= val2",
    value: "between_gt=_lt=",
}, {
    label: "val1 < x <= val2",
    value: "between_gt_lt=",
},]

//#endregion

const setIdentifier = ref('$');
const bookmark = ref('');
const aggregationType = ref('Sum');
const fieldExpression = ref('');
const modifiers = ref<SetAnalysisModifier[]>([]);

function reset() {
    setIdentifier.value = '$';
    bookmark.value = '';
    aggregationType.value = 'Sum';
    fieldExpression.value = '';
    modifiers.value = [];
    onChange();
}
function onChange() {
    resultSetExpression.value = getSetAnalysis({
        setIdentifier: setIdentifier.value,
        bookmark: bookmark.value,
        aggregationType: aggregationType.value,
        fieldExpression: fieldExpression.value,
        setModifiers: modifiers.value,
    })
}
const copied = ref(false);
function copyToClipboard(text: string) {
    copied.value = true;
    navigator.clipboard.writeText(text);
    setTimeout(() => {
        copied.value = false;
    }, 4000);
}
function addModifier() {
    modifiers.value.push({
        Action: 'set_remove',
        FieldOperator: '=',
        Field: '',
        OtherField: '',
        SelectionOperator: '=',
        IndirectField: '',
        ValuesOrExpression_1: '',
        ValuesOrExpression_2: ''
    })
    onChange();
}

const resultSetExpression = ref('');

onMounted(() => {
    onChange()
})
</script>

<template>
    <div class="relative">
        <div class="cursor-pointer absolute right-0" style="top: -32px;">
            <el-tooltip content="Reset" placement="top" effect="dark">
                <svg @click="reset" xmlns="http://www.w3.org/2000/svg" class="hover:scale-110" fill="currentColor"
                    height="1em" viewBox="0 0 512 512">
                    <path
                        d="M48.5 224H40c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H48.5z" />
                </svg>
            </el-tooltip>
        </div>
        <div class="mb-4">
            <div class="flex w-full gap-2">
                <label class="block mb-2 text-sm font-medium text-white w-50 flex-1">Basis</label>
                <label v-if="['bookmark', '$+bookmark', '$-bookmark', '$*bookmark'].includes(setIdentifier)"
                    class="block mb-2 text-sm font-medium text-white w-50 flex-1">Bookmark/AltState</label>
            </div>
            <div class="flex w-full gap-2">
                <ElSelect class="flex-1" filterable @change="onChange" v-model="setIdentifier">
                    <ElOptionGroup v-for="group in optionsBasis" :key="group.label" :label="group.label">
                        <ElOption v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value">
                        </ElOption>
                    </ElOptionGroup>
                </ElSelect>
                <ElInput v-if="['bookmark', '$+bookmark', '$-bookmark', '$*bookmark'].includes(setIdentifier)"
                    class="flex-1" v-model="bookmark" @input="onChange"></ElInput>
            </div>

        </div>
        <div class="mb-4">
            <div class="flex w-full gap-2">
                <label class="block mb-2 text-sm font-medium text-white flex-1">Aggregate
                    Function</label>
                <label class="block mb-2 text-sm font-medium text-white" style="flex: 0.4"></label>
                <label class="block mb-2 text-sm font-medium text-white flex-1">Field</label>
            </div>
            <div class="flex w-full gap-2">
                <ElSelect class="flex-1" filterable v-model="aggregationType" @change="onChange">
                    <ElOptionGroup v-for="group in AggregationFunctions" :key="group.label" :label="group.label">
                        <ElOption v-for="item in group.options" :key="item" :label="item" :value="item">
                        </ElOption>
                    </ElOptionGroup>
                </ElSelect>
                <span style="flex: 0.4" class="text-center">of</span>
                <ElInput class="flex-1" v-model="fieldExpression" @input="onChange"></ElInput>
            </div>

        </div>

        <ElDivider></ElDivider>

        <div class="relative">
            <h5 class="mb-2 text-1xl font-bold tracking-tight text-white">Modifiers</h5>
            <div class="absolute right-0 cursor-pointer top-0">
                <el-tooltip content="Add Modifier" placement="top" effect="dark">
                    <svg @click="addModifier()" xmlns="http://www.w3.org/2000/svg" class="hover:scale-110"
                        fill="currentColor" height="1em" viewBox="0 0 448 512">
                        <path
                            d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
                    </svg>
                </el-tooltip>
            </div>
            <div v-for="(mod, index) in modifiers" class="bg-gray-600/75 rounded-md p-5 mb-3 relative">
                <div class="absolute cursor-pointer" style="top: 8px; right: 8px">
                    <el-tooltip content="Delete" placement="top" effect="dark">
                        <svg @click="modifiers.splice(index, 1); onChange()" xmlns="http://www.w3.org/2000/svg"
                            class="hover:scale-110" fill="currentColor" height="1em" viewBox="0 0 448 512">
                            <path
                                d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                        </svg>
                    </el-tooltip>
                </div>
                <div class="flex w-full gap-2">
                    <label class="block mb-2 text-sm font-medium text-white flex-1">Action</label>
                    <label class="block mb-2 text-sm font-medium text-white flex-1">Field</label>
                    <label v-if="mod.Action != 'set_remove'"
                        class="block mb-2 text-sm font-medium text-white flex-1">Mode</label>
                </div>
                <div class="flex w-full gap-2 mb-3">
                    <ElSelect class="flex-1" filterable @change="onChange" v-model="mod.Action">
                        <ElOptionGroup v-for="group in modifierActions" :key="group.label" :label="group.label">
                            <ElOption v-for="item in group.options" :key="item.value" :label="item.label"
                                :value="item.value">
                            </ElOption>
                        </ElOptionGroup>
                    </ElSelect>
                    <ElInput class="flex-1" v-model="mod.Field" @input="onChange"></ElInput>
                    <ElSelect v-if="mod.Action != 'set_remove'" class="flex-1" filterable @change="onChange"
                        v-model="mod.FieldOperator">
                        <ElOption v-for="item in fieldModes" :key="item.value" :label="item.label" :value="item.value">
                        </ElOption>
                    </ElSelect>
                </div>
                <label v-if="mod.Action != 'set_remove'"
                    class="block mb-2 text-md font-medium text-white flex-1">Condition</label>
                <div v-if="mod.Action != 'set_remove'" class="flex w-full gap-2">
                    <label class="block mb-2 text-sm font-medium text-white flex-1">Other Field</label>
                    <label class="block mb-2 text-sm font-medium text-white flex-1">Operator</label>
                    <label
                        v-if="['set_modify_by_expression', 'set_pindirect_exp', 'set_eindirect_exp'].includes(mod.Action)"
                        class="block mb-2 text-sm font-medium text-white flex-1">Expression 1</label>
                    <label
                        v-if="['set_modify_by_expression', 'set_pindirect_exp', 'set_eindirect_exp'].includes(mod.Action) && mod.SelectionOperator.includes('between')"
                        class="block mb-2 text-sm font-medium text-white flex-1">Expression 2</label>
                    <label
                        v-if="!['set_modify_by_expression', 'set_pindirect_exp', 'set_eindirect_exp'].includes(mod.Action)"
                        class="block mb-2 text-sm font-medium text-white flex-1">Value 1</label>
                    <label
                        v-if="!['set_modify_by_expression', 'set_pindirect_exp', 'set_eindirect_exp'].includes(mod.Action) && mod.SelectionOperator.includes('between')"
                        class="block mb-2 text-sm font-medium text-white flex-1">Value 2</label>
                </div>
                <div v-if="mod.Action != 'set_remove'" class="flex w-full gap-2 mb-3">
                    <ElInput class="flex-1" v-model="mod.OtherField" @input="onChange"></ElInput>
                    <ElSelect class="flex-1" filterable @change="onChange" v-model="mod.SelectionOperator">
                        <ElOption v-for="item in operators" :key="item.value" :label="item.label" :value="item.value">
                        </ElOption>
                    </ElSelect>
                    <ElInput class="flex-1" v-model="mod.ValuesOrExpression_1" @input="onChange"></ElInput>
                    <ElInput v-if="mod.SelectionOperator.includes('between')" class="flex-1"
                        v-model="mod.ValuesOrExpression_2" @input="onChange"></ElInput>
                </div>
                <label v-if="mod.Action != 'set_remove'"
                    class="block mb-2 text-sm font-medium text-white flex-1">Indirect Field</label>
                <ElInput v-if="mod.Action != 'set_remove'" class="flex-1" v-model="mod.IndirectField" @input="onChange">
                </ElInput>
            </div>
        </div>


        <ElDivider></ElDivider>

        <div>
            <div class="absolute right-0 cursor-pointer">
                <el-tooltip content="Copy" placement="top" effect="dark">
                    <svg @click="copyToClipboard(resultSetExpression)" xmlns="http://www.w3.org/2000/svg"
                        class="hover:scale-110" :class="{ 'animate-pulse text-green-600': copied }" fill="currentColor"
                        height="1em" viewBox="0 0 448 512">
                        <path
                            d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z" />
                    </svg>
                </el-tooltip>
            </div>
            {{ resultSetExpression }}
        </div>
    </div>
</template>