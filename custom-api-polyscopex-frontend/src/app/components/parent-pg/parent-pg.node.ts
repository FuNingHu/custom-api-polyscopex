import { ProgramNode } from '@universal-robots/contribution-api';

export interface ParentPgNode extends ProgramNode {
    type: string;
    parameters: {
        color_child: string;
        color_parent: string;
    };
    lockChildren?: boolean;
    allowsChildren?: boolean;
}
