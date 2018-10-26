/*窗体加载时运行的js代码 */
window.onload = function () {
    /*满imgNum消图 */
    imgNum = 3;
    init(5, 3);
}

/*初始化构造函数*/
function init(sz, pictureN) {
    pictureNum = pictureN;  //选取几张图片
    swapTimes = 0;  //玩家交换的次数
    score = 0;  //玩家得分，每消一个图，得一分
    gameTime = 60;  //游戏时间
    IshelpShowed = false; //帮助栏是否在界面
    IsdataShowed = false;   //数据栏是否在界面
    isclick = true; //图片是否可点击
    gridSize = 58; //图片的尺寸，单位px
    size = parseInt(sz);    //游戏盘的尺度，一行有size个图片   
    boxSize = size * (gridSize + 2);    //游戏盘尺寸，单位px
    firstGridClicked = false;   //是否第一次选中某个单位
    currentGrid = -1;   //当前单位编号
    internalTime = 30;  //等待动画的询问时间间隔
    animationTime = 400;    //动画播放时间
    cleanQueue = 0; //清除单位动画的队列
    slideDownQueue = 0; //下滑单位动画的队列
    addQueue = 0;   //添加单位动画的队列
    marix = new Array();    //游戏盘数据矩阵
    for (var i = 0; i < size; i++) {
        marix[i] = new Array();
        for (var j = 0; j < size; j++) {
            marix[i][j] = 0;
        }
    }
    imgSolve(); //图片处理
    getNewArray();  //获得可玩的游戏盘数据矩阵
    createMap();    //创建游戏盘
    gridClickable();    //为单位加上点击监听
    timerStart();   //计时器
    //彩蛋
    if (sz == 2) {
        alert("please score~");
    }
    //console.log(marix);
}

//选关和resart
function go() {
    var selectedSize = document.getElementById("GameSize");
    var selectedLevel = document.getElementById("GameLevel");
    var a = selectedSize.options[selectedSize.options.selectedIndex].value;
    var b = selectedLevel.options[selectedLevel.options.selectedIndex].value;
    init(a, b);
}

//显示数据
function showData() {
    if (IsdataShowed) {
        $("#score").fadeOut(1500);
        $("#step").fadeOut(1500);
        $("#time").fadeOut(1500);
        IsdataShowed = false;
    } else {
        $("#score").fadeIn(1500);
        $("#step").fadeIn(1500);
        $("#time").fadeIn(1500);
        IsdataShowed = true;
    }

}
//显示帮助
function showHelp() {
    if (IshelpShowed) {
        $("#help").fadeOut(1500);
    } else {
        $("#help").fadeIn(1500);
    }
}

var timerStart = function () {
    if (gameTime > 0) {
        setTimeout(timerStart, 1000);
        gameTime--;
        $("#time").text("Time: " + gameTime.toString());
    } else {
        alert("Time up, your final score: " + score);
        //如果不重新加载页面，上一次计时器线程会干扰当前线程
        location.reload();
    }
}

//处理图片
function imgSolve() {
    imgArray = new Array();
    for (var i = 0; i < 10; i++) {
        var img = document.getElementById('img' + (i + 1));
        img.width = gridSize;
        img.height = gridSize;
        imgArray[i] = img;

    }

}

/*得到一个可玩的二维矩阵*/
function getNewArray() {
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            marix[i][j] = parseInt(Math.random() * pictureNum + 1);
            if (i == 0 && j < 2) {
                continue;
            }
            if (checkCleanable(i, j).IsCleanable) {
                while (checkCleanable(i, j).IsCleanable) {
                    var random = parseInt(Math.random() * pictureNum + 1);
                    if (random == marix[i][j]) {
                        continue;
                    }
                    //console.log(random);
                    marix[i][j] = random;
                }
            }
            //console.log(marix);
        }
    }
}

//根据可玩数组构造可视化游戏图
function createMap() {
    var box = document.getElementById("play_area");
    $(box).html("");
    $(box).css({
        'width': boxSize,
        'height': boxSize
    });
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            var grid = document.createElement("div");
            grid.id = i * size + j;
            grid.className = "grid";
            $(grid).css({
                'width': gridSize,
                'height': gridSize,
                'top': i * (gridSize + 2),
                'left': j * (gridSize + 2)
            });
            var imgcopy = new Image();
            imgcopy.width = imgArray[marix[i][j] - 1].width;
            imgcopy.height = imgArray[marix[i][j] - 1].height;
            imgcopy.src = imgArray[marix[i][j] - 1].src;
            grid.appendChild(imgcopy);
            //$(grid).html();
            box.appendChild(grid);
        }
    }
}

