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

        if (changes?.presenterAPI) {
            this.checkChildNodes();
        }
        
    }
    async onRemoveChildButtonClick() {
        console.log('onRemoveChildButtonClick');

        try {
            // 获取父节点ID
            let parentNodeId = this.presenterAPI.selectedNodeId;
            
            // 获取子树上下文，查找子节点
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(parentNodeId);
            
            // 查找子节点
            let childNodeId: string | null = null;
            for await (const child of subtreeContext.children) {
                if (child.node?.type === 'funh-custom-api-polyscopex-child-pg' && child.id) {
                    childNodeId = child.id;
                    break; // 只有一个子节点，找到后立即退出
                }
            }

            if (!childNodeId) {
                console.log('No child node found to remove');
                return;
            }

            console.log(`Found child node ${childNodeId}, removing...`);

            // 创建 RemoveNode 对象
            const removeNode: RemoveNode = {
                nodeId: childNodeId,
                changeSelection: false
            };

            // 删除子节点
            await this.presenterAPI.programTreeService.removeChildNode(removeNode);
            console.log(`Child node ${childNodeId} removed successfully`);

            // 等待一小段时间，确保删除操作完成
            await new Promise(resolve => setTimeout(resolve, 200));

            // 更新子节点状态
            await this.checkChildNodes();

            // 触发变更检测
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

            // 创建 child-pg 节点
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

            // 创建 AddNode 对象并插入节点
            const addNode: AddNode = {
                changeSelection: false,
                insertionRelativeToPivotNode: InsertionEnum.INTO_FIRST,
                node: childNode,
                pivotNodeId: pivotNodeId
            };

            treeservice.addNode(addNode);
            console.log('Child node added successfully');
            
            // 检查子节点状态
            await this.checkChildNodes();
            
            // 触发变更检测
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error adding child node:', error);
        }
    }

    async onSetChildColor(color: string) {
        console.log('onSetChildColor called with color:', color);

        try {
            // 保存当前节点 ID，以防 contributedNode 被替换
            let currentNodeId = this.presenterAPI.selectedNodeId;
            

            // 更新父节点的 color_child 参数
            this.contributedNode.parameters.color_child = color;
            console.log('Updated parent node color_child to:', color);
            await this.saveNode();
            
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(currentNodeId);
            
            // 查找并更新子节点（只有一个子节点）
            let childCount = 0;
            for await (const child of subtreeContext.children) {
                if (child.node?.type === 'funh-custom-api-polyscopex-child-pg' && child.id && child.node.parameters) {
                    child.node.parameters.color_mine = color;
                    // 创建 SubtreeNode 对象
                    const subtreenode: SubtreeNode = {
                        id: child.id,
                        node: child.node
                    };
                    await this.presenterAPI.programTreeService.updateSubTreeNode(subtreenode);
                    childCount = 1;
                    console.log(`Successfully updated child node ${child.id} color_mine to ${color}`);
                    break; // 只有一个子节点，找到后立即退出
                }
            }
            
            if (childCount === 0) {
                console.log('No child nodes found to update');
            } else {
                console.log(`Updated ${childCount} child node(s)`);
            }
            
            // 触发变更检测
            this.cd.detectChanges();
        } catch (error) {
            console.error('Error in onSetChildColor:', error);
            // 即使出错也要触发变更检测
            this.cd.detectChanges();
        }
    }

    async checkChildNodes() {

        try {
            // 尝试从 contributedNode 获取节点ID，如果不行则使用 selectedNodeId
            // 但需要验证 selectedNodeId 对应的节点是否是父节点
            let currentNodeId = this.presenterAPI.selectedNodeId;
            const subtreeContext = await this.presenterAPI.programTreeService.getSubtreeContextFromProgramNodeById(currentNodeId);
            
            // 检查是否有子节点
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
