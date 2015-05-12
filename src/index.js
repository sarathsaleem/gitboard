/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/* global require, define, brackets: true, $, window, navigator */


var GitDasboard = {};
GitDasboard.ele = {};


GitDasboard.getData = function () {
    $.getJSON('data/gitlog.json', function (data) {
        GitDasboard.drawAreaChart(data, GitDasboard.ele.areaChart);
        GitDasboard.drawScatterplot(data, GitDasboard.ele.scatterPlot);
        GitDasboard.drawPieChart(data, GitDasboard.ele.pieChart);

    });
};

GitDasboard.drawAreaChart = function (data, ele) {

    var canvasWidth = 1000, //$(canvas).width(),
        canvasHeight = 600,
        margin = 30,
        width = canvasWidth - 2 * margin,
        height = canvasHeight - 2 * margin;

    data.forEach(function (d, i) {
        d.date = new Date(d.date);
        d.index = data.length - i;
    });


    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var area = d3.svg.area()
        .x(function (d) {
            return x(d.date);
        })
        .y0(height)
        .y1(function (d) {
            return y(d.index);
        });
    x.domain(d3.extent(data, function (d) {
        return d.date;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.index;
    })]);

    var svg = d3.select(ele).append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);


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
        d.index = data.length - i;

        if (users.indexOf(d.author_email) == -1) {
            users.push(d.author_email);
        }
    });



    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

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


//http://bl.ocks.org/mbostock/4063318 can be next

$(function () {
    GitDasboard.ele.areaChart = $('.dashboard')[0];
    GitDasboard.ele.scatterPlot = $('.dashboard')[1];
    GitDasboard.ele.pieChart = $('.dashboard')[2];
    GitDasboard.getData();
});
