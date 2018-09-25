

var svg = d3.select('svg');
var speed = 400;
var height = 600;
var width = 600;
var points = new Array();
var animation = new Array();
var num = 10;   // 点集数量
var calColor = "rgb(31, 119, 180)";
var closestColor = "rgb(255, 127, 14)";
var noneColor = "none";
timer = 0;



init();

function init() {
    points.length = 0;
    animation.length = 0;
    window.clearInterval(timer);
    d3.selectAll("svg > *").remove();
    d3.selectAll("#log > *").remove();
    for (var i = 0; i < num; i++) {
        createCircle(i);
    }
    divideAndConquer(points);
    // bruteForce(points);
    console.log(animation);
    animation = animation.reverse();
}

// 蛮力法求解最近点对
function bruteForce(points){
    var mini,minj;
    var min = Number.MAX_VALUE;
    for (var i = 0; i < points.length - 1; i++) {
        for (var j = i + 1; j < points.length; j++) {
            dis = getDistance(points[i], points[j]);        
            if (dis < min){
                mini = i;
                minj = j;
                min = dis;
                setClosestPoints(points[i], points[j], points, 'brute');
            }
        }
    }
    return {"p1": points[mini], "p2": points[minj], "d": min};
}

// 排序入口函数
function divideAndConquer(points){
    points.sort(cmpx);
    closest_points = getClosestPointByRecursive(points)
    console.log('Answer', closest_points);
}

function getClosestPointByRecursive(points){
    if (points.length <= 3)     // 少于4个点时直接计算
        return bruteForce(points);
    else {
        var mid = Math.floor(points.length / 2);
        // 绘制分隔线
        animation.push({'action': 'drawMid', 'p1': points[mid-1]});
        var min_left = getClosestPointByRecursive(points.slice(0, mid));
        var min_right = getClosestPointByRecursive(points.slice(mid));       

        var mind = min_left.d <= min_right.d ? min_left : min_right; 
        animation.push({'action': 'cmpClosest', 'closestA': min_left, 'closestB': min_right});
        setClosestPoints(mind.p1, mind.p2, points);
        // 绘制分隔线两侧距离为mind的分隔线
        
        var section_mid = new Array();

        for(var i = 0; i < points.length; i++)
            if(Math.abs(points[i].x - points[mid-1].x) < mind.d)
                section_mid.push(points[i]);
        animation.push({'action': 'createSection', 'p1': points[mid-1], 'mind': mind.d, 'section_points': section_mid});
        var minm = getClosestPointOfMid(section_mid, mind);
        
        var min_point = mind.d <= minm.d ? mind : minm;
        animation.push({'action': 'cmpClosest', 'closestA': mind, 'closestB': minm});
        setClosestPoints(min_point.p1, min_point.p2, points);
        return min_point;

    }
}

function getClosestPointOfMid(section_mid, mind){
    section_mid.sort(cmpy);
    var minm = mind.d;
    console.log('section_mid', section_mid);
    var mini,minj;
    for(var i = 0; i < section_mid.length - 1; i++)
        for(var j = i + 1; j < section_mid.length && ((section_mid[j].y - section_mid[i].y) < mind.d); j++){
            var dis = getDistance(section_mid[i], section_mid[j])
            if(dis < minm){
                minm = dis;
                mini = i;
                minj = j; 
            }
        }
    return {'p1':section_mid[mini], 'p2': section_mid[minj], 'd': minm};
}

function cmpx(a, b){
    return a.x > b.x;
}

function cmpy(a, b){
    return a.y > b.y;
}


function getDistance(pointA, pointB) {
    animation.push({'action': 'calD', 'p1': pointA, 'p2': pointB });
    return Math.sqrt(Math.pow((pointA.x - pointB.x), 2) + Math.pow((pointA.y - pointB.y), 2));
}

