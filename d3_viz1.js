"use strict";
(function(){
  let rawData = ""
  let neighbourData = ""
  let hostData = ""
  let listData = ""
  let calendarData = ""
  let m = {
    width: 700,
    height: 700
  }
  d3.select("#viz1")
    .append('div')
    .attr('id','filter')
  addFilter();
  let neighbourhood = 'University District'
  // let roomType = ['Entire home/apt', 'Private room', 'Hotel room', 'Shared Room']

  const svg = d3.select("#viz1").append('svg')
      .attr('width', m.width)
      .attr('height', m.height)

  const g = svg.append('g')
  const zoom = d3.zoom()
      .scaleExtent([-8, 8])
      .on('zoom', function(d){
        let centered;
        zoomed();
      });
  svg.call(zoom);
  let div = d3.select("#viz1").append('div')
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
  showLoading()
  d3.csv("data/listings.csv").then(plotData=>listData=plotData)
    .then(function(data){d3.csv('data/calendar.csv').then(data=>calendarData = data)
    .then(function(data){d3.json('data/N2.geojson').then((data)=>rawData=data)
      .then(function(){
        d3.select('#loading').remove();
        plotMap()
      })
    })
  })

  function addFilter() {
    d3.select('#filter')
      .append('select')
      .attr("id","select")
    d3.csv('data/neighbourhoods.csv').then(function(data){
      d3.select('#select')
        .on('change',changeN)
        .selectAll("myOptions")
          .data(['University District(select a neighbourhood)'].concat(d3.map(data, function(d){return(d.neighbourhood)}).keys()))
        .enter()
          .append('option')
        .text(function(d){return d;})
        .attr("value", function(d){return d;})
    })
    // d3.select('#filter')
    //   .append('select')
    //   .attr("id","selectRoomType")
    //   .attr("type","checkbox")
    // d3.select('#selectRoomType')
    //   .on('change',changeRoomType)
    //   .selectAll("myOptions")
    //     .data(['Entire home/apt', 'Private room', 'Hotel room', 'Shared Room'])
    //   .enter()
    //     .append('option')
    //   .text(function(d){return d;})
    //   .attr("value", function(d){return d;})
  }

  // plot the map of seattle
  function plotMap() {
    console.log(listData)
    console.log(calendarData)
    let albersProj = d3.geoAlbers()
                      .scale(m.width*m.height/4)
                      .rotate([122.340, 0])
                      .center([0, 47.607])
                      .translate([m.width/2, m.height/2]);
    let geoPath = d3.geoPath().projection(albersProj)
    g.selectAll('path')
      .data(rawData.features)
      .enter()
      .append('path')
          .attr('fill', d=>d.properties.name==neighbourhood?'yellow':'#ccc')
          .attr('d', geoPath)
          .attr('stroke','black')
          .attr('id', d=>d.properties.name==neighbourhood?'highlighted':'normal')
    g.selectAll('#highlighted')
      .on('click', function(d){clickZoom(d,geoPath)})
    plotPoint(albersProj)
  }

  // zoom effect to a highlighted area
  let centered
  function clickZoom(d,path) {
    let x,y,k;
    if (d && centered !== d) {
      // zoom in
      let centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      // zoom out
      x = m.width/2;
      y = m.height/2;
      k = 1;
      centered = null;
    }
    g.selectAll("path")
        .classed("active", centered && function(d) { return d === centered; });
    g.transition()
        .duration(750)
        .attr("transform", "translate("+x+","+y+")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
  }

  // pan and zoom effect to map
  function zoomed() {
        g.selectAll('path') // To prevent stroke width from scaling
          .attr('transform', d3.event.transform);
        g.selectAll('circle') // To prevent stroke width from scaling
          .attr('transform', d3.event.transform);
  }

  function drawLegend(cScale) {
    let defs = svg.append("defs");
    let linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", 'lightblue');
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "darkblue");
    svg.append("rect")
        .attr("width", m.width/4)
        .attr("height", m.height/40)
        .attr("transform", "translate(40,40)rotate(90)")
        .style("fill", "url(#linear-gradient)");
    let y = d3.scaleLinear()
      .range([0, m.width/4])
      .domain([20, 500]);
    let yAxis = d3.axisRight()
      .scale(y)
      .ticks(5);
    svg.append("g")
      .attr("transform", "translate(40,40)")
      .call(yAxis)
      .append("text")
      .style("text-anchor", "end")
      .text("axis title");
  }

  function plotPoint(albersProj){
    // neighbourHostData = hostData.filter(function(d){return d.neighbourhood == neighbourhood})
    // neighbourHostData = hostData.filter(function(d){return d.neighbourhood_cleansed == neighbourhood})
    // let filteredListData = listData.filter(function(d){return parseInt(d.room_type) == roomType});
    let cScale = d3.scaleLinear()
        .domain([20, 500])
        .range(['lightblue','darkblue'])
    drawLegend(cScale);
    g.selectAll('.circle')
        .data(listData)
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
            .attr('r', 1)
            .attr('fill', (d)=>cScale(d.price.replace("$","")))
            .on("mouseover", (d) => {
              plotTooltip(d.id, d.host_name)
              div.transition()
                .duration(200)
                .style("opacity", .9);
              div.style("left",(d3.event.pageX) + "px")
                .style("top", d3.event.pageY>300?"300px":(d3.event.pageY - 42) + "px");
            })
            .on("mouseout", (d) => {
              tooltipSvg.selectAll('*').remove();
              div.transition()
                .duration(500)
                .style("opacity", 0);
            })
  }

  function plotTooltip(id, host) {
    hostData = calendarData.filter(function(d){return parseInt(d.listing_id) == id});
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
    g.selectAll("*").remove();
    neighbourhood = d3.select(this).property("value")
    plotMap();
  }

  // function changeRoomType(e) {
  //   g.selectAll("*").remove();
  //   roomType = d3.select(this).property("value")
  //   plotMap();
  // }

  function showLoading() {
    svg.append('text')
      .attr('x', 330)
      .attr('y', 390)
      .attr('id', 'loading')
      .attr('font-size', '10pt')
      .text('Loading...')
  }
})();
