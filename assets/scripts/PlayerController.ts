const {ccclass, property} = cc._decorator;
import { QuestionBlock } from "./QuestionBlock";
import { UIManager } from "./UIManager"; // 💡 這一行非常重要！

@ccclass
export class PlayerController extends cc.Component {

    // 【修正】不需要任何大圖或圖集屬性了，格子留空也沒關係！

    @property(cc.Node)
    respawnPoint: cc.Node = null; 

    @property(cc.Float)
    moveSpeed: number = 130; 

    @property(cc.Float)
    jumpForce: number = 500; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null; 
    
    private leftDown: boolean = false;
    private rightDown: boolean = false;
    private isGrounded: boolean = false; 
    private isDead: boolean = false; 

    // 💡 記錄目前是不是大馬力歐狀態
    private isBig: boolean = false;

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation); 
        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.respawnPoint) {
            this.node.position = this.respawnPoint.position;
        }
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (this.isDead) return; 
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.leftDown = true;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.rightDown = true;
                break;
            case cc.macro.KEY.space:
            case cc.macro.KEY.w:
                this.jump();
                break;
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.leftDown = false;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.rightDown = false;
                break;
        }
    }

    jump() {
        if (this.isGrounded && !this.isDead) {
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
            this.isGrounded = false; 
            this.anim.play("player_jump");
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isDead) return; 

        // 1. 掉進懸崖（Tag 99）
        if (otherCollider.tag === 99) {
            this.triggerDeath();
            return;
        }

        // 2. 腳底 (Tag 20) 踩東西與踩怪
        if (selfCollider.tag === 20) {
            if (otherCollider.node.name === "Enemy") {
                if (this.node.y > otherCollider.node.y + 10) {
                    this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce * 0.8);
                    otherCollider.node.destroy(); 

                    // 🎯 踩死怪物：加 2000 分
                    if (UIManager.instance) UIManager.instance.addScore(2000);

                    cc.log("成功踩死怪物！");
                    return; 
                }
            } else {
                this.isGrounded = true; 
            }
        } 

        // 3. 身體撞到怪物
        if (otherCollider.node.name === "Enemy") {
            // 💡 如果是大馬力歐，獲得一次免死金牌，縮小回去！
            if (this.isBig) {
                cc.log("大馬力歐受傷，縮小回小馬力歐！");
                this.isBig = false;

                // 物理碰撞箱縮小回原樣（除以 1.5）
                let colliders = this.getComponents(cc.PhysicsBoxCollider);
                colliders.forEach(c => {
                    c.size.width /= 1.5;
                    c.size.height /= 1.5;
                    c.apply();
                });
                this.jumpForce = 500; // 恢復原本跳躍力
                
                // 💡 這裡不刪除怪物，給馬力歐一瞬間無敵穿過去的時間（由物理層直接推開或穿透）
                contact.disabled = true; 
                return;
            } else {
                cc.log("判定為受傷！死掉！");
                this.triggerDeath();
                return;
            }
        }

        // 4. 頭頂撞問號方塊 (Tag 10)
        if (otherCollider.tag === 10 && this.rb.linearVelocity.y > 0) {
            let block = otherCollider.getComponent(QuestionBlock);
            if (block) {
                block.onHit(); 
            }
        }

        // 5. 吃到變大蘑菇（Tag 6）
        if (otherCollider.tag === 6) {
            cc.log("吃到蘑菇！瑪利歐變大！");
            otherCollider.node.destroy();

            // 🎯 吃蘑菇：加 1000 分 (額外獎勵)
            if (UIManager.instance) UIManager.instance.addScore(1000);
            
            if (!this.isBig) {
                this.isBig = true;

                // 物理碰撞箱手動調大
                let colliders = this.getComponents(cc.PhysicsBoxCollider);
                colliders.forEach(c => {
                    c.size.width *= 1.5;
                    c.size.height *= 1.5;
                    c.apply();
                });

                this.jumpForce = 550; // 變大後跳得更高一點
            }
        }
    }

    triggerDeath() {
        this.isDead = true; 
        this.isGrounded = false;
        this.leftDown = false;
        this.rightDown = false;
        
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        if (this.anim) this.anim.stop(); 

        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.enabled = false);

        this.scheduleOnce(() => {
            let currentSceneName = cc.director.getScene().name;
            cc.director.loadScene(currentSceneName);
        }, 0.5); 
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (selfCollider.tag === 20) {
            this.isGrounded = false;
        }
    }

    update(dt: number) {
        if (this.isDead) return; 

        // 💡 根據目前是不是大馬力歐，決定基礎的 scale 大小（大的是 1.5，小的是 1.0）
        let baseScale = this.isBig ? 1.3 : 1.0;

        let targetSpeedX = 0;
        if (this.leftDown) {
            targetSpeedX = -this.moveSpeed;
            this.node.scaleX = -baseScale; // 往左走，乘上放大倍率
            this.node.scaleY = baseScale;
        } else if (this.rightDown) {
            targetSpeedX = this.moveSpeed;
            this.node.scaleX = baseScale;  // 往右走，乘上放大倍率
            this.node.scaleY = baseScale;
        } else {
            // 沒按按鍵時，也要維持目前變大或縮小的 Y 軸比例
            this.node.scaleY = baseScale;
            // X 軸要保留原本面向左還是面向右的正負號
            let currentDir = this.node.scaleX > 0 ? 1 : -1;
            this.node.scaleX = currentDir * baseScale;
        }

        this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);

        // 動畫播放維持你原本的完美寫法
        if (this.isGrounded) {
            if (targetSpeedX !== 0) {
                let walkState = this.anim.getAnimationState("player_walk");
                if (walkState && !walkState.isPlaying) {
                    this.anim.play("player_walk");
                }
            } else {
                this.anim.stop();
                this.anim.setCurrentTime(0, "player_walk"); 
            }
        } else {
            let jumpState = this.anim.getAnimationState("player_jump");
            if (jumpState && !jumpState.isPlaying) {
                this.anim.play("player_jump");
            }
        }
    }
}