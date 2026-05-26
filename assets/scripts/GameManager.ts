const {ccclass, property} = cc._decorator;
import { AudioManager } from "./AudioManager";

@ccclass
export class GameManager extends cc.Component {
    
    // 這裡定義靜態變數，保證跨場景生存
    public static lives: number = 3; 

    onLoad() {
        // 設定物理引擎
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -640);
        
        // 設為持久節點，確保 GameManager 不會被銷毀
        cc.game.addPersistRootNode(this.node);
    }

    start() {
        this.onSceneChanged();
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneChanged, this);
    }

    onSceneChanged() {
        if (AudioManager.instance) {
            AudioManager.instance.playBGM();
        }
    }

    // 統一在此處處理扣血邏輯
    // GameManager.ts
    public static decreaseLife(): boolean {
        this.lives -= 1;
        cc.log("目前剩餘生命:", this.lives);
        
        // 回傳是否 Game Over，讓呼叫者決定跳去哪
        return this.lives <= 0; 
    }
}