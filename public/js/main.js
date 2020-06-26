
document.addEventListener("DOMContentLoaded", () => {

    for (let i = 0; i < temperature_history.timestamps.length; i++) {
        temperature_history.timestamps[i] = new Date(temperature_history.timestamps[i]);
    }

    var trace1 = {
        x: temperature_history.timestamps,
        y: temperature_history.values,
        type: 'scatter',
        mode: 'lines'
    };
    
    const layout = {
        xaxis: {
            type: 'date',
            dtick: 3600000 * 4,
            tickformat: '%H:%M',
            fixedrange: true,
        },
        yaxis: {
            fixedrange: true,
        },
        height: 300,
        width: 330,
        autosize: true,
        margin: {
            t: 0,
            l: 20,
            r: 0,
            b: 50,
            pad: 4
        },
    };

    const options = {
        displayModeBar: false,
    };
    var data = [trace1];
      
    Plotly.newPlot('temperatureBody', data, layout, options);
});