const {ccclass, property} = cc._decorator;

@ccclass
export class QuestionBlock extends cc.Component {

    private isTriggered: boolean = false; // 紀錄有沒有被頂過

    // 暴露一個公開方法，等一下讓 Player 偵測到從下方撞擊時來呼叫
    public onHit() {
        if (this.isTriggered) return; // 如果頂過就沒反應，防止無限刷
        this.isTriggered = true;

        // 1. 變成灰色，代表裡面的東西被拿走了
        this.node.color = cc.Color.GRAY;

        // 2. 瑪莉歐經典動態：0.05秒內向上移動10像素，再花0.05秒移回原位
        let moveUp = cc.moveBy(0.05, cc.v2(0, 10));
        let moveDown = cc.moveBy(0.05, cc.v2(0, -10));
        let sequence = cc.sequence(moveUp, moveDown);
        
        this.node.runAction(sequence);

        cc.log("方塊被頂到了！金幣蹦出來！");
        // 💡 這裡留空間給你最後修改：未來如果你想做「蹦出金幣」或「蹦出蘑菇」，程式碼就寫在這裡！
    }
}