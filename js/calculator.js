window.calculator = initCalculator({
  groupName:            document.querySelector("input[name=groupName]"),
  numSpeakers:          document.querySelector("input[name=numSpeakers]"),
  populationPercentage: document.querySelector("input[name=populationPercentage]"),
  chart:                document.querySelector(".chart"),
  notes:                document.querySelector(".notes")
});

function initCalculator(options) {
  var groupName = options.groupName;
  var numSpeakers = options.numSpeakers;
  var populationPercentage = options.populationPercentage;
  var chart = options.chart;
  var notes = options.notes;
  var expectedNumber = options.expectedNumber = null;
  var data = options.data = null;

  setupEvents();
  recalculate();

  return options;

  function setupEvents() {
    groupName.addEventListener("change", updateNotes, false);
    groupName.addEventListener("keydown", zeroTimeout(updateNotes), false);
    numSpeakers.addEventListener("change", recalculate, false);
    numSpeakers.addEventListener("keydown", zeroTimeout(recalculate), false);
    populationPercentage.addEventListener("change", recalculate, false);
    populationPercentage.addEventListener("keydown", zeroTimeout(recalculate), false);
    window.addEventListener("resize", redraw, false);
  }

  function recalculate() {
    if (!numSpeakers.validity.valid || !populationPercentage.validity.valid)
      return;

    var populationFraction = populationPercentage.valueAsNumber/100;

    expectedNumber = numSpeakers.valueAsNumber * populationFraction;
    data = poisson(numSpeakers.valueAsNumber, populationFraction);

    redraw();
    updateNotes();
  }

  function redraw() {
    chart.innerHTML = '';
    renderChart(data, expectedNumber, chart);
  }

  function updateNotes() {
    notes.innerHTML = '';
    renderNotes(data, expectedNumber, groupName, notes);
  }
}

function zeroTimeout(callback) {
  return function() {
    window.setTimeout(callback, 0);
  }
}

function renderChart(data, expectedNumber, chart) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = chart.offsetWidth - margin.left - margin.right,
      height = chart.offsetHeight - margin.top - margin.bottom;

  var barWidth = width / data.length;

  var svg = d3.select(chart).append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
   .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
            .domain([0, d3.max(data)])
            .range([height, 0]);

  var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

  var yAxis = d3.svg.axis()
                .scale(y)
                .ticks(2)
                .orient("left");

  x.domain(data.map(function(d, i) { return i }));

  svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .call(xAxis);

  svg.append("g")
     .attr("class", "y axis")
     .call(yAxis);

  var bar = svg.selectAll(".bar").data(data)

  var g = bar.enter().append("g");
  g.append("rect");
  g.append("text");

  bar.exit().remove();

  bar.attr("class", function(d, i) {
       if (i < expectedNumber) return "bar under-representation";
       if (i > expectedNumber) return "bar over-representation";
       return "bar";
     });

  bar.select("rect")
     .attr("x", function(d, i) { return x(i) })
     .attr("y", y)
     .attr("width", x.rangeBand())
     .attr("height", function(d) { return height - y(d) });
}

function renderNotes(data, expectedNumber, groupName, notes) {
  var html = "<p>This selection has:</p><ul>";

  var overRepresentationProbability = data.filter(function(p, i) { return i > expectedNumber }).reduce(function(a, b) { return a+b }, 0);
  var underRepresentationProbability = data.filter(function(p, i) { return i < expectedNumber }).reduce(function(a, b) { return a+b }, 0);
  var noRepresentationProbability = data[0];

  html += "<li>a <span class='probability'>" + toPercentage(overRepresentationProbability) + "%</span> chance of over-representing " + groupName.value + "</li>";
  html += "<li>a <span class='probability'>" + toPercentage(underRepresentationProbability) + "%</span> chance of under-representing " + groupName.value + "</li>";
  html += "<li>a <span class='probability'>" + toPercentage(noRepresentationProbability) + "%</span> chance of not representing " + groupName.value + " at all</li>";

  html += "</ul>";

  if (noRepresentationProbability > 0 && overRepresentationProbability > 0) {
    var overVersusNone = (overRepresentationProbability/noRepresentationProbability).toPrecision(2);
    html += "<p>Over-representation is therefore about <span class='probability'>" + overVersusNone + " times</span> as likely as no representation.";
  }

  notes.innerHTML = html;

  function toPercentage(p) {
    return (p * 100).toPrecision(2);
  }
}

function poisson(n, p) {
  var probabilities = [];

  for (var i=0; i<=n; i++) {
    probabilities.push(fact(n) / (fact(i)*fact(n-i)) * Math.pow(p, i) * Math.pow(1-p, n-i));
  }

  return probabilities;
}

function fact(n) {
  if (n < 2) return 1;
  var out = n;
  while (--n) out *= n;
  return out;
}
