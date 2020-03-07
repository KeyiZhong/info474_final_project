"use strict";
(function(){
  let rawData = ""
  let neighbourData = ""
  let hostData = ""
  let neighbourHostData = ""
  let calendarData = ""
  let m = {
    width: 800,
    height: 800
  }
  d3.select("body").append('select').attr("id","select")
  d3.csv('data/neighbourhoods.csv').then(function(data){
    d3.select('#select')
      .on('change',changeN)
      .selectAll("myOptions")
        .data(['University District'].concat(d3.map(data, function(d){return(d.neighbourhood)}).keys()))
      .enter()
        .append('option')
      .text(function(d){return d;})
      .attr("value", function(d){return d;})
  })

  let neighbourhood = 'University District'

  const svg = d3.select("body").append('svg')
      .attr('width', m.width)
      .attr('height', m.height)

  const g = svg.append('g')
  let div = d3.select("body").append('div')
      .attr("class", "tooltip")
      .style("opacity", 0)
  let tooltipSvg = div.append("svg")
      .attr('width', 500)
      .attr('height', 500);

  // large dataset
  // d3.csv("data/listing.csv").then(plotData=>hostData=plotData).then(plotMap)
  // d3.csv('data/calendar.csv').then(data=>calendarData = data)
  // d3.json('data/N2.geojson').then((data)=>rawData=data)

  // small dataset
  d3.csv("data/listings.csv").then(plotData=>hostData=plotData)
  d3.csv('data/calendar.csv').then(data=>calendarData = data)
  d3.json('data/N2.geojson').then((data)=>rawData=data).then(plotMap)

  function plotMap() {
    neighbourData = {"type":rawData.type,"features":rawData.features.filter(function(d){return d.properties.name == neighbourhood})}
    let latMid = d3.extent(neighbourData.features[0].geometry.coordinates[0], d => d[0])
    let longMid = d3.extent(neighbourData.features[0].geometry.coordinates[0], d => d[1])
    let albersProj = d3.geoAlbers()
                .scale(1300000)
                .rotate([-1*(latMid[0] + latMid[1])/2, 0])
                .center([0, (longMid[0] + longMid[1])/2])
                .translate([m.width/2, m.height/2]);
    let geoPath = d3.geoPath().projection(albersProj)
    g.selectAll('path')
      .data(neighbourData.features)
      .enter()
      .append('path')
          .attr('fill', '#ccc')
          .attr('d', geoPath)
    plotPoint(albersProj)
  }

  function plotPoint(albersProj){
    neighbourHostData = hostData.filter(function(d){return d.neighbourhood == neighbourhood})
    // neighbourHostData = hostData.filter(function(d){return d.neighbourhood_cleansed == neighbourhood})
    g.selectAll('.circle')
        .data(neighbourHostData)
        .enter()
        .append('circle')
            .attr('cx', function(d) {
                let scaledPoints = albersProj([parseFloat(d['longitude']) , parseFloat(d['latitude'])])
                return scaledPoints[0]
            })
            .attr('cy', function(d) {
                let scaledPoints = albersProj([parseFloat(d['longitude']) , parseFloat(d['latitude'])])
                return scaledPoints[1]
            })
            // .attr('r', function(d){return d.price/80})
            .attr('r', 5)
            .attr('fill', 'steelblue')
            .on("mouseover", (d) => {
              plotTooltip(d.id, d.host_name)
              div.transition()
                .duration(200)
                .style("opacity", .9);
              div.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 42) + "px");
            })
            .on("mouseout", (d) => {
              tooltipSvg.selectAll('*').remove();
              div.transition()
                .duration(500)
                .style("opacity", 0);
            })
    }

  function plotTooltip(id, host) {
    let hostData = calendarData.filter(function(d){return parseInt(d.listing_id) == id});
    let priceLimits = d3.extent(hostData, d => parseInt(d['price'].replace("$","")))
    // get scaling function for years (x axis)
    let yScale = d3.scaleLinear()
        .domain([priceLimits[1], priceLimits[0]])
        .range([25,450])
    let yAxis2 = tooltipSvg.append("g")
        .attr("transform", "translate(450,0)")
        .call(d3.axisRight(yScale))
    // get min and max life expectancy for US

    let dateLimits = d3.extent(hostData, d => new Date(d["date"]))
    // get scaling function for y axis
    let xScale = d3.scaleTime()
        .domain([dateLimits[0], dateLimits[1]])
        .range([25,450])
    let xAxis2 = tooltipSvg.append("g")
        .attr("transform", "translate(0,450)")
        .call(d3.axisBottom(xScale))
    let line = d3.line()
        .x(d => xScale(new Date(d['date']))) // set the x values for the line generator
        .y(d => yScale(parseInt(d['price'].replace("$","")))) // set the y values for the line generator
    // append line to svg
    tooltipSvg.append("path")
        // difference between data and datum:
        // https://stackoverflow.com/questions/13728402/what-is-the-difference-d3-datum-vs-data
        .datum(hostData)
        .attr("d", function(d) { return line(d) })
        .attr("fill", 'none')
        .attr("stroke", "steelblue")
    tooltipSvg.append("text")
      .attr('x', 100)
      .attr('y', 20)
      .attr('font-size', '10pt')
      .text('Time vs price of ' + host + '\'s house in ' + neighbourhood)
  }

  function changeN(e) {
    g.selectAll('*').remove()
    neighbourhood = d3.select(this).property("value")
    console.log(neighbourhood)
    plotMap();
  }
})();
