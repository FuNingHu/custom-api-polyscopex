/// <reference lib="webworker" />
import {
    ApplicationContext,
    InsertionContext,
    OptionalPromise,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse,
    VALIDATION_OK
} from '@universal-robots/contribution-api';
import { ParentPgNode } from './parent-pg.node';

// programNodeLabel is required
const createProgramNodeLabel = (node: ParentPgNode): OptionalPromise<string> => `Parent Color: ${node.parameters.color_parent}`;

// factory is required
const createProgramNode = (): OptionalPromise<ParentPgNode> => ({
    type: 'funh-custom-api-polyscopex-parent-pg',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {
        color_child: 'blue',
        color_parent: 'red'
    },
});

// generateCodeBeforeChildren is optional
const generateScriptCodeBefore = (node: ParentPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// generateCodeAfterChildren is optional
const generateScriptCodeAfter = (node: ParentPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// generateCodePreamble is optional
const generatePreambleScriptCode = (node: ParentPgNode): OptionalPromise<ScriptBuilder> => new ScriptBuilder();

// validator is optional
const validate = (node: ParentPgNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => {
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
