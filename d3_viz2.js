'use strict';
// Instead of monthly price, could do like availability year round?
(function() {

    let data = ""
    let svg = ""
    let tooltip = ""

    const measurements = {
        margin: 50,
        width: 500,
        height: 500
    }

    window.onload = function() {
        svg = d3.select("#viz2").append("svg")
            .attr("width", 700)
            .attr("height", 700);

        tooltip = d3.select("#viz2").append("div")
            .attr("class", "tooltip")
            .attr('style', 'position: absolute; opacity: 0;');

        d3.csv("data/listings.csv").then(function (data) {
            makeHistogram(data)
        })
    }

    function makeHistogram(data) {
        let price = data.map((row) => row["monthly_price"]);
        price = price.filter(Boolean);
        for (var i = 0; i < price.length; i++) {
          var number = Number(price[i].replace(/[^0-9\.]+/g,""));
          price[i] = number;
        }

        data.forEach(function (d) {
            d["monthly_price"] = d["monthly_price"].replace(/[\$,]/g, '')
            d["monthly_price"] = +d["monthly_price"]
        });

        let maxprice = d3.max(price);
        console.log(maxprice);
        let minprice = d3.min(price);
        console.log(minprice);
        var x = d3.scaleLinear()
                .domain([0, maxprice])
                .range([50, 500]);
            svg.append("g")
                .attr("transform", "translate(0," + 500 + ")")
                .call(d3.axisBottom(x));


        var histogram = d3.histogram()
                        .value(function(price) { return price; })
                        .domain(x.domain())
                        .thresholds(x.ticks(40));

        var bins = histogram(price);

        var y = d3.scaleLinear()
                .domain([d3.max(bins, function(d) { return d.length; }), 0])
                .range([0,450]);
            svg.append("g")
                .call(d3.axisLeft(y));

        drawAxes(x,y);

        svg.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0); })
            .attr("height", function(d) { return measurements.height - y(d.length); })
            .style("fill", "steelblue")
            .on("mouseover", function (d) {
                let tempData = data.filter(data => data["monthly_price"] >= d.x0 && data["monthly_price"] <= d.x1)
                tooltip.transition()
                .duration(200)
                .style("opacity", 1);

                tooltip.style("left", (d3.event.pageX + 30) + "px")
                .style("top", (d3.event.pageY - 120) + "px");

                let tSvg = tooltip.append("svg")
                    .attr("height", "300px")
                    .attr("width", "325px")

                // Appends text containing the name of the country that was hovered over to the linegraph
                tSvg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("x", (325) / 2)
                    .attr("y", (15))
                    .attr("fill", "black")
                    // .text(country);

                // nygeo data which contains information on the overall nyc map
                d3.json('data/neighbourhoods.geojson').then(function(mapdata) {
                    // console.log(mapdata)
                    // // data which contains information on individual points
                    // d3.csv('listings.csv').then(function(pointData) {

                        // scaling function to convert point data to map. Rotated to proper lat/long
                        const albersProj = d3.geoAlbers()
                            .scale(75000)
                            .rotate([122.340, 0])
                            .center([0, 47.607])
                            .translate([325/2, 300/2]);

                        // projects points onto the map
                        const geoPath = d3.geoPath()
                        .projection(albersProj)

                        // grouping for paths which compose nyc map
                        let sea = tSvg.append( "g" ).attr( "id", "sea" );
                        sea.selectAll('path')
                        .data(mapdata.features)
                        .enter()
                        .append('path')
                            .attr('fill', 'lightgray')
                            .attr('stroke', 'black')
                            .attr('d', geoPath)

                        // plots circles on the nyc map and adds on-click function
                        // that transitions point to new direction + removes point from map.
                        let bnb = tSvg.append( "g" ).attr( "id", "bnb" );
                        bnb.selectAll('.circle')
                            .data(tempData)
                            .enter()
                            .append('circle')
                                .attr('cx', function(d) {
                                    let scaledPoints = albersProj([d['longitude'], d['latitude']])
                                    return scaledPoints[0]
                                })
                                .attr('cy', function(d) {
                                    let scaledPoints = albersProj([d['longitude'], d['latitude']])
                                    return scaledPoints[1]
                                })
                                .attr('r', 4)
                                .attr('fill', 'steelblue')
                                .attr("stroke", "black")
                                .on( "click", function(){
                                    let thing = d3.select(this)
                                        .attr("opacity", 1)
                                        .transition()
                                            .duration( 2000 )
                                            .attr( "cy", 1000 )
                                            .attr( "opacity", 0 )
                                            .on("end", function(thing) {
                                                d3.select(this).remove();
                                            })
                                });


                    // })

                })
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(0)
                    .style("opacity", 0)
                tooltip.selectAll("svg")
                    .attr("height", "0px")
                    .attr("width", "0px")
            });
        }

    function drawAxes(scaleX, scaleY) {
        let xAxis = d3.axisBottom()
            .scale(scaleX)

        let yAxis = d3.axisLeft()
            .scale(scaleY)

        svg.append('g')
            .attr('transform', 'translate(50,50)')
            .call(yAxis)


        }
})()
