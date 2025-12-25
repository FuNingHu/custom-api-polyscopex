import { ProgramNode, ProgramPresenterAPI } from '@universal-robots/contribution-api';

export interface ChildPgNode extends ProgramNode {
    type: string;
    parameters: {
        color_mine: string;
        color_parent: string;
        parent_id: string;
    };
    lockChildren?: boolean;
    allowsChildren?: boolean;
}
