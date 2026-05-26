const {ccclass, property} = cc._decorator;
import { Mushroom } from "./Mushroom"; 
import { UIManager } from "./UIManager"; // 💡 這一行非常重要！
import { AudioManager } from "./AudioManager";

enum ItemType {
    COIN,
    MUSHROOM
}

@ccclass
export class QuestionBlock extends cc.Component {

    @property({ type: cc.Enum(ItemType), displayName: "裡面裝的道具" })
    itemType: ItemType = ItemType.COIN;

    @property(cc.Prefab)
    coinPrefab: cc.Prefab = null; 

    @property(cc.Prefab)
    mushroomPrefab: cc.Prefab = null; 

    @property(cc.SpriteFrame)
    emptyBlockSprite: cc.SpriteFrame = null; 

    @property(cc.AudioClip)
    coinHitClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    mushroomSpawnClip: cc.AudioClip = null;

    private isTriggered: boolean = false; 

    public onHit() {
        if (this.isTriggered) return; 

        // 3. 觸發時直接播放音效
        if (AudioManager.instance && this.coinHitClip) {
            AudioManager.instance.playSFX(this.coinHitClip);
        }

        this.isTriggered = true;

        let sprite = this.getComponent(cc.Sprite);
        if (sprite && this.emptyBlockSprite) {
            sprite.spriteFrame = this.emptyBlockSprite;
        } else {
            this.node.color = cc.Color.GRAY; 
        }

        let moveUp = cc.moveBy(0.05, cc.v2(0, 10));
        let moveDown = cc.moveBy(0.05, cc.v2(0, -10));
        let spawnItemCall = cc.callFunc(() => {
            this.spawnItem(); 
        });
        
        let sequence = cc.sequence(moveUp, moveDown, spawnItemCall);
        this.node.runAction(sequence);

        cc.log("方塊被頂到了！");
    }

    private spawnItem() {
        // 【狀況 A：蹦出金幣】
        if (this.itemType === ItemType.COIN && this.coinPrefab) {
            let coin = cc.instantiate(this.coinPrefab);
            coin.parent = this.node.parent; 
            
            let spawnX = this.node.x;
            let spawnY = this.node.y + 16;
            coin.setPosition(spawnX, spawnY); 

            let coinUp = cc.moveBy(0.15, cc.v2(0, 35));
            let coinDown = cc.moveBy(0.1, cc.v2(0, -15));
            let coinDestroy = cc.callFunc(() => {
                // 💡 呼叫 UI 管理器，金幣與分數同步更新
                if (UIManager.instance) {
                    UIManager.instance.addCoin(1); 
                }

                cc.log("金幣吃到了，分數+1！");
                coin.destroy();
            });
            coin.runAction(cc.sequence(coinUp, coinDown, coinDestroy));
        } 
        // 【狀況 B：蹦出變大蘑菇】
        else if (this.itemType === ItemType.MUSHROOM && this.mushroomPrefab) {
            // 💡 播放蘑菇出現音效
            if (AudioManager.instance && this.mushroomSpawnClip) {
                AudioManager.instance.playSFX(this.mushroomSpawnClip);
            }

            let mushroom = cc.instantiate(this.mushroomPrefab);
            
            // 1. 強制放到 Canvas 底下，徹底斷絕跟怪物的父節點階層關係
            let canvas = cc.find("Canvas");
            mushroom.parent = canvas ? canvas : this.node.parent; 

            // 2. 精準抓取方塊的世界座標
            let worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            let canvasPos = mushroom.parent.convertToNodeSpaceAR(worldPos);
            
            // 【關鍵修正】出生點直接設在方塊的「正上方高處」(y + 24)，讓它絕對不會卡在方塊物理箱內！
            mushroom.setPosition(canvasPos.x, canvasPos.y + 24); 

            // 3. 播一個小小的向上冒出動態
            let mushroomAppear = cc.moveBy(0.2, cc.v2(0, 12));
            let startMoving = cc.callFunc(() => {
                cc.log("蘑菇誕生！開始往外走");
                
                // 4. 啟動蘑菇走路
                let script = mushroom.getComponent(Mushroom);
                if (script) {
                    script.startMoving();
                } else {
                    // 保險鎖：如果真的沒抓到腳本，強行用物理元件推動它
                    let rb = mushroom.getComponent(cc.RigidBody);
                    if (rb) {
                        rb.gravityScale = 1;
                        rb.linearVelocity = cc.v2(150, rb.linearVelocity.y);
                    }
                }
            });
            mushroom.runAction(cc.sequence(mushroomAppear, startMoving));
        }
    }
}