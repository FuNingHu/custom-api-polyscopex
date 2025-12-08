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
     * 根据用户选择的语言，返回应该使用的语言
     * - 如果选择的是英语（en, en-US, en-GB等），返回 'en'
     * - 如果选择的是中文简体（zh, zh-CN, zh-Hans等），返回 'zh-CN'
     * - 如果选择的是其他语言，返回 'en'（使用英语作为后备）
     */
    private getLanguageToUse(language: string): string {
        if (!language) {
            return 'en';
        }

        const lang = language.toLowerCase();

        // 支持英语（包括 en, en-US, en-GB 等变体）
        if (lang === 'en' || lang === 'en-us' || lang === 'en-gb') {
            return 'en';
        }

        // 支持中文简体（包括 zh, zh-CN, zh-Hans 等变体）
        // 统一使用 'zh-CN' 作为中文简体的语言代码
        if (lang === 'zh' || lang === 'zh-cn' || lang === 'zh-hans' || lang.startsWith('zh-')) {
            return 'zh-CN';
        }

        // 其他语言都使用英语作为后备
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
                
                // 先加载英语翻译，确保默认语言可用
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
