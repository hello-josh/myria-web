var networkVisualization = function (element, fragments, queryPlan) {
    $('#title-right-vis').html(templates.titleNetworkVis({src: fragments[0], dst: fragments[1]}));

    $(element.node()).empty();
    $(element.node()).append(templates.networkVisFrames);

    createViz();

    function createViz() {
        var matrixElement = element.select(".matrix");

        var     matMargin = {top: 50, right: 30, bottom: 10, left: 60},
                labelMargin = {top: 40, left: 40},
                axisMargin = {left: 30, bottom: 30, right: 30},
                width = parseInt(matrixElement.style('width'), 10),
                height = width,
                matrixWidth = width - matMargin.left - matMargin.right,
                matrixHeight = height - matMargin.top - matMargin.bottom;

        var columnScale = d3.scale.ordinal()
            .rangeBands([0, matrixWidth], 0.1, 0);

        var rowScale = d3.scale.ordinal()
            .rangeBands([0, matrixHeight], 0.1, 0);

        //append the svg for matrix
        var matrixChart = matrixElement.append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "matrix-chart")
            .append("g")
                .attr("transform", "translate(" + matMargin.left + "," + matMargin.top + ")");

        var colLabel = matrixChart.append('text')
                        .text('destination worker')
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "11px")
                        .style("text-anchor", "end")
                        .attr('x', matrixWidth)
                        .attr('y', -matMargin.top + labelMargin.top/3);

        var rowLabel = matrixChart.append('text')
                        .text('source worker')
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "11px")
                        .style("text-anchor", "start")
                        .attr("dy", ".71em")
                        //.attr('y', width - matMargin.bottom - labelMargin.bottom - 15)
                        //.attr('x', -labelMargin.left - 5);
                        .attr('transform', 'translate(' + [-matMargin.left + labelMargin.left/3, matrixHeight] + ") rotate(-90)");

        var rawMatrix = matrixChart.append('g')
              .attr('class','matrix');

        var tickCol = matrixChart.append('g')
            .attr('class','ticks')
            .attr('transform', 'translate(0 ,' + (labelMargin.top - matMargin.top) + ')');

        var tickRow = matrixChart.append('g')
            .attr('class','ticks')
            .attr('transform', 'translate(' + (labelMargin.top - matMargin.top) + ', 0)');

        // download data
        var fragmentId = fragments[0];
        var url = templates.urls.sentData({
            myria: myriaConnection,
            query: queryPlan.queryId,
            fragment: fragmentId
        });

        var sources = [], destinations = [];

        d3.csv(url, function (data) {
            var dataset = {},
                summary = {
                    numTuples: 0,
                    localTuples: 0
                };

            // column representation to safe space
            data.forEach(function(d,i) {
                var source = +d.workerId;
                var dest = +d.destWorkerId;
                var pixelID = '' + source + '_' + dest;
                var key = [source, dest];
                if (!(key in dataset)) {
                    dataset[key] = {
                        nanoTime: [],
                        numTuples: [],
                        sumTuples: 0,
                        src: source,
                        dest: dest,
                        pixelID: pixelID,
                        active: false
                    };
                }
                dataset[key].nanoTime.push(+d.nanoTime);
                dataset[key].numTuples.push(+d.numTuples);
                dataset[key].sumTuples += +d.numTuples;
                sources.push(source);
                destinations.push(dest);
            });

            _.each(dataset, function(d) {
                d.maxTuples = d3.max(d.numTuples);
                d.begin = d3.min(d.nanoTime);
                d.end = d3.max(d.nanoTime);
                d.values = _.zip(d.nanoTime, d.numTuples);
                delete d.nanoTime;
                delete d.numTuples;

                summary.numTuples += d.sumTuples;
                if (d.src == d.dest) {
                    summary.localTuples += d.sumTuples;
                }
            });

            summary.duration = _.max(_.pluck(dataset, 'end')) - _.min(_.pluck(dataset, 'begin'));

            sources = _.uniq(sources);
            destinations = _.uniq(destinations);

            updateSummary(element.select(".summary"), summary);

            draw(dataset, _.sortBy(sources, function(d) {return d;}), _.sortBy(destinations, function(d) {return d;}));
        });

        var button = element.select(".clear").append("button")
            .text('clear selection')
            .on("click", function() {
                chart.emptyActiveKeys();
                chart.update();
                for (var i = 0; i < sources.length; i++) {
                    for (var j = 0; j < destinations.length; j++) {

                        var id = '#pixel_' + sources[i] + '_' + destinations[j];
                        d3.select(id).style("stroke", "none");
                        d3.select(id).datum().active = false;
                   }
                }
            });

        var chart = timeSeriesChart(element);

        function draw(rawData, sources, destinations) {
            var data = _.values(rawData);
            rowScale.domain(sources);
            columnScale.domain(destinations);

            var maxValue = d3.max(data, function(d) { return d.sumTuples; });

            var color = chroma.scale('BuPu').domain([0, maxValue]).correctLightness(true).mode('lab');

            var pixel = rawMatrix
                .selectAll('rect.pixel')
                .data(data);

            pixel.enter()
                .append('rect')
                .attr('class', 'pixel');

            pixel.attr('width', columnScale.rangeBand())
                .attr('height', rowScale.rangeBand())
                .attr('y', function(d){
                    return rowScale(d.src);})
                .attr('x', function(d){
                    return columnScale(d.dest);})
                .attr('id', function(d){
                    return "pixel_" + d.pixelID;})
                .style('fill',function(d){
                    // access value
                    return color(d.sumTuples);})
                .tooltip(function(d) {
                    return templates.nwTooltip({
                        sumTuples: largeNumberFormat(d.sumTuples),
                        src: d.src,
                        dest: d.dest
                    });
                })
                .on('click', function(d) {
                    if (!d.active) {
                        chart.add(rawData, d.src, d.dest);
                        d3.select(this).attr("class", "pixel active");
                    } else {
                        chart.remove(d.src, d.dest);
                        d3.select(this)
                          .style("stroke", "none");
                    }
                    d.active = !d.active;
                });

            function addColTick(selection) {
                selection
                    .append('text')
                    .style('text-anchor', 'left')
                    .style("alignment-baseline", "middle")
                    .attr('class','tick')
                    .on('click', function(d) {
                        pairs = [];
                        for (var i = 0; i < sources.length; i++) {
                            pairs.push([sources[i],d]);
                            var id = '#pixel_' + sources[i] + '_' + d;
                            d3.select(id).attr("class", "pixel active");
                            d3.select(id).datum().active = true;
                        }
                        chart.batchAdd(rawData, pairs);
                    })
                    .attr("transform", "rotate(-90)");
            }

            function addRowTick(selection) {
                selection
                    .append('text')
                    .attr('class','tick')
                    .style("alignment-baseline", "middle")
                    .style('text-anchor', 'end')
                    .on('click', function(d) {
                        pairs = [];
                        for (var i = 0; i < destinations.length; i++) {
                            pairs.push([d,destinations[i]]);
                            var id = '#pixel_' + d + '_' + destinations[i];
                            d3.select(id).attr("class", "pixel active");
                            d3.select(id).datum().active = true;
                        }
                        chart.batchAdd(rawData, pairs);
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).style('cursor','pointer');
                    });
            }
            var tickColEl = tickCol.selectAll('text.tick')
                .data(destinations);

            tickColEl.enter().call(addColTick);

            tickColEl.exit().remove();

            tickColEl
                .text(function(d){ return d; })
                .attr('y', function(d){ return columnScale(d) + columnScale.rangeBand()/2; });

            var tickRowEl = tickRow.selectAll('text.tick')
                .data(sources);

            tickRowEl.enter().call(addRowTick);

            tickRowEl
                .text(function(d){ return d; })
                .attr('y', function(d){return rowScale(d)  + rowScale.rangeBand()/2;});

            tickRowEl.exit().remove();
        }
    }

    // return variables that are needed outside this scope
    return {
        update: function(fragments) {
            debug("I should update the chord chart now");
           // TODO: implement
        }
    };
};

