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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.robotSettings) {
            if (!changes?.robotSettings?.currentValue) {
                return;
            }

            if (changes?.robotSettings?.isFirstChange()) {
                if (changes?.robotSettings?.currentValue) {
                    this.translateService.use(changes?.robotSettings?.currentValue?.language);
                }
                this.translateService.setDefaultLang('en');
            }

            this.translateService
                .use(changes?.robotSettings?.currentValue?.language)
                .pipe(first())
                .subscribe(() => {
                    this.cd.detectChanges();
                });
            
        }
        if (changes?.contributedNode) {
            console.log('contributedNode type:', this.contributedNode.type);
        }
    }

    async onSetParentColor(color: string) {
        console.log('onSetParentColor called with color:', color);

        try {
            // 保存当前节点 ID
            let currentNodeId = this.presenterAPI.selectedNodeId;

            // 更新子节点的 color_parent 参数
            this.contributedNode.parameters.color_parent = color;
            console.log('Updated child node color_parent to:', color);
            await this.saveNode();

            // 查找父节点并更新父节点的 color_parent 参数
            // 通过实例查找父节点（最可靠的方式）
            let parentCount = 0;
            try {
                // await this.con
                const instances = await this.presenterAPI.programTreeService.getContributedNodeInstancesForURCap();
                const parentInstance = instances.find(inst => inst.node.type === 'funh-custom-api-polyscopex-parent-pg');
                
                if (parentInstance) {
                    // 获取父节点并更新//retrive the parent node and update,
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
            

            // 触发变更检测
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
