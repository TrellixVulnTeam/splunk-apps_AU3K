import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import vizUtils from 'api/SplunkVisualizationUtils';
import * as d3 from 'd3';
import $ from 'jquery';




function truncate(text='', limit=18) {
    if (text.length > limit) {
        return text.substr(0, limit) + '...';
    }
    return text;
}

function ascendingDateSort(a, b) {
    return a.date - b.date;
}

export default class SimpleTimeseries extends SplunkVisualizationBase {
    initialize() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.$el = $(this.el);
        this.setupView();
    }
    setupView() {
        this.$el.addClass('timeseries-viz');
    }
    _getEscapedProperty(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
    }
    formatData(data, config) {
        if (!data) {
            return false;
        }
        const formattedData = {
            fields: data.fields,
            series: {},
            statistics: {
                times: []
            }
        };

        const seriesNames = data.rows.map((row) => {
            return row[1];
        }).filter((value, index, array) => array.indexOf(value) === index);


        const groupedBySeries = {};
        const statistics = {
            times: []
        };

        const parseTime = d3.timeParse("%Y%m%d");
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        const times = [];
        data.rows.map((row) => {
            if (!groupedBySeries[row[1]]) {
                groupedBySeries[row[1]] = [];
            }
            const date = new Date(row[0]);
            if (!date) {
                return;
            }
            const val = window.isNaN(+row[2]) ? 0 : +row[2];
            const color = row[3] || false;
            groupedBySeries[row[1]].push({
                date: date,
                value: val,
                name: row[1],
                color: color
            });
            min = Math.min(min, val);
            max = Math.max(max, val);
            times.push(date);
        });
        // uniquify
        statistics.times = times.filter((value, index, array) => array.indexOf(value) === index);
        statistics.min = min;
        statistics.max = max;
        const orderedGroupedBySeries = {};

        Object.keys(groupedBySeries).forEach((key) => {
            const series = groupedBySeries[key];
            orderedGroupedBySeries[key] = series.sort(ascendingDateSort);
        });

        formattedData.statistics = statistics;
        formattedData.series = groupedBySeries;


        return formattedData;
    }
    updateView(data, config) {
        if (!data || data.series && data.series.length === 0 || !data.fields) {
            return;
        }

        const showLegend = vizUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config));
        const showDatapoints = vizUtils.normalizeBoolean(this._getEscapedProperty('showDatapoints', config));

        const colorScale = d3.scaleOrdinal(["#54c06c", "#9c0bff", "#d7011b", "#176eb2", "#d8a302", "#bf278e", "#d39e97", "#2dbdc5", "#0e5ff1", "#6c6e25", "#c996f5", "#a65425", "#96b80d", "#5c6d72", "#1dc60f", "#c13654", "#925780", "#a137cb", "#0b7956", "#9bb28b", "#a6a8d4", "#fb85b9", "#d1a460", "#fe8e3d", "#0ab8f4", "#fe77f3", "#ff8a78", "#327a09", "#655ec0", "#876347", "#9bb559", "#23c19c", "#604aff", "#9b49a8", "#91b1b7", "#a15359", "#8b6304", "#be4003", "#5b714d", "#d499c3", "#94a6fc", "#067493", "#686690", "#67c03d", "#baad32", "#d0026b", "#b24174", "#0c7775", "#c203ac", "#c03b33", "#836269", "#f18f9c", "#ee87dc", "#477633", "#d4053e", "#7850d5", "#bfa881", "#b008dc", "#78ba7f", "#04c553", "#6bbaa4", "#ef9561", "#805b9e", "#e49c3f", "#b7a6b4", "#62b6d3", "#f2960d", "#0f69ca", "#bf9edf", "#b5ad66", "#77afed", "#577403", "#027b36", "#ad4d3f", "#e6987f", "#a14b8e", "#aeab9e", "#2564db", "#5b65ae", "#e188fd", "#83662e", "#8c3ce6", "#726a5b", "#64c104", "#87ba48", "#9a5b3a", "#03c386", "#ad35af", "#9e5a01", "#d0a539", "#5f52ed", "#ba04c4", "#4b7264", "#d20b55", "#7ebb65", "#a1b53a", "#9447c0", "#426e9a", "#736b43", "#97b575", "#945f23", "#e88eca", "#da99aa", "#1bbfb2", "#afb104", "#6d687c", "#d6a077", "#c0aa4f", "#af4760", "#8356af", "#c02d7b", "#90aecd", "#8b32f8", "#6db7be", "#c92f1d", "#94596c", "#c23067", "#41c437", "#95b2a1", "#af4e06", "#ea90b5", "#7a6a09", "#437649", "#925d55", "#d893e0", "#38737f", "#806080", "#ae3c98", "#5e7138", "#526d86", "#b54723", "#a34f70", "#41b3ff", "#7b54c3", "#fe80cb", "#fe8d56", "#c6aa0b", "#bea2c6", "#025aff", "#7fbc27", "#09bcd7", "#575adb", "#b19ff5", "#a6a5e6", "#5ebd95", "#51c158", "#35765d", "#ce2602", "#d11a2d", "#0ac473", "#b94146", "#fe86a3", "#e19d59", "#55bf7f", "#ff7ae0", "#c82d44", "#82b792", "#cc0a7e", "#adaf79", "#c4a593", "#8945d8", "#afb052", "#fe898a", "#a709ee", "#e49794", "#b23d87", "#72686c", "#bc259f", "#5669a1", "#377927", "#577423", "#7b6090", "#e39d24", "#df8dee", "#b426ba", "#297942", "#caa1a9", "#d7a24c", "#71be54", "#0d7c22", "#f1954d", "#aead8c", "#c4a86e", "#9f5648", "#93529b", "#78adfc", "#a12ed9", "#6b6f06", "#64b4e2", "#616f5b", "#826458", "#ad4b50", "#0ebae5", "#715eaf", "#f19632", "#fc8d69", "#e39a70", "#a2abbe", "#a14e80", "#8d6136", "#d895d1", "#5abab6", "#d89e85", "#93558d", "#2a6bbc", "#8d4fb6", "#706d35", "#7cb6ac", "#f082ef", "#8eaddb", "#cb9eb8", "#7db3c5", "#0272a1", "#5f5cce", "#fd8f22", "#f19186", "#4b65c0", "#a3b266", "#6ebc74", "#c80595", "#9e28e7", "#497619", "#f19374", "#c49aea", "#4063cd", "#ad4e31", "#8fb769", "#1ac463", "#baa1d4", "#6a639e", "#4c52fb", "#7848ea", "#b93d64", "#3a7472", "#bf3d20", "#47bea4", "#a33bbd", "#82671d", "#b64635", "#9f42b3", "#92b834", "#bba7a2", "#a6acb0", "#91aaea", "#79684e", "#aeb140", "#8db684", "#56b4f1", "#80663d", "#c92c37", "#925e48", "#aea7c6", "#cca385", "#0b7c08", "#456aae", "#3dc08e", "#4bc401", "#d390fd", "#ef7ffd", "#7e3ff4", "#a4543b", "#9f4a9b", "#c4a85f", "#b74253", "#ca9bd1", "#a93ea5", "#01c630", "#adb22b", "#cb2061", "#b019d2", "#0a7964", "#786b29", "#8bb959", "#52b9c8", "#8e5d62", "#866073", "#ac4581", "#85b69d", "#e193c3", "#a45063", "#4a7457", "#6b6c51", "#636d65", "#865c87", "#f38caa", "#1162e6", "#666f43", "#a05730", "#9343cb", "#9d5a1b", "#49c34a", "#965e0f", "#e793aa", "#5e56e3", "#d9a068", "#764edf", "#50743f", "#576b90", "#7bb2d4", "#60c12c", "#97b748", "#3d7090", "#c72271", "#63bd87", "#1f6fa7", "#c7a92d", "#a0b522", "#9eafa8", "#6abe64", "#a55512", "#7bbc3e", "#0e767f", "#8c5c79", "#cca653", "#cb244e", "#a2af96", "#0c7589", "#796572", "#54706b", "#607215", "#7160a4", "#dd97b4", "#daa22f", "#b89bfc", "#d1a521", "#78be07", "#b728ac", "#307753", "#43c177", "#86b874", "#c1383d", "#963cd5", "#ef8bc0", "#746483", "#b0a1ea", "#c02a85", "#8d621e", "#5e6c7c", "#7c6562", "#e4969f", "#77ba8b", "#fe8799", "#b9ab72", "#477702", "#b6aa93", "#bfa3bb", "#f686c7", "#af24c7", "#b93877", "#835c94", "#14c0a7", "#3e773e", "#e79c08", "#9050ac", "#6eba99", "#97595f", "#c8302c", "#c8108b", "#4459ed", "#fd7ed6", "#8756a5", "#7858b9", "#e19a89", "#9babd0", "#cba47a", "#387568", "#3ec268"]);

        const margin = {top: 50, right: (showLegend ? 190 : 50), bottom: 50, left: 50};

        const width = this.$el.width() - margin.left - margin.right;
        const height = this.$el.height() - margin.top - margin.bottom;
        this.$el.empty();
        this.svgEl = d3.select(this.el)
            .append('svg');

        this.svgEl
            .attr('width', this.$el.width())
            .attr('height', this.$el.height());
        this.gEl = this.svgEl.append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const xScale = d3.scaleTime().range([0, width]);
        const yScale = d3.scaleLinear().range([height, 0]);

        const line = d3.line()
            //.curve(d3.curveBasis)
            .x((d) => {
                //console.log('x',d.date);
                return xScale(d.date);
            })
            .y((d) => {
                //console.log('y',d.value);
                return yScale(d.value)
            });


        yScale.domain([
            data.statistics.min,
            data.statistics.max
        ]);

        xScale.domain(d3.extent(data.statistics.times));

        this.gEl.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0, '+ height+')')
          .call(d3.axisBottom(xScale));

        this.gEl.append("g")
          .attr("class", "axis y")
          .attr('transform', 'translate(0,0)')
          .call(d3.axisLeft(yScale))
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("fill", "#000")
          .text(data.fields[2] ? data.fields[2]['name'] : '');

        const series = Object.values(data.series);
        const seriesNames = Object.keys(data.series);

        const serie = this.gEl.selectAll('.serie')
            .data(series)
            .enter().append('g')
                .attr('class', 'serie');


        const $tooltip = $('<div class="ttt"></div>');
        $tooltip.appendTo(this.$el);

        serie.append('path')
            .attr('class', 'line')
            .attr('d', d => line(d))
            .style('fill', 'none')
            .style("stroke", function(d, i) { const color = d[0]['color']; return color ? color : colorScale(i); })
            .style('stroke-width', '1.5px');

        serie.append('g')
            .selectAll('circle')
            .data(function(d) { return d; })
            .enter()
            .append('circle')
            .attr('cx', (d) => {
                //console.log('x',d.date);
                return xScale(d.date);
            })
            .attr('cy', (d) => {
                //console.log('x',d.date);
                return yScale(d.value);
            })
            .style('fill', 'white')
            .style('stroke', function(d){ return d3.select(this.parentNode.parentNode).select('.line').style('stroke'); })
            .style('stroke-width', '1.5px')
            .attr('r', function() { return showDatapoints ? 2 : 0; })
            .on('mouseover', function(d) {
                const me = d3.select(this);
                me.style('fill', me.style('stroke'));
                $tooltip.css('left', (margin.left + xScale(d.date)) + 'px');
                $tooltip.css('top', (yScale(d.value) - 5) + 'px');
                $tooltip.html('Time:&nbsp; '+ d.date.toISOString() + '<br />' + data.fields[1].name + ': ' + d.name + '<br />Value:&nbsp;'+d.value);
                $tooltip.show();
            })
            .on('mouseout', function(d) {
                const me = d3.select(this);
                me.style('fill', 'white');
                $tooltip.hide();
            });


        const elWidth = this.$el.width();
        const LEGEND_RECT_SIZE = 16;
        const LEGEND_SPACING = 3;
        const LEGEND_WIDTH = margin.right - 20;
        const LEGEND_MARGIN_TOP = margin.top;

        if (showLegend) {

            const legend = this.svgEl.selectAll('.legend')
                .data(colorScale.domain())
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function(d, i) {
                    var height = LEGEND_RECT_SIZE + LEGEND_SPACING;
                    var horz = elWidth - LEGEND_WIDTH;
                    var vert = i * height + LEGEND_MARGIN_TOP;
                    return 'translate(' + horz + ',' + vert + ')';
                })
                .on('mouseover', function(d, i) {

                    var currentLegendEl = d3.select(this);
                    var rect = currentLegendEl.select('rect');
                    currentLegendEl.select('text')
                        .style('font-weight', 'bold');

                    serie.selectAll('.line')
                        .transition(200)
                        .style('opacity', function() {
                            return rect.style('stroke') === d3.select(this).style('stroke') ? 1 : .1;
                        });
                })
                .on('mouseout', function(d, i) {
                    d3.select(this)
                        .select('text')
                            .style('font-weight', 'normal');
                    serie.selectAll('.line').transition(250).style('opacity', 1);
                })
            legend.append('rect')
              .attr('width', LEGEND_RECT_SIZE)
              .attr('height', LEGEND_RECT_SIZE)
              .attr('fill', colorScale)
              .attr('fill-opacity', .5)
              .attr('stroke-width', 1)
              .style('stroke', colorScale);

            legend.append('text')
              .attr('x', LEGEND_RECT_SIZE + 2 * LEGEND_SPACING)
              .attr('y', LEGEND_RECT_SIZE - LEGEND_SPACING + LEGEND_RECT_SIZE / 6)
              .text(function(d, i) { return truncate(seriesNames[i]); })
              .append('title')
                .text(function(d, i) { return seriesNames[i]; });
        }

        //console.log('updating view');
    }
    getInitialDataParams() {
        return ({
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        });
    }
    reflow() {
        this.invalidateUpdateView();
    }
}