var updateSummary = function(element, summary) {
    var items = "";
    items += templates.defItem({key: "# Tuples", value: summary.numTuples});
    items += templates.defItem({key: "Local tuples sent", value: summary.localTuples});
    items += templates.defItem({key: "Duration", value: customFullTimeFormat(summary.duration)});
    items += templates.defItem({key: "Tuples per second", value: (summary.numTuples / summary.duration * 1000000).toFixed(3)});
    var dl = templates.defList({items: items});
    $(element.node()).html(dl);
};

var timeSeriesChart = function(element) {
    var margin = {top: 20, right: 70, bottom: 50, left:60 },
        width = parseInt(element.style('width'), 10),
        height = 300,
        chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom;

    var x = d3.scale.linear()
         .range([0, chartWidth]);

    var y = d3.scale.linear()
        .range([chartHeight, 0]);

    var xAxis = d3.svg.axis()
        .tickFormat(customTimeFormat)
        .tickSize(-height)
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var chart = element.select(".lines").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "timeseries")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    chart.append("text")
      //.attr("x", 5)
      //.attr("y", height - margin.bottom - 20)
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .style("text-anchor", "start")
      .attr('transform', 'translate(' + [-margin.left/(1.3),height - margin.bottom - 20] + ") rotate(-90)")
      .text("number of tuples");

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," +  (height - margin.bottom) + ")")
        .call(xAxis);

    chart.append("g")
         .attr("class", "y axis")
         .call(yAxis);

    var line = d3.svg.line()
        //.interpolate('cardinal')
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

    var activeKeys = [];
    var rawData = {};

    function add(newRawData, src, dest) {
        //pixel is a selection
        rawData = newRawData;
        activeKeys.push([src,dest]);
        draw();
    }

    function emptyActiveKeys() {
        activeKeys = [];
    }

    function batchAdd(newRawData, pairs) {

        rawData = newRawData;
        for (var i = 0; i < pairs.length; i++) {
            var exists = false;
            for (var j = 0; j < activeKeys.length; j++) {
              if (activeKeys[j][0]==pairs[i][0] && activeKeys[j][1]==pairs[i][1]) {
                  exists = true;
                  break;
              }
            }
            if (!exists)
                activeKeys.push(pairs[i]);
        }
        draw();
    }

    function remove(src, dest) {
        // remove from array O(n)
        var indexToRemove = -1;
        for (var i = 0; i < activeKeys.length; i++) {
            if (activeKeys[i][0]==src && activeKeys[i][1]==dest) {
                indexToRemove = i;
                break;
            }
        }
        activeKeys.splice(indexToRemove, 1);
        draw();
    }

    function getDist(x1,x2,y1,y2) {

        var xs = x1 - x2;
        xs = xs * xs;

        var ys = y1 - y2;
        ys = ys * ys;

        return Math.sqrt( xs + ys );

    }

    function getNearestPointOnLine(points, x, y) {

        var minDist = Number.MAX_VALUE;
        var minPoint, d;
        for (var i = 0; i < points.length; i++) {

            d = getDist(points[i][0], x, points[i][1], y);
            if (d < minDist) {
                minDist = d;
                minPoint = i;
            }
        }
        return minPoint;
    }

    function draw() {
        var chartData = _.values(_.pick(rawData, activeKeys));

        // don't update domain when last is removed
        if (activeKeys.length > 0) {
            var xDomain = [d3.min(_.pluck(chartData, 'begin')), d3.max(_.pluck(chartData, 'end'))],
                yDomain = [0, d3.max(_.pluck(chartData, 'maxTuples'))];

            x.domain(xDomain);
            y.domain(yDomain);

            /*
            var legend = chart.selectAll(".legend")
            .data(activeKeys)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0" + "," + (100 + i*10) + ")"; });

            legend.append("rect")
            .attr("x", 100)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", opColors);
            */
        }

        chart.selectAll(".y.axis")
            .transition(animationDuration)
            .call(yAxis);

        chart.selectAll(".x.axis")
            .transition(animationDuration)
            .call(xAxis);

        var pair = chart.selectAll(".pair")
            .data(chartData, function(d) { return [d.src, d.dest]; });

        var pairGroups = pair.enter().append("g")
            .attr("class", "pair");

        pairGroups.append("path")
            .on("mouseover", function(d) {
                d3.select("#pixel_" + d.pixelID)
                  .style("stroke-width",'5px');
              })
            .on("mouseout", function(d) {
                d3.select(this)
                  .style("stroke-width",'3px');

                d3.select("#pixel_" + d.pixelID)
                  .style("stroke-width", "3px");
            })
            .style("stroke-width", 3)
            .style("stroke", function(d,i) {
                d3.select("#pixel_" + d.pixelID)
                  .style("stroke", opColors(i));

                return opColors(i);
            })
            .attr("stroke-dasharray", function(d) {
                return (d.src != d.dest) ? ("0, 0") : ("3, 3");
            })
            .attr("class", "tsline");

        pairGroups.append("text")
            .attr("class", "line-label")
            .attr("dy", ".35em")
            .attr("dx", "8px")
            .text(function(d) {
                return templates.nwLineTooltip(d);
            });

        pair.transition(animationDuration).selectAll(".tsline")
            .attr("d", function(d) { return line(d.values); });

        pair.transition(animationDuration).selectAll(".line-label")
            .attr("x", function(d) { return x(_.last(d.values)[0]); })
            .attr("y", function(d) { return y(_.last(d.values)[1]); });

        pair.exit().remove();

        var dot = pair.selectAll("circle")
            .data(function(d) {
                return d.values;
            });

        dot.enter()
            .append("circle")
            .attr("r", 5);

        dot.attr("cx", function(d) {
                return x(d[0]);
            }).attr("cy", function(d) {
                return y(d[1]);
            }).tooltip(function(d) {
                return templates.nwPointTooltip({
                    numTuples: d[1],
                    time: customFullTimeFormat(d[0])
                });
            });
    }

    return {
        update: draw,
        add: add,
        batchAdd: batchAdd,
        remove: remove,
        emptyActiveKeys: emptyActiveKeys
    };
};
