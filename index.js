
/**
 * This example shows how to plot points on a map
 * and how to work with normal geographical data that
 * is not in GeoJSON form
 *
 * Outline:
 * 1. show how to load multiple files of data
 * 2. talk about how geoAlbers() is a scaling function
 * 3. show how to plot points with geoAlbers
 */
const m = {
    width: 800,
    height: 800
}

const svg = d3.select("body").append('svg')
    .attr('width', m.width)
    .attr('height', m.height)

const g = svg.append('g')

// neighborhoods.json taken from rat map example
d3.json('data/neighbourhoods.geojson').then(function(data) {

    d3.csv('data/listings.csv').then(function(pointData) {

        const albersProj = d3.geoAlbers()
            .scale(150000)
            .rotate([122.340, 0])
            .center([0, 47.607])
            .translate([m.width/2, m.height/2]);

        // this code shows what albersProj really does
        let point = pointData[0]
        let arr = [ parseFloat(point['longitude']) , parseFloat(point['latitude']) ]
        let scaled = albersProj(arr)

        const geoPath = d3.geoPath()
        .projection(albersProj)

        g.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
            .attr('fill', '#ccc')
            .attr('d', geoPath)
        // let div = d3.select("body").append("div")
        // .attr("class", "tooltip")
        // .style("opacity", 0);
        // plots circles on the boston map
        g.selectAll('.circle')
            .data(pointData)
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
                .attr('r', 1)
                .attr('fill', 'steelblue')
                // .on("mouseover", (d) => {
                //   div.transition()
                //     .duration(200)
                //     .style("opacity", .9);
                //   div.html(d['neighbourhood_group'] + "<br/>" + d['room_type'] + "<br/>" + d['price'])
                //     .style("left", (d3.event.pageX) + "px")
                //     .style("top", (d3.event.pageY - 42) + "px");
                // })
                // .on("mouseout", (d) => {
                //   div.transition()
                //     .duration(500)
                //     .style("opacity", 0);
                // })
                .on( "click", function(){
                  d3.select(this)
                    .attr("opacity",1)
                    .transition()
                    .duration( 1000 )
                    .attr( "cx", m.width * Math.round( Math.random() ) )
                    .attr( "cy", m.height * Math.round( Math.random() ) )
                    .attr( "opacity", 0 )
                    .on("end",function(){
                      d3.select(this).remove();
                    })
                })
    })

})
