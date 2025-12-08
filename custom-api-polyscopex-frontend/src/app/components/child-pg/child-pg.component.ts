import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProgramNode, ProgramPresenter, ProgramPresenterAPI, RobotSettings, SubtreeNode } from '@universal-robots/contribution-api';
import { ChildPgNode } from './child-pg.node';
import { ParentPgNode } from '../parent-pg/parent-pg.node';
import { first } from 'rxjs/operators';

@Component({
    templateUrl: './child-pg.component.html',
    styleUrls: ['./child-pg.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})

export class ChildPgComponent implements OnChanges, ProgramPresenter {
    // presenterAPI is optional
    @Input() presenterAPI: ProgramPresenterAPI;

    // robotSettings is optional
    @Input() robotSettings: RobotSettings;
    // contributedNode is optional
    @Input() contributedNode: ChildPgNode;

    colors: string[] = ['red', 'green', 'blue'];

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
                    .subscribe(() =>{
                       this.cd.detectChanges();
                    });
            } 
            
        }
        if (changes?.contributedNode) {
            console.log('contributedNode type:', this.contributedNode.type);
        }
    }

    async onSetParentColor(color: string) {
        console.log('onSetParentColor called with color:', color);

        try {
            // Save current node ID
            let currentNodeId = this.presenterAPI.selectedNodeId;

            // Update child node's color_parent parameter
            this.contributedNode.parameters.color_parent = color;
            console.log('Updated child node color_parent to:', color);
            await this.saveNode();

            // Find parent node and update parent node's color_parent parameter
            // Find parent node through instances (most reliable way)
            let parentCount = 0;
            try {
                // await this.con
                const instances = await this.presenterAPI.programTreeService.getContributedNodeInstancesForURCap();
                const parentInstance = instances.find(inst => inst.node.type === 'funh-custom-api-polyscopex-parent-pg');
                
                if (parentInstance) {
                    // Retrieve the parent node and update
                    const parentNode = await this.presenterAPI.programTreeService.getProgramNodeById(parentInstance.id) as ParentPgNode;
                    if (parentNode && parentNode.parameters && parentNode.type === 'funh-custom-api-polyscopex-parent-pg') {
                        parentNode.parameters.color_parent = color;
                        const subtreenode: SubtreeNode = {
                            id: parentInstance.id,
                            node: parentNode
                        };
                        this.presenterAPI.programTreeService.updateSubTreeNode(subtreenode);
                        parentCount = 1;
                        console.log(`Successfully updated parent node ${parentInstance.id} color_parent to ${color}`);
                    }
                } else {
                    console.warn('Could not find parent node instance');
                }
            } catch (error) {
                console.error('Error finding or updating parent node:', error);
            }

            if (parentCount === 0) {
                console.log('No parent nodes found to update');
            } else {
                console.log(`Updated ${parentCount} parent node(s)`);
            }
            

            // Trigger change detection
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error in onSetParentColor:', error);
            this.cd.detectChanges();
        }
    }

    // call saveNode to save node parameters
    async saveNode() {
        this.cd.detectChanges();
        await this.presenterAPI.programNodeService.updateNode(this.contributedNode);
    }
}