// 以下均是与动画相关的函数
function runAnimation(){
    if(animation.length > 0){
        a = animation.pop();
        switch (a.action) {
            case "calD": {
                calDistanceAnimation(a.p1, a.p2);
                break;
            }
            case "setClosest": {
                setClosestPointsAnimation(a.p1, a.p2, a.points);
                break;
            }
            case "drawMid": {
                drawMidAnimation(a.p1);
                break;
            }
            case "createSection": {
                createSectionAnimation(a.p1.x + 5, a.mind, a.section_points);
                break;
            }
            case "cmpClosest": {
                cmpClosestPointsAnimation(a.closestA, a.closestB);
                break;
            }
        }
        return false;
    }
    d3.selectAll('rect').remove();
    // 移除此前渲染的区间点效果
    d3.selectAll('circle').style('stroke-dasharray', 'none');
    return true;

}

function drawMidAnimation(mid) {
    var segment = svg.append("line")
                    .attr("x1", mid.x+5)
                    .attr("y1", 0)
                    .attr("x2", mid.x+5)
                    .attr("y2", 600)
                    .style("stroke", "#f35a5a")
                    .style("stroke-dasharray", "1000, 1000")
                    .transition()
                    .duration(speed)
                    .styleTween("stroke-dashoffset", function() {
                       return d3.interpolateNumber(1000, 0);
                    });
    d3.select('#log').insert('div',":first-child")
                    .style('background-color', '#dce1e6')
                    .text('split points')
                    .transition()
                    .duration(speed)
                    .style('background-color', 'white');
}

// 清除对应区间中的points颜色
function clearPointsColor(points) {
    for (var i = 0; i < points.length; i++) {
        d3.select("#"+ points[i].id).style("fill", noneColor);
    }
    
}

function setClosestPoints(pointA, pointB, points, from="cmp"){
    animation.push({"action": "setClosest", "p1": pointA, "p2": pointB, 'points': points, 'from': from});
}

function setClosestPointsAnimation(pointA, pointB, points){
    clearPointsColor(points);
    var circleA = d3.select("#"+ pointA.id)                        
                        .transition()
                        .duration(speed)
                        .style("fill", setPointColor(pointA, "setClosest"));
                        
    var circleB = d3.select("#"+ pointB.id)                        
                        .transition()
                        .duration(speed)
                        .style("fill", setPointColor(pointB, "setClosest"));

    // update index form                    
    d3.select('#pa').html('pointA: (' + pointA.x + ',' + pointA.y + ')');
    d3.select('#pb').html('pointB: (' + pointB.x + ',' + pointB.y + ')');
    var distance = Math.sqrt(Math.pow((pointA.x - pointB.x), 2) + Math.pow((pointA.y - pointB.y), 2))
    d3.select('#distance').html('distance: ' + Number(distance).toFixed(2));
    d3.select('#log').insert('div', ":first-child")
                    .style('background-color', '#abd1f7')
                    .text('set new closest points')
                    .transition()
                    .duration(speed)
                    .style('background-color', 'white');
}

// 根据funciton状态设定颜色
function setPointColor(point, action){
    if (action == "setClosest")
        return closestColor
    else if (action == "setNone"){
        if (d3.select("#"+point.id).style("fill") != closestColor)
            return noneColor;
        else 
            return closestColor;  
    }
    else {
        if (d3.select("#"+point.id).style("fill") != closestColor)
            return calColor;
        else 
            return closestColor;
    }    
}

// 计算两点距离时的动画效果
function calDistanceAnimation(pointA, pointB)
{

    var circleA = d3.select("#"+ pointA.id)                        
                        .transition()
                        .duration(speed)
                        .style("fill", setPointColor(pointA, "calD"))
                        .transition()
                        .style("fill", setPointColor(pointA, "setNone"));
    var circleB = d3.select("#"+ pointB.id)
                        .transition()
                        .duration(speed)
                        .style("fill", setPointColor(pointB, "calD"))
                        .transition()
                        .style("fill", setPointColor(pointB, "setNone"));

    var segment = svg.append("line")
                    .attr("x1", pointA.x)
                    .attr("y1", pointA.y)
                    .attr("x2", pointB.x)
                    .attr("y2", pointB.y)
                    .style("stroke-dasharray", "1000, 1000")
                    .transition()
                    .duration(speed)
                    .styleTween("stroke-dashoffset", function() {
                       return d3.interpolateNumber(1000, 0);
                    });
    segment.remove();
    
    d3.select('#log').insert('div',":first-child")
                    .style('background-color', '#dce1e6')
                    .text('caculating distance')
                    .transition()
                    .duration(speed)
                    .style('background-color', 'white');

}

