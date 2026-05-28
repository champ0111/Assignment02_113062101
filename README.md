# Software Studio 2026 Spring
## Assignment 02 Web Mario

### Scoring
|        **Item**        | **Score** | **Check** |
| :--------------------- | :-------: | :-------: |
| Complete Game Process  |    5%     |     Y     |
| Basic-Rules            |    50%    |     Y     |
| Animations             |    10%    |     Y     |
| Sound Effects          |    10%    |     Y     |
| UI                     |    10%    |     Y     |
| Appearance             |    10%    |     Y     |
| Bonus                  |    10%    |     Y     |
| Git                    |    5%     |     Y     |
---

### How to use 
基礎操作流程：
1. 在Menu Scene註冊帳號或登入帳號
2. 在LevelSelect Scene選擇關卡，或者查看LeaderBoard排行榜
3. 點選Stage 1後進到GameStart Scene，Loading 2秒後進到Level1
4. 用鍵盤的A跟D控制瑪莉歐的左右前進，空白鍵是跳躍，可以撞問號方塊獲取金幣或蘑菇，吃到蘑菇瑪莉歐會變大，並且獲得一格血量，在碰到怪物時不會馬上死掉
5. 瑪莉歐掉到虛空會直接死掉重來，碰到最後的終點旗子則通關，並跳回LevelSelect Scene
6. 吃金幣、蘑菇、踩栗寶寶與慢慢龜皆可獲得分數
7. 三條命用完會GameOver，跳回LevelSelect Scene

### Bonus
1. Firebase:
    - Deploy to Firebase page
    - Membership mechanism (Sign up, Login with firebase, save/restore game progress)
2. Leaderboard: 根據Score排出前五名玩家
3. Enemies:
    - 慢慢龜: 可以踩他、踢龜殼、有走路動畫
    - 吞食花: 藏在水管的敵人，瑪莉歐在水管旁邊或在水管上時則不會出現
4. Sound Effects:
    - BGM
    - Player Jump & die sound effects
    - 蘑菇出現 & 吃到蘑菇有音效
    - 踩到敵人有音效
    - 從側邊踢龜殼有音效
    - 吃到金幣有音效
    - 瑪莉歐受傷有音效
5. Animations 
    - Player has walk & jump animations
    - Enemies Animation:
        - 栗寶寶: 走路 & 被踩的動畫
        - 慢慢龜: 走路 & 變龜殼的動畫
        - 吞食花: 從水管出現時的動畫
6. Death Action: 瑪莉歐死掉時有個跳起來在掉下去的動作

### Web page link
[網址](https://mywebmario-80c27.web.app)
[GithubURL](https://github.com/champ0111/Assignment02_113062101.git)

<style>
table th{
    width: 100%;
}
</style>
