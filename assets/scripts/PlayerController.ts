const {ccclass, property} = cc._decorator;
import { QuestionBlock } from "./QuestionBlock";

@ccclass
export class PlayerController extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 300; 

    @property(cc.Float)
    jumpForce: number = 550; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null; // 【新增】：儲存動畫組件的變數
    
    private leftDown: boolean = false;
    private rightDown: boolean = false;
    private isGrounded: boolean = false; 
    private isDead: boolean = false; 

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation); // 【新增】：抓取身上的 Animation 組件
        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
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

            // 【新增】：跳躍瞬間立刻播放跳躍動畫
            this.anim.play("player_jump");
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isDead) return; 

        // 1. 腳底 (Tag 20) 踩東西與踩怪
        if (selfCollider.tag === 20) {
            this.isGrounded = true; 

            if (otherCollider.node.name === "Enemy") {
                if (this.node.y > otherCollider.node.y + 10) {
                    this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce * 0.8);
                    otherCollider.node.destroy(); 
                    cc.log("成功踩死怪物！");
                    return; 
                }
            }
        } 

        // 2. 身體撞到怪物死掉 (優化重置安全鎖)
        if (otherCollider.node.name === "Enemy") {
            cc.log("判定為受傷！啟動安全重置流程...");
            this.isDead = true; 
            this.isGrounded = false;
            this.leftDown = false;
            this.rightDown = false;
            
            if (this.rb) {
                this.rb.linearVelocity = cc.v2(0, 0);
            }
            if (this.anim) {
                this.anim.stop(); // 死掉瞬間動畫停止
            }

            // 給予 0.05 秒稍微緩衝，確保物理和場景安全重載
            this.scheduleOnce(() => {
                cc.director.loadScene("Level1");
            }, 0.05); 
            return;
        }

        // 3. 頭頂撞問號方塊 (Tag 10)
        if (otherCollider.tag === 10 && this.rb.linearVelocity.y > 0) {
            let block = otherCollider.getComponent(QuestionBlock);
            if (block) {
                block.onHit(); 
            }
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (selfCollider.tag === 20) {
            this.isGrounded = false;
        }
    }

    update(dt: number) {
        if (this.isDead) return; 

        let targetSpeedX = 0;
        if (this.leftDown) {
            targetSpeedX = -this.moveSpeed;
            this.node.scaleX = -1; 
        } else if (this.rightDown) {
            targetSpeedX = this.moveSpeed;
            this.node.scaleX = 1;  
        }

        this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);

        // 【最終優化：跳躍與走路動畫狀態機】
        if (this.isGrounded) {
            // --- 地面狀態 ---
            if (targetSpeedX !== 0) {
                // 走路中：檢查如果沒在播 walk，就撥放它
                let walkState = this.anim.getAnimationState("player_walk");
                if (walkState && !walkState.isPlaying) {
                    this.anim.play("player_walk");
                }
            } else {
                // 靜止中：停止並回到第一幀
                this.anim.stop();
                this.anim.setCurrentTime(0, "player_walk"); 
            }
        } else {
            // --- 空中狀態 ---
            // 檢查如果沒在播 jump，就撥放它 (防止空中瘋狂重播)
            let jumpState = this.anim.getAnimationState("player_jump");
            if (jumpState && !jumpState.isPlaying) {
                this.anim.play("player_jump");
            }
        }
    }
}