function cmpClosestPointsAnimation(pointsA, pointsB){
    var id = [pointsA.p1.id, pointsA.p2.id, pointsB.p1.id, pointsB.p2.id];
    
    for(var i = 0; i < id.length; i++){
        d3.select('#'+id[i]).style('stroke-width', '5px')
                            .transition()
                            .duration(speed)
                            .style('stroke-width', '2px');
    }
    d3.select('#log').insert('div',":first-child")
    .style('background-color', closestColor)
    .text('compare closest')
    .transition()
    .duration(speed)
    .style('background-color', 'white');

}


function createCircle(i){
    var x = Math.floor(Math.random() * height);
    var y = Math.floor(Math.random() * width)
    svg.append("circle")
      .attr("r", 4)    
      .attr("stroke-opacity", 0.5)
      .attr("cy", y)
      .attr("cx", x)
      .attr("id", "p"+i);
    points.push({"x": x, "y": y, "id": "p"+i});
}

function createSectionAnimation(midx, distance, section_points){
    // 移除此前生成的区间
    d3.selectAll('rect').remove();
    // 移除此前渲染的区间点效果
    d3.selectAll('circle').style('stroke-dasharray', 'none');
    // 边界限定为svg中
    var left = midx - distance - 4;
    var right = midx + distance + 4;
    if(left < 0 )
        left = 0;
    if(right > 600)
        right = 600;
    var rect1 = svg.insert("rect")
                    .attr("x", midx)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 600)
                    .style("stroke", "rgba(200, 240, 155, 0.3)")
                    .style("fill", "rgba(200, 240, 155, 0.3)")
                    .transition()
                    .duration(speed)
                    .attr("x", left)
                    .styleTween("width", function() {
                        return d3.interpolateNumber(0, midx - left);
                     });
                    
    var rect2 = svg.insert("rect")
                    .attr("x", midx)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 600)
                    .style("stroke", "rgba(200, 240, 155, 0.3)")
                    .style("fill", "rgba(200, 240, 155, 0.3)")
                    .transition()
                    .duration(speed)
                    .attr("width", right - midx);

    d3.select('#log').insert('div',":first-child")
                    .style('background-color', 'rgba(200, 240, 155, 0.3)')
                    .text('test points in section')
                    .transition()
                    .duration(speed)
                    .style('background-color', 'white');
    // 对区间中的点进行渲染
    for(var i = 0; i < section_points.length; i++){
        d3.select('#'+section_points[i].id).style('stroke-dasharray', '2 3');
    }
                    
}


function stopTimer() {
    window.clearInterval(timer);
}

function startTimer() {
    timer = setInterval(runAnimation, speed+300);
}

function restart() {
    animation.length = 0;
    window.clearInterval(timer);
    d3.selectAll("svg > line").remove();
    d3.selectAll("svg > rect").remove();
    d3.selectAll("svg > circle").style("fill","none");
    d3.selectAll("#log > *").remove();
    divideAndConquer(points);
    // bruteForce(points);
    console.log('animation', animation);
    animation = animation.reverse();
    startTimer();
}

function setSpeed() {
    speed = d3.select('#speed').property('value');
    stopTimer();
    if(speed <= 200)
        speed = 200;
    timer = setInterval(runAnimation, speed+200);
}

// 数量过多时运行过程混乱，因此暂时只选用10个点作为演示
// function setNumber() {
//     num = d3.select('#number').property('value');
//     init();
// }

