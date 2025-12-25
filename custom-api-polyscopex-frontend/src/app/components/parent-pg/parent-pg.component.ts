import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AddNode, InsertionEnum, ProgramPresenter, ProgramPresenterAPI, RemoveNode, RobotSettings, SubtreeNode } from '@universal-robots/contribution-api';
import { ParentPgNode } from './parent-pg.node';
import { ChildPgNode } from '../child-pg/child-pg.node';
import { first } from 'rxjs/operators';

@Component({
    templateUrl: './parent-pg.component.html',
    styleUrls: ['./parent-pg.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})

export class ParentPgComponent implements OnChanges, ProgramPresenter {
    // presenterAPI is optional
    @Input() presenterAPI: ProgramPresenterAPI;

    // robotSettings is optional
    @Input() robotSettings: RobotSettings;
    // contributedNode is optional
    @Input() contributedNode: ParentPgNode;

    colors: string[] = ['red', 'green', 'blue'];
    hasChildNode: boolean = false;

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef
    ) {
    }

    /**
     * Returns the language to use based on user's language selection
     * - If English (en, en-US, en-GB, etc.) is selected, returns 'en'
     * - If Simplified Chinese (zh, zh-CN, zh-Hans, etc.) is selected, returns 'zh-CN'
     * - If any other language is selected, returns 'en' (using English as fallback)
     */
    private getLanguageToUse(language: string): string {
        if (!language) {
            return 'en';
        }

        const lang = language.toLowerCase();

        // Support English (including variants like en, en-US, en-GB)
        if (lang === 'en' || lang === 'en-us' || lang === 'en-gb') {
            return 'en';
        }

        // Support Simplified Chinese (including variants like zh, zh-CN, zh-Hans)
        // Use 'zh-CN' as the unified language code for Simplified Chinese
        if (lang === 'zh' || lang === 'zh-cn' || lang === 'zh-hans' || lang.startsWith('zh-')) {
            return 'zh-CN';
        }

        // Use English as fallback for all other languages
        return 'en';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.robotSettings) {
            if (!changes?.robotSettings?.currentValue) {
                return;
            }

            const languageToUse = this.getLanguageToUse(changes?.robotSettings?.currentValue?.language);
            if (changes?.robotSettings?.isFirstChange()) {
                this.translateService.setDefaultLang('en');

                // Load English translation first to ensure default language is available
            this.translateService
                .use(changes?.robotSettings?.currentValue?.language)
                .pipe(first())
                .subscribe(() => {
                    this.cd.detectChanges();
                });
        }
            
    }

        if (changes?.contributedNode) {
            console.log('contributedNode type:', this.contributedNode.type);
        }

        if (changes?.presenterAPI) {
            this.checkChildNodes();
        }
        
    }
    async onRemoveChildButtonClick() {
        console.log('onRemoveChildButtonClick');

        try {
            // Get parent node ID
            let parentNodeId = this.presenterAPI.selectedNodeId;
            
            // Get subtree context to find child nodes
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(parentNodeId);
            
            // Find child node
            let childNodeId: string | null = null;
            for await (const child of subtreeContext.children) {
                if (child.node?.type === 'funh-custom-api-polyscopex-child-pg' && child.id) {
                    childNodeId = child.id;
                    break; // Only one child node, exit immediately after finding it
                }
            }

            if (!childNodeId) {
                console.log('No child node found to remove');
                return;
            }

            console.log(`Found child node ${childNodeId}, removing...`);

            // Create RemoveNode object
            const removeNode: RemoveNode = {
                nodeId: childNodeId,
                changeSelection: false
            };

            // Remove child node
            await this.presenterAPI.programTreeService.removeChildNode(removeNode);
            console.log(`Child node ${childNodeId} removed successfully`);

            // Wait a short time to ensure the removal operation is complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Update child node status
            await this.checkChildNodes();

            // Trigger change detection
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error removing child node:', error);
            this.cd.detectChanges();
        }
    }
    async onImplementChildButtonClick() {
        console.log('onImplementChildButtonClick');
        try {
            const treeservice = this.presenterAPI.programTreeService;
            const pivotNodeId = this.presenterAPI.selectedNodeId;

            // Create child-pg node
            const childNode: ChildPgNode = {
                type: 'funh-custom-api-polyscopex-child-pg',
                version: '1.0.0',
                lockChildren: false,
                allowsChildren: false,
                parameters: {
                    color_mine: this.contributedNode.parameters.color_child,
                    color_parent: this.contributedNode.parameters.color_parent,
                    parent_id: pivotNodeId
                }
            };

            // Create AddNode object and insert node
            const addNode: AddNode = {
                changeSelection: false,
                insertionRelativeToPivotNode: InsertionEnum.INTO_FIRST,
                node: childNode,
                pivotNodeId: pivotNodeId
            };

            treeservice.addNode(addNode);
            console.log('Child node added successfully');
            
            // Check child node status
            await this.checkChildNodes();
            
            // Trigger change detection
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error adding child node:', error);
        }
    }

    async onSetChildColor(color: string) {
        console.log('onSetChildColor called with color:', color);

        try {
            // Save current node ID to prevent contributedNode from being replaced
            let currentNodeId = this.presenterAPI.selectedNodeId;
            

            // Update parent node's color_child parameter
            this.contributedNode.parameters.color_child = color;
            console.log('Updated parent node color_child to:', color);
            await this.saveNode();
            
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(currentNodeId);
            
            // Find and update child node (only one child node)
            let childCount = 0;
            for await (const child of subtreeContext.children) {
                if (child.node?.type === 'funh-custom-api-polyscopex-child-pg' && child.id && child.node.parameters) {
                    child.node.parameters.color_mine = color;
                    // Create SubtreeNode object
                    const subtreenode: SubtreeNode = {
                        id: child.id,
                        node: child.node
                    };
                    await this.presenterAPI.programTreeService.updateSubTreeNode(subtreenode);
                    childCount = 1;
                    console.log(`Successfully updated child node ${child.id} color_mine to ${color}`);
                    break; // Only one child node, exit immediately after finding it
                }
            }
            
            if (childCount === 0) {
                console.log('No child nodes found to update');
            } else {
                console.log(`Updated ${childCount} child node(s)`);
            }
            
            // Trigger change detection
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error in onSetChildColor:', error);
            // Trigger change detection even if there's an error
            this.cd.detectChanges();
        }
    }

    async checkChildNodes() {

        try {
            // Try to get node ID from contributedNode, if not available use selectedNodeId
            // But need to verify if the node corresponding to selectedNodeId is a parent node
            let currentNodeId = this.presenterAPI.selectedNodeId;
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(currentNodeId);
            
            // Check if there are child nodes
            let hasChild = false;
            for await (const child of subtreeContext.children) {
                if (child.node?.type === 'funh-custom-api-polyscopex-child-pg') {
                    hasChild = true;
                    break;
                }
            }

            this.hasChildNode = hasChild;
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error checking child nodes:', error);
            this.hasChildNode = false;
        }
    }

    // call saveNode to save node parameters
    async saveNode() {
        await this.presenterAPI.programNodeService.updateNode(this.contributedNode);
        this.cd.detectChanges();
    }
}