//给gird添加点击监听及其实现
function gridClickable() {
    $('.grid').click(function () {
        var id = parseInt(this.id);
        //防止用户在动画时点击grid，导致图形错乱
        if (!isclick) {
            return;
        }
        //第一次选中一个grid
        if (!firstGridClicked || parseInt(this.id) == currentGrid) {
            currentGrid = id;
            firstGridClicked = true;
            $('#' + id).css("border", "1px solid red");
        }
        //选中第二个用于交换的grid
        else {
            $('#' + currentGrid).css("border", "1px solid black");
            firstGridClicked = false;
            //选中不相邻的grid
            if (!IsChangable(id)) {
                return;
            }

            //var firstNode = $('#'+currentGrid);
            var firstNode = document.getElementById(currentGrid);
            swap(this, firstNode, animationTime);
            //显示交换次数
            swapTimes++;
            $("#step").text("Swap Times: " + swapTimes.toString());
            //锁住点击事件，防止误点
            isclick = false;
            var thisResult = checkCleanable(Math.floor(id / size), Math.round(id % size));
            var firstGridResult = checkCleanable(Math.floor(currentGrid / size), Math.round(currentGrid % size))
            if (thisResult.IsCleanable || firstGridResult.IsCleanable) {
                var finalCleanArray = mergeTwoCleanableArray(thisResult.CleanableArray, firstGridResult.CleanableArray);
                ExcuteClean(finalCleanArray);
                //console.log(marix);
            } else {
                sleep(animationTime).then(() => {
                    isclick = true;
                });
            }
        }
    });
}


//下移grid及其动画
var slideDown = function () {
    if (cleanQueue > 0) {
        setTimeout(slideDown, internalTime);
    } else {
        //记录下落的停止节点(为了一列有多段grid设立)
        /*var moveDownSignalArray = new Array();
        for (var i = 0; i < size; i++) {
            moveDownSignalArray[i] = 0;
        }*/
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                //确定此列需要下移
                if (marix[i][j] == 0) {
                    //从底向上遍历此列
                    for (var k = size - 1; k >= 0; k--) {
                        //如果改grid是实体
                        if (marix[k][j] != 0) {
                            //确定下移层数
                            var lv = 0;
                            for (var n = k; n < size; n++) {
                                if (marix[n][j] == 0) {
                                    lv++;
                                }
                            }
                            //不下移
                            if (lv == 0) {
                                continue;
                            } else {
                                //逻辑下移
                                marix[k + lv][j] = marix[k][j];
                                marix[k][j] = 0;
                                //物理下移
                                var currentNode = document.getElementById(k * size + j);
                                slideDownQueue++; //控制信号量
                                moveDownGrid(currentNode, lv, animationTime);
                                var newId = parseInt(currentNode.id) + size * lv;
                                currentNode.id = newId;
                            }
                        }
                    }
                }
            }
        }
        //add
        addGrids2Box();
    }
}

//添加grid及其动画
var addGrids2Box = function () {
    if (slideDownQueue > 0 || cleanQueue > 0) {
        setTimeout(addGrids2Box, internalTime);
    } else {
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (marix[i][j] == 0) {
                    marix[i][j] = parseInt(Math.random() * pictureNum + 1);
                    if (checkCleanable(i, j).IsCleanable) {
                        while (checkCleanable(i, j).IsCleanable) {
                            var random = parseInt(Math.random() * pictureNum + 1);
                            if (random == marix[i][j]) {
                                continue;
                            }
                            marix[i][j] = random;
                        }
                    }
                    addQueue++; //控制信号量
                    addGrid(i, j, animationTime);
                }
            }
        }
        gothroughMap();
    }
}

//遍历全图，查找剩余可清除的坐标
var gothroughMap = function () {
    if (slideDownQueue > 0 || cleanQueue > 0 || addQueue > 0) {
        setTimeout(gothroughMap, internalTime);
    } else {
        var NeedCleanArray = null;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (checkCleanable(i, j).IsCleanable) {
                    NeedCleanArray = mergeTwoCleanableArray(NeedCleanArray, checkCleanable(i, j).CleanableArray);
                }
            }
        }
        if (NeedCleanArray == null) {
            isclick = true;
            return;
        } else {
            ExcuteClean(NeedCleanArray);
        }
    }
}

//执行清除矩阵的后续所有动作
var ExcuteClean = function (array) {
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if (array[i][j] == 1) {
                //统计分数，每消掉一个grid，得一分
                score++;
                //移除
                marix[i][j] = 0;
                cleanQueue++;
                removeGrid(i * size + j, animationTime);
            }
        }
    }
    //显示得分
    $("#score").text("Score: " + score.toString());
    slideDown();


}

//物理移除某个单元
function removeGrid(gridId, time) {
    $('#' + gridId).fadeOut(time, function () {
        $('#' + gridId).remove();
        cleanQueue--;
    });
}

