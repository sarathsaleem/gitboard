/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/* global require, define, brackets: true, $, window, navigator */


var GitDasboard = {};
GitDasboard.ele = {};


GitDasboard.getData = function () {
    $.getJSON('data/gitlog.json', function (data) {
        
        var areaData = data.slice(0);
            
        GitDasboard.drawAreaChart(areaData, GitDasboard.ele.areaChart);
        GitDasboard.drawScatterplot(data, GitDasboard.ele.scatterPlot);
        GitDasboard.drawPieChart(data.slice(0), GitDasboard.ele.pieChart);
        GitDasboard.drawTreeMap(data.slice(0), GitDasboard.ele.treeMap);

    });
};

GitDasboard.drawAreaChart = function (data, ele) {

    var canvasWidth = 1000, //$(canvas).width(),
        canvasHeight = 600,
        margin = 50,
        width = canvasWidth - 2 * margin,
        height = canvasHeight - 2 * margin;


    data.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    var prevDate, val;
    
   // var dataMap = d3.time.days(new Date(data[0].date), new Date(data[data.length-1].date));
    
   //TODO: filter date with day map

    data = data.filter(function (d, i) {
        d.date = new Date(d.date);
        if (d.date.getDate() === prevDate) {
            val += 1;  
        } else {
            val = 1;
        }       
        d.index = val; 
        prevDate = d.date.getDate();
        
        if (data[i+1] && data[i+1].date) {
            var nextD = new Date(data[i+1].date);
            if(nextD.getDate() === d.date.getDate()) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    });
    
    var margin = {
            top: 10,
            right: 10,
            bottom: 100,
            left: 40
        },
        margin2 = {
            top: 430,
            right: 10,
            bottom: 20,
            left: 40
        },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var parseDate = d3.time.format("%b %Y").parse;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    var area = d3.svg.area()
        .interpolate("monotone")
        .x(function (d) {
            return x(d.date);
        })
        .y0(height)
        .y1(function (d) {
            return y(d.index);
        });

    var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function (d) {
            return x2(d.date);
        })
        .y0(height2)
        .y1(function (d) {
            return y2(d.index);
        });

    var svg = d3.select(ele).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    x.domain(d3.extent(data.map(function (d) {
        return d.date;
    })));
    y.domain([0, d3.max(data.map(function (d) {
        return d.index;
    }))]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    context.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area2);

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.select(".area").attr("d", area);
        focus.select(".x.axis").call(xAxis);
    }


};

GitDasboard.drawScatterplot = function (data, ele) {

    var canvasWidth = 1200, //$(canvas).width(),
        canvasHeight = 600,
        margin = 30,
        width = canvasWidth - 200 - 2 * margin,
        height = canvasHeight - 2 * margin;

    var colors = d3.scale.category10();
    var users = [];


    data.forEach(function (d, i) {
        d.date = new Date(d.date);
        
        if (users.indexOf(d.author_email) == -1) {
            users.push(d.author_email);
        }
    });



    var x = d3.time.scale()
        .range([10, width]);

    var y = d3.scale.linear()
        .range([height - 10, 0]);

    x.domain(d3.extent(data, function (d) {
        return d.date;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.date.getHours();
    })]);


    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");


    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left").ticks(24).tickFormat(function (hours, i) {
            //it is pm if hours from 12 onwards
            var suffix = (hours >= 12) ? 'pm' : 'am';

            //only -12 from hours if it is greater than 12 (if not back at mid night)
            hours = (hours > 12) ? hours - 12 : hours;

            //if 00 then it is 12 am
            hours = (hours == '0') ? 12 : hours;

            return hours + suffix;
        });


    data.forEach(function (d) {
        d.x = x(d.date);
        d.y = y(d.date.getHours());
    });

    var svg = d3.select(ele).append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var logs = svg.selectAll(".group")
        .data(data)
        .enter()
        .append('g');

    logs.append('circle')
        .attr("r", 5)
        .style("fill", function (d, i) {
            var index = users.indexOf(d.author_email);
            return colors(index);
        });

    logs.transition().duration(1000).attr("transform", function (d) {
        return "translate(" + d.x + ", " + d.y + ")";
    });

    var usersLabel = svg.selectAll(".users")
        .data(users)
        .enter()
        .append('g')
        .attr("transform", function (d, i) {
            return "translate(1000," + (i * 30) + ")";
        });
    usersLabel.append('rect')
        .attr("width", 20)
        .attr("height", 20)
        .style('fill', function (d, i) {
            return colors(i);
        });
    usersLabel.append('text').text(function (d) {
        return d;
    }).attr("transform", "translate(25, 15)");
};


