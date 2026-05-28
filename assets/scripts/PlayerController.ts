const {ccclass, property} = cc._decorator;
import { QuestionBlock } from "./QuestionBlock";
import { UIManager } from "./UIManager";
import { AudioManager } from "./AudioManager";
import { GameManager } from "./GameManager";

@ccclass
export class PlayerController extends cc.Component {

    // 💡 新增的音效屬性 (請在編輯器中將對應的音效檔案拖入)
    // 在腳本開頭加入對 SpriteFrame 的屬性定義
    @property(cc.SpriteFrame)
    deadSpriteFrame: cc.SpriteFrame = null;

    @property(cc.AudioClip)
    stompClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    jumpClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    powerUpClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    powerDownClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    deathClip: cc.AudioClip = null;

    @property(cc.Node)
    respawnPoint: cc.Node = null; 

    @property(cc.AudioClip)
    kickClip: cc.AudioClip = null;

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

    private isBig: boolean = false;
    private isInvincible: boolean = false;

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
            // 🔊 播放跳躍音效
            if (AudioManager.instance && this.jumpClip) AudioManager.instance.playSFX(this.jumpClip);
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isDead) return; 

        if (otherCollider.tag === 99) {
            this.triggerDeath();
            return;
        }

        if (otherCollider.tag === 67) {
            this.handleDamage();
            return;
        }

        if (otherCollider.tag === 87) {
            let turtle = otherCollider.getComponent("TurtleController");
            if (turtle) {
                // 1. 計算高度：檢查玩家腳底是否在烏龜上方
                let playerBottom = this.node.convertToWorldSpaceAR(cc.v2(0, -this.node.height * this.node.scaleY / 2)).y;
                let turtleTop = otherCollider.node.convertToWorldSpaceAR(cc.v2(0, otherCollider.node.height * otherCollider.node.scaleY / 2)).y;

                // 2. 【核心邏輯】：只要是從上方踩，永遠觸發互動，不扣血
                // 這裡把條件放寬：不管 state 是 0, 1, 2，只要踩到就是安全互動
                if (playerBottom > turtleTop - 15) {
                    turtle.onInteract(this.node);
                    // 彈跳效果
                    this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce * 0.8);
                    if (AudioManager.instance && this.stompClip) AudioManager.instance.playSFX(this.stompClip);
                
                    if (UIManager.instance) {
                        UIManager.instance.addScore(500); // 這裡設定你想要加的分數，例如 500
                    }
                } 
                else {
                    // 沒踩到，這是側面碰撞
                    let state = turtle.getCurrentState();
                    
                    if (state === 0) { 
                        // 走路狀態側面撞到 -> 受傷
                        this.handleDamage();
                    } 
                    else if (state === 1) { 
                        // 靜止龜殼側面撞到 -> 踢它 (互動)
                        turtle.onInteract(this.node); 

                        // 🎯 這裡加入踢擊音效
                        if (AudioManager.instance && this.kickClip) {
                            AudioManager.instance.playSFX(this.kickClip);
                        }
                    } 
                    else if (state === 2) { 
                        // 滑行狀態側面撞到 -> 受傷
                        this.handleDamage();
                    }
                }
            }
            return;
        }

        if (selfCollider.tag === 20) {
            // 取得接觸點的法線向量
            let worldManifold = contact.getWorldManifold();
            let normal = worldManifold.normal; 

            // 如果 normal.y > 0.5，代表碰撞面在玩家下方（地板）
            if (normal.y > 0.5) {
                this.isGrounded = true;
            }

            if (otherCollider.node.name === "Enemy") {
                
                let playerBottom = this.node.convertToWorldSpaceAR(cc.v2(0, -this.node.height * this.node.scaleY / 2)).y;
                let enemyTop = otherCollider.node.convertToWorldSpaceAR(cc.v2(0, otherCollider.node.height * otherCollider.node.scaleY / 2)).y;

                if (playerBottom > enemyTop - 15) { 
                    this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce * 0.8);
                    
                    let enemyScript = otherCollider.node.getComponent("Enemy");
                    if (enemyScript) {
                        enemyScript.die();
                        // 🔊 播放踩怪音效
                        if (AudioManager.instance && this.stompClip) AudioManager.instance.playSFX(this.stompClip);
                    } else {
                        otherCollider.node.destroy();
                    }

                    if (UIManager.instance) UIManager.instance.addScore(2000);
                    return; 
                } else {
                    this.handleDamage();
                    return;
                }
            } else {
                this.isGrounded = true; 
            }
        }

        if (otherCollider.node.name === "Enemy") {
            if (this.isBig) {
                this.isBig = false;
                let colliders = this.getComponents(cc.PhysicsBoxCollider);
                colliders.forEach(c => {
                    c.size.width /= 1.5;
                    c.size.height /= 1.5;
                    c.apply();
                });
                this.jumpForce = 500;
                contact.disabled = true; 
                return;
            } else {
                this.triggerDeath();
                return;
            }
        }

        if (otherCollider.tag === 10 && this.rb.linearVelocity.y > 0) {
            let block = otherCollider.getComponent(QuestionBlock);
            if (block) block.onHit(); 
        }

        if (otherCollider.tag === 6) {
            otherCollider.node.destroy();
            // 🔊 播放吃蘑菇音效
            if (AudioManager.instance && this.powerUpClip) AudioManager.instance.playSFX(this.powerUpClip);
            if (UIManager.instance) UIManager.instance.addScore(1000);
            
            if (!this.isBig) {
                this.isBig = true;
                let colliders = this.getComponents(cc.PhysicsBoxCollider);
                colliders.forEach(c => {
                    c.size.width *= 1.5;
                    c.size.height *= 1.5;
                    c.apply();
                });
                this.jumpForce = 550;
            }
        }
    }

    triggerDeath() {
        if (this.isDead) return; // 防止重複觸發死亡邏輯
        this.isDead = true; 

        this.node.zIndex = 999;

        // --- 新增：死亡圖片與動畫 ---
        // 1. 替換死亡圖片
        let sprite = this.getComponent(cc.Sprite);
        if (sprite && this.deadSpriteFrame) {
            sprite.spriteFrame = this.deadSpriteFrame;
        }
        // 2. 死亡跳躍動畫 (先跳起，再快速掉下去)
        cc.tween(this.node)
        .by(0.4, { position: cc.v3(0, 150, 0) }, { easing: 'sineOut' })
        .by(0.6, { position: cc.v3(0, -500, 0) }, { easing: 'sineIn' })
        .start();
        // ---------------------------

        // 1. 🔊 暫停 BGM 並播放死亡音效
        if (AudioManager.instance) {
            AudioManager.instance.pauseBGM(); // 關掉 BGM
            if (this.deathClip) {
                AudioManager.instance.playSFX(this.deathClip); // 播放音效
            }
        }
        
        // 2. 玩家狀態處理
        this.isGrounded = false;
        this.leftDown = false;
        this.rightDown = false;
        
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        if (this.anim) this.anim.stop(); 

        // 3. 關閉碰撞
        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.enabled = false);

        // 呼叫扣血，並取得是否 Game Over 的結果
        let isGameOver = GameManager.decreaseLife();

        // 4. 重啟場景
        this.scheduleOnce(() => {
            if (isGameOver) {
                cc.director.loadScene("GameOver");
                // 強制停止所有動作與排程
                cc.director.getScheduler().unscheduleAllForTarget(this);
            } else {
                cc.director.loadScene("GameStart");
            }
        }, 3.0); 
    }

    public handleDamage() {
        if (this.isInvincible) return; 

        if (this.isBig) {
            this.isBig = false;
            this.isInvincible = true; 
            // 🔊 播放變小音效
            if (AudioManager.instance && this.powerDownClip) AudioManager.instance.playSFX(this.powerDownClip);

            this.rb.enabled = false; 
            this.scheduleOnce(() => { this.rb.enabled = true; }, 0.1);

            let colliders = this.getComponents(cc.PhysicsBoxCollider);
            colliders.forEach(c => {
                c.size.width /= 1.5;
                c.size.height /= 1.5;
                c.apply();
            });
            this.jumpForce = 500;
            
            this.node.opacity = 150;
            cc.tween(this.node)
                .blink(2, 10) 
                .call(() => {
                    this.node.opacity = 255;
                    this.isInvincible = false; 
                })
                .start();
        } else {
            this.triggerDeath();
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (selfCollider.tag === 20) {
            // 只有當離開的是「地板」才設為 false
            // 透過法線判斷確保只處理地板碰撞的離開
            let worldManifold = contact.getWorldManifold();
            let normal = worldManifold.normal;
            
            // 只有法線是向上的碰撞才算地板，離開地板時我們才將 isGrounded 設為 false
            if (normal.y > 0.5) {
                this.isGrounded = false;
            }
        }
    }

    update(dt: number) {
        if (this.isDead) return; 
        let baseScale = this.isBig ? 1.4 : 1.0;
        let targetSpeedX = 0;
        if (this.leftDown) {
            targetSpeedX = -this.moveSpeed;
            this.node.scaleX = -baseScale;
            this.node.scaleY = baseScale;
        } else if (this.rightDown) {
            targetSpeedX = this.moveSpeed;
            this.node.scaleX = baseScale;
            this.node.scaleY = baseScale;
        } else {
            this.node.scaleY = baseScale;
            let currentDir = this.node.scaleX > 0 ? 1 : -1;
            this.node.scaleX = currentDir * baseScale;
        }
        this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);
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