//物理添加某个单元
function addGrid(x, y, time) {
    var box = document.getElementById("play_area");
    var newNode = document.createElement("div");
    newNode.id = x * size + y;
    newNode.className = "grid";
    $(newNode).css({
        'width': gridSize,
        'height': gridSize,
        'top': x * (gridSize + 2),
        'left': y * (gridSize + 2),
        'display': 'none'
    });
    var imgcopy = new Image();
    imgcopy.width = imgArray[marix[x][y] - 1].width;
    imgcopy.height = imgArray[marix[x][y] - 1].height;
    imgcopy.src = imgArray[marix[x][y] - 1].src;
    newNode.appendChild(imgcopy);
    box.appendChild(newNode);
    $(newNode).fadeIn(time, function () {
        addQueue--;
    });
    gridClickable();

}
//物理下移
function moveDownGrid(node, level, time) {
    var pos = $(node).position();
    $(node).animate({
        left: pos.left,
        top: pos.top + (gridSize + 2) * level
    }, time, function () {
        slideDownQueue--;
    });
}

//睡眠函数，独立线程
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

//检测当前grid和第一次选中grid是否可换
function IsChangable(nodeId) {
    if (nodeId == currentGrid + 1 || nodeId == currentGrid - 1 || nodeId == currentGrid - size || nodeId == currentGrid + size) {
        return true;
    }
    return false;
}

//将两个清除矩阵合并
function mergeTwoCleanableArray(fArray, sArray) {
    if (fArray == null) {
        return sArray;
    }
    if (sArray == null) {
        return fArray;
    }
    rArray = new Array();
    for (var i = 0; i < size; i++) {
        rArray[i] = new Array();
        for (var j = 0; j < size; j++) {
            if (fArray[i][j] == 1 || sArray[i][j] == 1) {
                rArray[i][j] = 1;
            } else {
                rArray[i][j] = 0;
            }
        }
    }
    return rArray;
}

//交换数据和物理层
function swap(a, b, time) {

    //交换底层矩阵数据
    var aId = parseInt(a.id);
    var bId = parseInt(b.id);
    //console.log(aId,size,Math.floor(aId/size),Math.round(aId%size));
    //console.log(bId,size,Math.floor(bId/size),Math.round(bId%size));
    var tempValue = marix[Math.floor(aId / size)][Math.round(aId % size)];
    marix[Math.floor(aId / size)][Math.round(aId % size)] = marix[Math.floor(bId / size)][Math.round(bId % size)];
    marix[Math.floor(bId / size)][Math.round(bId % size)] = tempValue;

    //交换前端标号
    var tempid = a.id;
    a.id = b.id;
    b.id = tempid;

    //交换前端物理位置
    var apos = $(a).position();
    var bpos = $(b).position();
    $(a).animate({
        left: bpos.left,
        top: bpos.top
    }, time);
    $(b).animate({
        left: apos.left,
        top: apos.top
    }, time)

}

/*检查结果类*/
var checkResult = {
    init: function (IsCleanable, array) {
        var result = {};
        result.IsCleanable = IsCleanable;
        result.CleanableArray = array;
        return result;
    }

};

//检查某个坐标的grid是否可清除
function checkCleanable(row, col) {
    //初始化结果
    var result = checkResult.init(false, null);
    //当前被检查的图片
    var tempImg = marix[row][col];
    //行列连续相同的个数
    var row_same_num = 0;
    var col_same_num = 0;

    //行列连续相同的终结点
    /*我是笨蛋 */
    var rowSameEnd = 0;
    var colSameEnd = 0;

    //定义检查边界
    var leftEdge = ((col - imgNum + 1) > 0) ? (col - imgNum + 1) : 0;
    var topEdge = ((row - imgNum + 1) > 0) ? (row - imgNum + 1) : 0;
    var rightEdge = ((col + imgNum) < size) ? (col + imgNum) : size;
    var downEdge = ((row + imgNum) < size) ? (row + imgNum) : size;
    //console.log(row,col);
    //console.log('l:',leftEdge,' r:',rightEdge,' d:',downEdge,' t:',topEdge);
    //检查行
    for (var i = leftEdge; i < rightEdge; i++) {
        if (marix[row][i] == tempImg) {
            row_same_num++;
            //直到循环结束时，最后一个grid依然与当前相同
            //不考虑！！！叫你不考虑！！！丢
            if (i == rightEdge - 1) {
                rowSameEnd = i;
            }
        } else {
            if (row_same_num >= imgNum) {
                rowSameEnd = i - 1;
                break;
            } else {
                row_same_num = 0;
            }
        }
    }
    //检查列
    for (var i = topEdge; i < downEdge; i++) {
        if (marix[i][col] == tempImg) {
            col_same_num++;
            //直到循环结束时，最后一个grid依然与当前相同
            //不考虑！！！叫你不考虑！！！丢
            if (i == downEdge - 1) {
                colSameEnd = i;
            }
        } else {
            if (col_same_num >= imgNum) {
                colSameEnd = i - 1;
                break;
            } else {
                col_same_num = 0;
            }
        }

    }

    if (row_same_num >= imgNum || col_same_num >= imgNum) {
        //初始化可清理矩阵
        var CleanableArray = new Array();
        for (var i = 0; i < size; i++) {
            CleanableArray[i] = new Array();
            for (var j = 0; j < size; j++) {
                CleanableArray[i][j] = 0;
            }
        }
        if (row_same_num >= imgNum) {
            //console.log('same_num:',row_same_num,',endIndex:',row_same_end);
            for (var linesameIndex = rowSameEnd; linesameIndex > rowSameEnd - row_same_num; linesameIndex--) {
                CleanableArray[row][linesameIndex] = 1;
            }
        }
        if (col_same_num >= imgNum) {
            for (var colsameIndex = colSameEnd; colsameIndex > colSameEnd - col_same_num; colsameIndex--) {
                CleanableArray[colsameIndex][col] = 1;
            }
        }
        result.IsCleanable = true;
        result.CleanableArray = CleanableArray;
    }
    return result;
}