GitDasboard.drawPieChart = function (data, ele) {

    var canvasWidth = 1200, //$(canvas).width(),
        canvasHeight = 600,
        margin = 30,
        width = canvasWidth - 400 - 2 * margin,
        height = canvasHeight - 2 * margin,
        radius = Math.min(width, height) / 2;

    var colors = d3.scale.category10();
    var users = [],
        commitsNumber = {};

    data.forEach(function (d, i) {
        d.date = new Date(d.date);

        if (users.indexOf(d.author_email) == -1) {
            users.push(d.author_email);
        }

        if (commitsNumber[d.author_email]) {
            commitsNumber[d.author_email] += 1;
        } else {
            commitsNumber[d.author_email] = 1;
        }
    });

    users.sort(function (a, b) {
        return commitsNumber[b] - commitsNumber[a];
    });

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return commitsNumber[d];
        });

    var svg = d3.select(ele).append("svg").attr("width", canvasWidth)
        .attr("height", canvasHeight);

    var pieChart = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    var g = pieChart.selectAll(".arc")
        .data(pie(users))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function (d, i) {
            return colors(i);
        });

    var usersLabel = svg.selectAll(".users")
        .data(users)
        .enter()
        .append('g')
        .attr("transform", function (d, i) {
            return "translate(800," + (i * 30) + ")";
        });
    usersLabel.append('rect')
        .attr("width", 20)
        .attr("height", 20)
        .style('fill', function (d, i) {
            return colors(i);
        });
    usersLabel.append('text').text(function (d) {
        return d + " (" + commitsNumber[d] + ")";
    }).attr("transform", "translate(25, 15)");


};


GitDasboard.drawTreeMap = function (data, ele) {

    var parent = {
        name: "Year",
        children: []
    };

    function isInChildren(arrayOfObj, key, val) {
        var isFound = null;
        arrayOfObj.forEach(function (obj, index) {
            if (obj[key] === val) {
                isFound = index;
            }
        });
        return isFound;
    }

    var month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach(function (d) {
        d.date = new Date(d.date);

        var year = d.date.getFullYear(),
            month = d.date.getMonth(),
            day = d.date.getDate(),
            hours = d.date.getHours();

        var isYear = isInChildren(parent.children, 'name', year);

        if (isYear !== null) {
            var monthindex = isInChildren(parent.children[isYear].children, 'name', month_names[month]);

            if (monthindex !== null) {

                var dayIndex = isInChildren(parent.children[isYear].children[monthindex].children, 'name', day);

                if (dayIndex !== null) {

                    parent.children[isYear].children[monthindex].children[dayIndex].size += 1;

                } else {

                    parent.children[isYear].children[monthindex].children.push({
                        name: day,
                        size: 1
                    });
                }

            } else {
                parent.children[isYear].children.push({
                    name: month_names[month],
                    children: []
                });
            }

        } else {
            parent.children.push({
                name: year,
                children: []
            });
        }
    });

    console.log(parent);

    /*

    {
     name : 2010,
     children : [

       { name : 0, children : [ {},{},{},{}]},
       {}

     ]
    }
    */

    var diameter = 900,
        margin = 30;


    var color = d3.scale.linear()
        .domain([-1, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    var pack = d3.layout.pack()
        .padding(2)
        .size([diameter - margin, diameter - margin])
        .value(function (d) {
            return d.size;
        })

    var svg = d3.select(ele).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


    var focus = parent,
        nodes = pack.nodes(parent),
        view;

    var circle = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function (d) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })
        .style("fill", function (d) {
            return d.children ? color(d.depth) : null;
        })
        .on("click", function (d) {
            if (focus !== d) zoom(d), d3.event.stopPropagation();
        });

    var text = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function (d) {
            return d.parent === parent ? 1 : 0;
        })
        .style("display", function (d) {
            return d.parent === parent ? null : "none";
        })
        .text(function (d) {
            return d.name;
        });

    var node = svg.selectAll("circle,text");

    d3.select("body")
        .on("click", function () {
            zoom(parent);
        });

    zoomTo([parent.x, parent.y, parent.r * 2 + margin]);

    function zoom(d) {
        var focus0 = focus;
        focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });

        transition.selectAll("text")
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .style("fill-opacity", function (d) {
                return d.parent === focus ? 1 : 0;
            })
            .each("start", function (d) {
                if (d.parent === focus) this.style.display = "inline";
            })
            .each("end", function (d) {
                if (d.parent !== focus) this.style.display = "none";
            });
    }

    function zoomTo(v) {
        var k = diameter / v[2];
        view = v;
        node.attr("transform", function (d) {
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d) {
            return d.r * k;
        });
    }

};

//http://bl.ocks.org/mbostock/4063318 can be next

$(function () {
    GitDasboard.ele.areaChart = $('.dashboard')[0];
    GitDasboard.ele.scatterPlot = $('.dashboard')[1];
    GitDasboard.ele.pieChart = $('.dashboard')[2];
    GitDasboard.ele.treeMap = $('.dashboard')[3];
    GitDasboard.getData();
});