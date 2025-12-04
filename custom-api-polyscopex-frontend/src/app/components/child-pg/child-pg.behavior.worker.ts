/// <reference lib="webworker" />
import {
    InsertionContext,
    OptionalPromise,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse,
    VALIDATION_OK,
    isValueItem
} from '@universal-robots/contribution-api';
import { ChildPgNode } from './child-pg.node';

// programNodeLabel is required
const createProgramNodeLabel = (node: ChildPgNode): OptionalPromise<string> => `Child Color: ${node.parameters.color_mine}`;

// factory is required
const createProgramNode = (): OptionalPromise<ChildPgNode> => ({
    type: 'funh-custom-api-polyscopex-child-pg',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {
        color_mine: 'blue',
        color_parent: 'red',
        parent_id: undefined
    },
});

// generateCodeBeforeChildren is optional
const generateScriptCodeBefore = (node: ChildPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// generateCodeAfterChildren is optional
const generateScriptCodeAfter = (node: ChildPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// generateCodePreamble is optional
const generatePreambleScriptCode = (node: ChildPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// validator is optional
const validate = (node: ChildPgNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => {
    return {
        isValid: true
    };
};

// allowsChild is optional
const allowChildInsert = (node: ProgramNode, childType: string): OptionalPromise<boolean> => true;

// allowedInContext is optional
const allowedInsert = (insertionContext: InsertionContext): OptionalPromise<boolean> => true;

// upgradeNode is optional
const nodeUpgrade = (loadedNode: ProgramNode): ProgramNode => loadedNode;

const behaviors: ProgramBehaviors = {
    programNodeLabel: createProgramNodeLabel,
    factory: createProgramNode,
    generateCodeBeforeChildren: generateScriptCodeBefore,
    generateCodeAfterChildren: generateScriptCodeAfter,
    generateCodePreamble: generatePreambleScriptCode,
    validator: validate,
    allowsChild: allowChildInsert,
    allowedInContext: allowedInsert,
    upgradeNode: nodeUpgrade
};

registerProgramBehavior(behaviors);