/*
曾经失败的算法^_^告辞！
//执行清除矩阵的后续所有动作
function ExcuteClean(array) {
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if (array[i][j] == 1) {
                //统计分数，每消掉一个grid，得一分
                score++;
                //移除
                marix[i][j] = 0;
                removeGrid(i * size + j, animationTime);
            }
        }
    }
    var waitTimes = 0;
    //休眠等待移除动画完成
    sleep(animationTime * 2.25).then(() => {
        var moveDownSignalArray = new Array();
        for (var i = 0; i < size; i++) {
            moveDownSignalArray[i] = 0;
        }
        
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (marix[i][j] == 0) {
                    //确定下移层数
                    var lv = i;
                    while (lv < size && marix[lv][j] == 0) {
                        lv++;
                    }
                    lv -= i;

                    //如果是该列第一次下移
                    if (moveDownSignalArray[j] == 0) {
                        for (var x = i - 1; x >= 0; x--) {
                            //逻辑下移
                            marix[x + lv][j] = marix[x][j];
                            //物理下移
                            var currentNode = document.getElementById(x * size + j);
                            moveDownGrid(currentNode, lv, animationTime);
                            var newId = parseInt(currentNode.id) + size * lv;
                            currentNode.id = newId
                        }
                        //将下移后的空位用0补齐
                        for (var y = 0; y < lv; y++) {
                            marix[y][j] = 0;
                        }
                        //记录第该列第一次移除的后的节点上限
                        moveDownSignalArray[j] = lv;
                    }

                    //该列已经位移过了，从上一次断点开始位移
                    else {
                        waitTimes++;
                        sleep(animationTime * 2.25* (waitTimes+1)).then(() => {
                            for (var x = i - 1; x >= moveDownSignalArray[j]; x--) {
                                //逻辑下移
                                marix[x + lv][j] = marix[x][j];
                                //物理下移
                                var currentNode = document.getElementById(x * size + j);
                                moveDownGrid(currentNode, lv, animationTime);
                                var newId = parseInt(currentNode.id) + size * lv;
                                currentNode.id = newId
                            }
                            //将下移后的空位用0补齐
                            for (var y = 0; y < lv + moveDownSignalArray[j]; y++) {
                                marix[y][j] = 0;
                            }
                            //记录第该列本次移除的后的节点上限
                            moveDownSignalArray[j] = lv;
                        });
                        
                    }

                }
            }
        }
    });
    //console.log(marix);
    //休眠等待下移动画完成
    sleep(animationTime * (waitTimes+2)*2.25).then(() => {
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (marix[i][j] == 0) {
                    marix[i][j] = parseInt(Math.random() * imgNum + 1);
                    if (checkCleanable(i, j).IsCleanable) {
                        while (checkCleanable(i, j).IsCleanable) {
                            var random = parseInt(Math.random() * imgNum + 1);
                            if (random == marix[i][j]) {
                                continue;
                            }
                            marix[i][j] = random;
                        }
                    }
                    addGrid(i, j, animationTime);
                }
            }
        }
    })
    //console.log(marix);
    console.log(score);
    //动画结束之后遍历全图
    sleep(animationTime * (waitTimes+3.5)*2.25).then(() => {
        var NeedCleanArray = null;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (checkCleanable(i, j).IsCleanable) {
                    NeedCleanArray = mergeTwoCleanableArray(NeedCleanArray, checkCleanable(i, j).CleanableArray);
                }
            }
        }
        if (NeedCleanArray == null) {
            return;
        } else {
            ExcuteClean(NeedCleanArray);
        }
    });
}
*/